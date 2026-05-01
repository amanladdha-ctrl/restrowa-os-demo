import { NextResponse } from "next/server";
import { z } from "zod";
import { getCartForRestaurant } from "@/lib/cart";
import {
  buildPublicCartSnapshot,
  type PublicCartSnapshot
} from "@/lib/public-cart-snapshot";
import { prisma } from "@/lib/prisma";

const cartMutationSchema = z.object({
  action: z.enum(["updateItem", "removeItem", "applyCoupon", "clearCoupon"]),
  restaurantSlug: z.string().min(1),
  cartItemId: z.string().optional(),
  couponCode: z.string().optional(),
  quantity: z.number().int().min(0).max(20).optional()
});

function responseWithCart(cart: PublicCartSnapshot | null) {
  return NextResponse.json({
    cart,
    ok: true
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = cartMutationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid cart update request.", ok: false },
      { status: 400 }
    );
  }

  const { action, cartItemId, couponCode, quantity, restaurantSlug } = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { id: true }
  });

  if (!restaurant) {
    return NextResponse.json(
      { message: "Restaurant not found.", ok: false },
      { status: 404 }
    );
  }

  const cart = await getCartForRestaurant(restaurant.id);

  if (!cart) {
    return NextResponse.json(
      { message: "Your cart is empty.", ok: false },
      { status: 404 }
    );
  }

  if (action === "updateItem") {
    const item = cart.items.find((entry) => entry.id === cartItemId);
    if (!item || quantity === undefined) {
      return NextResponse.json(
        { message: "Cart item was not found.", ok: false },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity }
      });
    }
  }

  if (action === "removeItem") {
    const item = cart.items.find((entry) => entry.id === cartItemId);
    if (!item) {
      return NextResponse.json(
        { message: "Cart item was not found.", ok: false },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({ where: { id: item.id } });
  }

  if (action === "applyCoupon") {
    const code = couponCode?.trim().toUpperCase() ?? "";
    const coupon = await prisma.coupon.findUnique({
      where: {
        restaurantId_code: {
          restaurantId: restaurant.id,
          code
        }
      }
    });

    const now = new Date();
    const subtotal = cart.items.reduce(
      (total, item) => total + Number(item.menuItem.price) * item.quantity,
      0
    );

    if (
      !coupon ||
      !coupon.active ||
      coupon.startDate > now ||
      coupon.endDate < now ||
      subtotal < Number(coupon.minimumOrderAmount)
    ) {
      return NextResponse.json(
        { message: "Coupon is not valid for this cart.", ok: false },
        { status: 400 }
      );
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id }
    });
  }

  if (action === "clearCoupon") {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null }
    });
  }

  const refreshedCart = await getCartForRestaurant(restaurant.id);
  return responseWithCart(
    refreshedCart && refreshedCart.items.length > 0
      ? buildPublicCartSnapshot(refreshedCart)
      : null
  );
}
