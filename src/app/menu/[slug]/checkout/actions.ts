"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateCartTotals, getCartForRestaurant } from "@/lib/cart";
import { buildOrderCode } from "@/lib/order-code";
import { prisma } from "@/lib/prisma";
import { addRecentOrder } from "@/lib/recent-orders";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

const checkoutSchema = z.object({
  restaurantSlug: z.string().min(2),
  orderType: z.enum(["delivery", "pickup", "dine_in"]),
  paymentMode: z.enum(["cod", "upi_qr", "payment_link"]),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  deliveryAddress: z.string().optional(),
  landmark: z.string().optional(),
  pickupTime: z.string().optional(),
  tableNumber: z.string().optional(),
  instructions: z.string().optional()
});

export async function placeOrderAction(formData: FormData) {
  const data = checkoutSchema.safeParse({
    restaurantSlug: formData.get("restaurantSlug"),
    orderType: formData.get("orderType"),
    paymentMode: formData.get("paymentMode"),
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    deliveryAddress: formData.get("deliveryAddress"),
    landmark: formData.get("landmark"),
    pickupTime: formData.get("pickupTime"),
    tableNumber: formData.get("tableNumber"),
    instructions: formData.get("instructions")
  });

  if (!data.success) {
    redirect(`/menu/${formData.get("restaurantSlug")}/checkout?error=invalid`);
  }

  const input = data.data;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: input.restaurantSlug }
  });

  if (!restaurant) redirect(`/menu/${input.restaurantSlug}`);
  const subscriptionState = evaluateRestaurantSubscription(restaurant);

  if (subscriptionState.orderingBlocked) {
    redirect(`/menu/${input.restaurantSlug}/cart?error=ordering_unavailable`);
  }

  if (input.orderType === "delivery" && !restaurant.deliveryEnabled) {
    redirect(`/menu/${input.restaurantSlug}/checkout?error=delivery_disabled`);
  }

  if (input.orderType === "pickup" && !restaurant.pickupEnabled) {
    redirect(`/menu/${input.restaurantSlug}/checkout?error=pickup_disabled`);
  }

  if (input.orderType === "dine_in" && !restaurant.dineInEnabled) {
    redirect(`/menu/${input.restaurantSlug}/checkout?error=dine_in_disabled`);
  }

  if (input.paymentMode === "cod" && !restaurant.codEnabled) {
    redirect(`/menu/${input.restaurantSlug}/checkout?error=cod_disabled`);
  }

  if (input.paymentMode === "upi_qr" && !restaurant.upiQrEnabled) {
    redirect(`/menu/${input.restaurantSlug}/checkout?error=upi_disabled`);
  }

  if (input.paymentMode === "payment_link" && !restaurant.upiQrEnabled) {
    redirect(`/menu/${input.restaurantSlug}/checkout?error=payment_link_disabled`);
  }

  const cart = await getCartForRestaurant(restaurant.id);

  if (!cart || cart.items.length === 0) {
    redirect(`/menu/${input.restaurantSlug}/cart?error=empty_cart`);
  }

  const totals = calculateCartTotals(cart, input.orderType);

  if (totals.subtotal < Number(restaurant.minimumOrderAmount)) {
    redirect(`/menu/${input.restaurantSlug}/checkout?error=minimum_order`);
  }

  if (input.orderType === "delivery" && !input.deliveryAddress?.trim()) {
    redirect(`/menu/${input.restaurantSlug}/checkout?error=address_required`);
  }

  if (input.orderType === "dine_in" && !input.tableNumber?.trim()) {
    redirect(`/menu/${input.restaurantSlug}/checkout?error=table_required`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: {
        restaurantId_phone: {
          restaurantId: restaurant.id,
          phone: input.customerPhone
        }
      },
      update: {
        name: input.customerName,
        totalOrders: { increment: 1 },
        totalSpend: { increment: totals.totalAmount },
        lastOrderDate: new Date()
      },
      create: {
        restaurantId: restaurant.id,
        name: input.customerName,
        phone: input.customerPhone,
        totalOrders: 1,
        totalSpend: totals.totalAmount,
        lastOrderDate: new Date()
      }
    });

    const latestOrder = await tx.order.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true }
    });

    const orderNumber = (latestOrder?.orderNumber ?? 1000) + 1;
    const orderCode = buildOrderCode(restaurant.name, orderNumber);
    const paymentStatus =
      input.paymentMode === "cod" ? "cod" : "payment_pending_verification";

    const order = await tx.order.create({
      data: {
        restaurantId: restaurant.id,
        customerId: customer.id,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        orderNumber,
        orderCode,
        orderType: input.orderType,
        status: "pending",
        paymentStatus,
        paymentMode: input.paymentMode,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        deliveryCharge: totals.deliveryCharge,
        packingCharge: totals.packingCharge,
        totalAmount: totals.totalAmount,
        deliveryAddress: input.deliveryAddress || null,
        landmark: input.landmark || null,
        pickupTime: input.pickupTime || null,
        tableNumber: input.tableNumber || null,
        instructions: input.instructions || null,
        items: {
          create: cart.items.map((item) => ({
            menuItemId: item.menuItemId,
            itemName: item.menuItem.name,
            unitPrice: item.menuItem.price,
            quantity: item.quantity,
            notes: item.notes
          }))
        },
        statusHistory: {
          create: {
            status: "pending",
            note: "Order placed from public checkout."
          }
        },
        payments: {
          create: {
            restaurantId: restaurant.id,
            mode: input.paymentMode,
            status: paymentStatus,
            amount: totals.totalAmount,
            instructions:
              input.paymentMode === "cod"
                ? "Cash/COD selected by customer."
                : restaurant.paymentInstructions
          }
        }
      }
    });

    if (restaurant.perOrderFeeEnabled) {
      const billingMonth = new Date().toISOString().slice(0, 7);
      await tx.platformFeeLedger.create({
        data: {
          restaurantId: restaurant.id,
          orderId: order.id,
          orderAmount: totals.totalAmount,
          platformFeeAmount: restaurant.perOrderFeeAmount,
          feeType: "per_order",
          billingMonth,
          status: "unpaid"
        }
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({
      where: { id: cart.id },
      data: { couponId: null, customerId: customer.id, customerInstructions: null }
    });

    return order;
  });

  revalidatePath(`/menu/${input.restaurantSlug}/cart`);
  revalidatePath(`/menu/${input.restaurantSlug}/checkout`);
  await addRecentOrder(restaurant.id, result.id);
  redirect(`/menu/${input.restaurantSlug}/orders/${result.id}/confirmation`);
}
