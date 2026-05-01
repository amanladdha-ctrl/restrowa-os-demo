import { notFound } from "next/navigation";
import { PublicCartClient } from "@/components/public-cart-client";
import { StatusBadge } from "@/components/status-badge";
import { getCartForRestaurant } from "@/lib/cart";
import { buildPublicCartSnapshot } from "@/lib/public-cart-snapshot";
import { prisma } from "@/lib/prisma";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

export const dynamic = "force-dynamic";

export default async function CartPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug }
  });

  if (!restaurant) notFound();

  const cart = await getCartForRestaurant(restaurant.id);
  const subscriptionState = evaluateRestaurantSubscription(restaurant);
  const initialCart = cart ? buildPublicCartSnapshot(cart) : null;

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
        <PublicCartClient
          initialCart={initialCart}
          orderingBlocked={subscriptionState.orderingBlocked}
          orderingMessage={
            subscriptionState.customerNotice?.body ??
            "Online ordering is temporarily unavailable for this restaurant."
          }
          slug={slug}
        />
      </section>
    </main>
  );
}
