"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getOrCreateCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

export async function addToCartAction(formData: FormData) {
  const restaurantSlug = String(formData.get("restaurantSlug") || "");
  const menuItemId = String(formData.get("menuItemId") || "");
  const quantity = z.coerce.number().int().min(1).max(20).parse(
    formData.get("quantity") || 1
  );

  const item = await prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      available: true,
      restaurant: {
        slug: restaurantSlug,
        status: { notIn: ["suspended", "inactive"] }
      }
    },
    include: { restaurant: true }
  });

  if (!item) {
    redirect(`/menu/${restaurantSlug}?error=item_unavailable`);
  }

  const cart = await getOrCreateCart(item.restaurantId);
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, menuItemId: item.id }
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(existing.quantity + quantity, 20) }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId: item.id,
        quantity
      }
    });
  }

  revalidatePath(`/menu/${restaurantSlug}`);
  revalidatePath(`/menu/${restaurantSlug}/cart`);
  redirect(`/menu/${restaurantSlug}?added=1`);
}
