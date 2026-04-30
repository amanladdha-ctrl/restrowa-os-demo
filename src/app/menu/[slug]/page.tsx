import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { FoodImage } from "@/components/food-image";
import { StatusBadge } from "@/components/status-badge";
import { addToCartAction } from "@/app/menu/actions";
import { calculateCartTotals, getExistingCartForRestaurant } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getRecentOrdersForRestaurant } from "@/lib/recent-orders";
import { getRestaurantOpenState } from "@/lib/restaurant-open";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

export const dynamic = "force-dynamic";

export default async function PublicMenuPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { available: true },
            orderBy: { sortOrder: "asc" }
          }
        }
      }
    }
  });

  if (!restaurant) {
    notFound();
  }

  const subscriptionState = evaluateRestaurantSubscription(restaurant);
  const openState = getRestaurantOpenState(
    restaurant.openingTime,
    restaurant.closingTime
  );
  const itemCount = restaurant.categories.reduce(
    (total, category) => total + category.items.length,
    0
  );
  const cart = await getExistingCartForRestaurant(restaurant.id);
  const cartTotals = cart ? calculateCartTotals(cart) : null;
  const recentOrderRefs = await getRecentOrdersForRestaurant(restaurant.id);
  const recentOrders = recentOrderRefs.length
    ? await prisma.order.findMany({
        where: {
          restaurantId: restaurant.id,
          id: { in: recentOrderRefs.map((order) => order.orderId) }
        },
        orderBy: { createdAt: "desc" },
        take: 3
      })
    : [];
  const themeStyle = {
    "--restro-primary": restaurant.themePrimary,
    "--restro-accent": restaurant.themeAccent,
    "--restro-bg": restaurant.themeBackground
  } as CSSProperties;

  return (
    <main
      className="min-h-screen px-4 py-5"
      style={{
        ...themeStyle,
        background:
          "radial-gradient(circle at top left, color-mix(in srgb, var(--restro-accent) 18%, transparent), transparent 26rem), linear-gradient(135deg, var(--restro-bg), #ffffff)"
      }}
    >
      <section className="mx-auto max-w-md overflow-hidden rounded-[2rem] bg-white shadow-soft">
        {query.from === "admin" ? (
          <div className="border-b border-orange-100 bg-cream px-5 py-3">
            <Link
              className="text-sm font-black text-clay underline decoration-orange-200 underline-offset-4"
              href="/admin/restaurants"
            >
              Back to admin
            </Link>
          </div>
        ) : null}

        <div className="p-5 text-white" style={{ backgroundColor: "var(--restro-primary)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: "var(--restro-accent)" }}
              >
                Scan. Order. Relax.
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight">
                {restaurant.name}
              </h1>
              <p className="mt-2 text-sm text-orange-50/80">{restaurant.address}</p>
            </div>
            {restaurant.logoUrl ? (
              <BrandLogo
                className="h-16 w-16"
                name={restaurant.name}
                src={restaurant.logoUrl}
              />
            ) : (
              <div
                className="grid h-14 w-14 place-items-center rounded-2xl text-xl font-black"
                style={{ backgroundColor: "var(--restro-accent)" }}
              >
                RW
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-semibold">
              {openState.label} · {restaurant.openingTime} - {restaurant.closingTime}
            </p>
            <StatusBadge value={subscriptionState.effectiveStatus} />
          </div>
        </div>

        {subscriptionState.orderingBlocked ? (
          <div className="p-6">
            <div className="rounded-3xl bg-red-50 p-5 text-center">
              <h2 className="text-xl font-black text-red-700">
                {subscriptionState.customerNotice?.title ??
                  "Online ordering temporarily unavailable"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-red-700/80">
                {subscriptionState.customerNotice?.body ??
                  "Please contact the restaurant directly."}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="rounded-3xl bg-mint p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-ink">Order from menu</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Add items to cart, then choose delivery, pickup, or dine-in.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    className="rounded-full px-4 py-2 text-xs font-black text-white"
                    href={`/menu/${restaurant.slug}/cart`}
                    style={{ backgroundColor: "var(--restro-primary)" }}
                  >
                    Cart {cartTotals?.itemCount ? `(${cartTotals.itemCount})` : ""}
                  </a>
                  <a
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-clay"
                    href={`/whatsapp-simulator/${restaurant.slug}`}
                  >
                    WhatsApp demo
                  </a>
                </div>
              </div>
            </div>

            {cartTotals?.itemCount ? (
              <a
                className="mt-4 flex items-center justify-between rounded-3xl px-5 py-4 text-sm font-black text-white shadow-soft"
                href={`/menu/${restaurant.slug}/cart`}
                style={{ backgroundColor: "var(--restro-primary)" }}
              >
                <span>{cartTotals.itemCount} item(s) in cart</span>
                <span>{formatCurrency(cartTotals.totalAmount)} · Checkout</span>
              </a>
            ) : null}

            {recentOrders.length ? (
              <div className="mt-4 rounded-3xl bg-white p-4 shadow-soft">
                <p className="font-black text-ink">Your recent orders</p>
                <div className="mt-3 grid gap-2">
                  {recentOrders.map((order) => (
                    <a
                      className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3 text-sm"
                      href={`/menu/${restaurant.slug}/orders/${order.id}/track`}
                      key={order.id}
                    >
                      <span className="font-black text-ink">
                        {order.orderCode} · {order.status.replaceAll("_", " ")}
                      </span>
                      <span className="font-black text-clay">
                        {formatCurrency(order.totalAmount.toString())}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {itemCount === 0 ? (
              <div className="mt-5 rounded-3xl border border-dashed border-orange-200 bg-cream p-6 text-center">
                <h2 className="text-xl font-black text-ink">Menu coming soon</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This restaurant does not have public menu items yet. Add categories
                  and items from the Owner Menu Manager.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-5">
                {restaurant.categories.map((category) => (
                  <section key={category.id}>
                    <h2 className="text-lg font-black text-ink">{category.name}</h2>
                    <div className="mt-3 grid gap-3">
                      {category.items.map((item) => (
                        <article
                          className="rounded-3xl border border-orange-100 bg-cream p-4"
                          key={item.id}
                        >
                          <div className="flex gap-4">
                            <FoodImage alt={item.name} src={item.imageUrl} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-black text-ink">{item.name}</p>
                                    {item.popular ? (
                                      <span
                                        className="rounded-full px-2 py-1 text-[10px] font-black uppercase text-white"
                                        style={{
                                          backgroundColor: "var(--restro-accent)"
                                        }}
                                      >
                                        Popular
                                      </span>
                                    ) : null}
                                    {item.recommended ? (
                                      <span className="rounded-full bg-mint px-2 py-1 text-[10px] font-black uppercase text-emerald-800">
                                        Recommended
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                    {item.description}
                                  </p>
                                </div>
                                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-emerald-700">
                                  {item.vegType}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="font-black text-clay">
                                  {formatCurrency(item.price.toString())}
                                </span>
                                <form action={addToCartAction}>
                                  <input
                                    name="restaurantSlug"
                                    type="hidden"
                                    value={restaurant.slug}
                                  />
                                  <input name="menuItemId" type="hidden" value={item.id} />
                                  <input name="quantity" type="hidden" value="1" />
                                  <button
                                    className="rounded-full px-4 py-2 text-xs font-black text-white"
                                    style={{
                                      backgroundColor: "var(--restro-primary)"
                                    }}
                                  >
                                    Add
                                  </button>
                                </form>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
