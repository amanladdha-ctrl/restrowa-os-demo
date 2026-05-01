import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateCartTotals, getOrCreateCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

const addToCartSchema = z.object({
  restaurantSlug: z.string().min(1),
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = addToCartSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid add to cart request." },
      { status: 400 }
    );
  }

  const { menuItemId, quantity, restaurantSlug } = parsed.data;

  const item = await prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      available: true,
      restaurant: {
        slug: restaurantSlug,
        status: { notIn: ["suspended", "inactive"] }
      }
    },
    include: {
      restaurant: true
    }
  });

  if (!item) {
    return NextResponse.json(
      { ok: false, message: "Item is not available right now." },
      { status: 404 }
    );
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

  const hydratedCart = await prisma.cart.findFirst({
    where: { id: cart.id },
    include: {
      coupon: true,
      items: {
        orderBy: { createdAt: "asc" },
        include: { menuItem: true }
      },
      restaurant: true
    }
  });

  if (!hydratedCart) {
    return NextResponse.json(
      { ok: false, message: "Cart could not be refreshed." },
      { status: 500 }
    );
  }

  const totals = calculateCartTotals(hydratedCart);

  return NextResponse.json({
    ok: true,
    itemCount: totals.itemCount,
    totalAmount: totals.totalAmount
  });
}
