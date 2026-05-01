import type { getCartForRestaurant } from "@/lib/cart";
import { calculateCartTotals } from "@/lib/cart";

type HydratedCart = NonNullable<Awaited<ReturnType<typeof getCartForRestaurant>>>;

export type PublicCartSnapshot = {
  couponCode: string | null;
  deliveryCharge: number;
  discountAmount: number;
  itemCount: number;
  items: Array<{
    id: string;
    lineTotal: number;
    menuItem: {
      id: string;
      imageUrl: string | null;
      name: string;
      price: number;
    };
    quantity: number;
  }>;
  subtotal: number;
  totalAmount: number;
};

export function buildPublicCartSnapshot(cart: HydratedCart): PublicCartSnapshot {
  const totals = calculateCartTotals(cart);

  return {
    couponCode: cart.coupon?.code ?? null,
    deliveryCharge: totals.deliveryCharge,
    discountAmount: totals.discountAmount,
    itemCount: totals.itemCount,
    items: cart.items.map((item) => ({
      id: item.id,
      lineTotal: Number(item.menuItem.price) * item.quantity,
      menuItem: {
        id: item.menuItemId,
        imageUrl: item.menuItem.imageUrl,
        name: item.menuItem.name,
        price: Number(item.menuItem.price)
      },
      quantity: item.quantity
    })),
    subtotal: totals.subtotal,
    totalAmount: totals.totalAmount
  };
}
