"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCartForRestaurant } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

async function getRestaurant(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, slug: true }
  });

  if (!restaurant) redirect(`/menu/${slug}`);
  return restaurant;
}

export async function updateCartItemAction(formData: FormData) {
  const slug = String(formData.get("restaurantSlug") || "");
  const cartItemId = String(formData.get("cartItemId") || "");
  const quantity = z.coerce.number().int().min(0).max(20).parse(
    formData.get("quantity") || 0
  );
  const restaurant = await getRestaurant(slug);
  const cart = await getCartForRestaurant(restaurant.id);

  const item = cart?.items.find((cartItem) => cartItem.id === cartItemId);
  if (!cart || !item) redirect(`/menu/${slug}/cart?error=not_found`);

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });
  }

  revalidatePath(`/menu/${slug}/cart`);
  redirect(`/menu/${slug}/cart`);
}

export async function removeCartItemAction(formData: FormData) {
  const slug = String(formData.get("restaurantSlug") || "");
  const cartItemId = String(formData.get("cartItemId") || "");
  const restaurant = await getRestaurant(slug);
  const cart = await getCartForRestaurant(restaurant.id);
  const item = cart?.items.find((cartItem) => cartItem.id === cartItemId);

  if (!cart || !item) redirect(`/menu/${slug}/cart?error=not_found`);

  await prisma.cartItem.delete({ where: { id: cartItemId } });
  revalidatePath(`/menu/${slug}/cart`);
  redirect(`/menu/${slug}/cart`);
}

export async function applyCouponAction(formData: FormData) {
  const slug = String(formData.get("restaurantSlug") || "");
  const code = String(formData.get("couponCode") || "").trim().toUpperCase();
  const restaurant = await getRestaurant(slug);
  const cart = await getCartForRestaurant(restaurant.id);

  if (!cart) redirect(`/menu/${slug}/cart?error=empty_cart`);

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
    redirect(`/menu/${slug}/cart?error=invalid_coupon`);
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: coupon.id }
  });

  revalidatePath(`/menu/${slug}/cart`);
  redirect(`/menu/${slug}/cart?coupon=applied`);
}

export async function clearCouponAction(formData: FormData) {
  const slug = String(formData.get("restaurantSlug") || "");
  const restaurant = await getRestaurant(slug);
  const cart = await getCartForRestaurant(restaurant.id);

  if (cart) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null }
    });
  }

  revalidatePath(`/menu/${slug}/cart`);
  redirect(`/menu/${slug}/cart`);
}
