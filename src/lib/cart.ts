import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const CART_SESSION_COOKIE = "restrowa_cart_session";

export async function getCartSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (existing) return existing;

  const sessionId = randomUUID();
  cookieStore.set(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60,
    path: "/"
  });

  return sessionId;
}

export async function getOrCreateCart(restaurantId: string) {
  const sessionId = await getCartSessionId();
  const existingCart = await prisma.cart.findFirst({
    where: { restaurantId, sessionId },
    orderBy: { updatedAt: "desc" }
  });

  if (existingCart) return existingCart;

  return prisma.cart.create({
    data: { restaurantId, sessionId }
  });
}

export async function getCartForRestaurant(restaurantId: string) {
  const sessionId = await getCartSessionId();
  return prisma.cart.findFirst({
    where: { restaurantId, sessionId },
    orderBy: { updatedAt: "desc" },
    include: {
      coupon: true,
      items: {
        orderBy: { createdAt: "asc" },
        include: { menuItem: true }
      },
      restaurant: true
    }
  });
}

export async function getExistingCartForRestaurant(restaurantId: string) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  return prisma.cart.findFirst({
    where: { restaurantId, sessionId },
    orderBy: { updatedAt: "desc" },
    include: {
      coupon: true,
      items: {
        orderBy: { createdAt: "asc" },
        include: { menuItem: true }
      },
      restaurant: true
    }
  });
}

export function calculateCartTotals(
  cart: NonNullable<Awaited<ReturnType<typeof getCartForRestaurant>>>,
  orderType: "delivery" | "pickup" | "dine_in" = "delivery"
) {
  const subtotal = cart.items.reduce(
    (total, item) => total + Number(item.menuItem.price) * item.quantity,
    0
  );

  let discountAmount = 0;
  const coupon = cart.coupon;
  const now = new Date();

  if (
    coupon?.active &&
    coupon.startDate <= now &&
    coupon.endDate >= now &&
    subtotal >= Number(coupon.minimumOrderAmount)
  ) {
    discountAmount =
      coupon.discountType === "flat"
        ? Number(coupon.discountValue)
        : (subtotal * Number(coupon.discountValue)) / 100;

    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }

    discountAmount = Math.min(discountAmount, subtotal);
  }

  const deliveryCharge =
    orderType === "delivery"
      ? cart.restaurant.freeDeliveryAbove &&
        subtotal >= Number(cart.restaurant.freeDeliveryAbove)
        ? 0
        : Number(cart.restaurant.deliveryCharge)
      : 0;

  const packingCharge = 0;
  const totalAmount = Math.max(
    0,
    subtotal - discountAmount + deliveryCharge + packingCharge
  );

  return {
    subtotal,
    discountAmount,
    deliveryCharge,
    packingCharge,
    totalAmount,
    itemCount: cart.items.reduce((total, item) => total + item.quantity, 0)
  };
}
