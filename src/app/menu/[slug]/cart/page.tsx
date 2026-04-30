import Link from "next/link";
import { notFound } from "next/navigation";
import { FoodImage } from "@/components/food-image";
import { StatusBadge } from "@/components/status-badge";
import {
  applyCouponAction,
  clearCouponAction,
  removeCartItemAction,
  updateCartItemAction
} from "@/app/menu/[slug]/cart/actions";
import { calculateCartTotals, getCartForRestaurant } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid_coupon: "Coupon is not valid for this cart.",
  empty_cart: "Your cart is empty.",
  not_found: "Cart item was not found.",
  ordering_unavailable: "Online ordering is temporarily unavailable for this restaurant."
};

export default async function CartPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug }
  });

  if (!restaurant) notFound();

  const cart = await getCartForRestaurant(restaurant.id);
  const totals = cart ? calculateCartTotals(cart) : null;
  const subscriptionState = evaluateRestaurantSubscription(restaurant);

  return (
    <main className="min-h-screen px-4 py-5">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-clay">
              Cart
            </p>
            <h1 className="mt-2 text-3xl font-black text-ink">{restaurant.name}</h1>
            <p className="mt-1 text-sm text-slate-500">Review items before checkout.</p>
          </div>
          <StatusBadge value={subscriptionState.effectiveStatus} />
        </div>

        {query.error ? (
          <div className="mt-5 rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {errorMessages[query.error] ?? "Something went wrong."}
          </div>
        ) : null}

        {query.coupon === "applied" ? (
          <div className="mt-5 rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            Coupon applied.
          </div>
        ) : null}

        {!cart || cart.items.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-cream p-8 text-center">
            <h2 className="text-2xl font-black text-ink">Cart is empty</h2>
            <p className="mt-2 text-sm text-slate-600">
              Add items from the public menu to continue.
            </p>
            <Link
              className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
              href={`/menu/${slug}`}
            >
              Back to menu
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4">
              {cart.items.map((item) => (
                <article
                  className="rounded-3xl border border-orange-100 bg-cream p-4"
                  key={item.id}
                >
                  <div className="flex gap-4">
                    <FoodImage alt={item.menuItem.name} src={item.menuItem.imageUrl} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-black text-ink">{item.menuItem.name}</h2>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatCurrency(item.menuItem.price.toString())} each
                          </p>
                        </div>
                        <p className="font-black text-clay">
                          {formatCurrency(
                            Number(item.menuItem.price) * item.quantity
                          )}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <form action={updateCartItemAction} className="flex gap-2">
                          <input name="restaurantSlug" type="hidden" value={slug} />
                          <input name="cartItemId" type="hidden" value={item.id} />
                          <input
                            className="w-20 rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm font-bold"
                            max="20"
                            min="0"
                            name="quantity"
                            type="number"
                            defaultValue={item.quantity}
                          />
                          <button className="rounded-2xl bg-ink px-4 py-2 text-sm font-black text-white">
                            Update
                          </button>
                        </form>
                        <form action={removeCartItemAction}>
                          <input name="restaurantSlug" type="hidden" value={slug} />
                          <input name="cartItemId" type="hidden" value={item.id} />
                          <button className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-700">
                            Remove
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <section className="mt-6 rounded-3xl bg-cream p-5">
              <h2 className="text-xl font-black text-ink">Coupon</h2>
              {cart.coupon ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                  <p className="font-black text-emerald-700">{cart.coupon.code}</p>
                  <form action={clearCouponAction}>
                    <input name="restaurantSlug" type="hidden" value={slug} />
                    <button className="text-sm font-black text-red-700">Remove</button>
                  </form>
                </div>
              ) : (
                <form action={applyCouponAction} className="mt-3 flex gap-2">
                  <input name="restaurantSlug" type="hidden" value={slug} />
                  <input
                    className="min-w-0 flex-1 rounded-2xl border border-orange-100 bg-white px-4 py-3 font-bold uppercase"
                    name="couponCode"
                    placeholder="DEMO10"
                  />
                  <button className="rounded-2xl bg-saffron px-5 py-3 text-sm font-black text-white">
                    Apply
                  </button>
                </form>
              )}
            </section>

            <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft">
              <h2 className="text-xl font-black text-ink">Bill summary</h2>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(totals?.subtotal ?? 0)}</strong>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <strong>-{formatCurrency(totals?.discountAmount ?? 0)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Delivery estimate</span>
                  <strong>{formatCurrency(totals?.deliveryCharge ?? 0)}</strong>
                </div>
                <div className="mt-3 flex justify-between border-t border-orange-100 pt-3 text-lg font-black">
                  <span>Total</span>
                  <span>{formatCurrency(totals?.totalAmount ?? 0)}</span>
                </div>
              </div>

              {subscriptionState.orderingBlocked ? (
            <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {subscriptionState.customerNotice?.body ??
                "Online ordering is temporarily unavailable for this restaurant."}
            </div>
          ) : (
                <Link
                  className="mt-5 flex justify-center rounded-2xl bg-ink px-5 py-4 text-base font-black text-white"
                  href={`/menu/${slug}/checkout`}
                >
                  Continue to checkout
                </Link>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
