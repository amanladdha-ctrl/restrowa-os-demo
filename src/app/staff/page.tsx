import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { LiveRefresh } from "@/components/live-refresh";
import { OrderCard } from "@/components/order-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { createSupportRequestAction } from "@/app/support/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { staffNavItems } from "@/lib/staff-nav";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";
import Link from "next/link";

export const dynamic = "force-dynamic";

const liveStatusOrder = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery"
] as const;

const liveStatusLabels: Record<(typeof liveStatusOrder)[number], string> = {
  pending: "New and pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery"
};

async function resolveRestaurantId(
  user: Awaited<ReturnType<typeof requireRole>>,
  requestedRestaurantId?: string
) {
  if (user.restaurantId) {
    return user.restaurantId;
  }

  if (requestedRestaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: requestedRestaurantId },
      select: { id: true }
    });

    if (restaurant) {
      return restaurant.id;
    }
  }

  const firstRestaurant = await prisma.restaurant.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" }
  });

  return firstRestaurant?.id;
}

export default async function StaffPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireRole([
    UserRole.RESTAURANT_STAFF,
    UserRole.RESTAURANT_OWNER,
    UserRole.SUPER_ADMIN
  ]);
  const query = await searchParams;
  const restaurantId = await resolveRestaurantId(user, query.restaurantId);

  const restaurant = restaurantId
    ? await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    : null;

  const orders = restaurant
    ? await prisma.order.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { items: true }
      })
    : [];
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const preparingOrders = orders.filter((order) => order.status === "preparing");
  const readyOrders = orders.filter((order) => order.status === "ready");
  const activeOrders = orders.filter((order) =>
    liveStatusOrder.includes(order.status as (typeof liveStatusOrder)[number])
  );
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const selectedRestaurantId = user.restaurantId ? undefined : restaurant?.id;
  const returnTo = selectedRestaurantId
    ? `/staff?restaurantId=${selectedRestaurantId}`
    : "/staff";
  const latestOrder = [...orders].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0];
  const subscriptionState = restaurant
    ? evaluateRestaurantSubscription(restaurant)
    : null;
  const supportRequests =
    user.role !== UserRole.SUPER_ADMIN && restaurant
      ? await prisma.supportRequest.findMany({
          where: { restaurantId: restaurant.id, userId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 5
        })
      : [];

  return (
    <AppShell
      title="Staff Orders"
      subtitle="Simple staff screen for new/live orders, status updates, payment verification, and KOT placeholder."
      navItems={
        restaurant
          ? staffNavItems(restaurant.slug, {
              restaurantId: selectedRestaurantId,
              showOwnerLink:
                user.role === UserRole.RESTAURANT_OWNER ||
                user.role === UserRole.SUPER_ADMIN
            })
          : [{ href: "/staff", label: "Live orders" }]
      }
    >
      {user.role !== UserRole.SUPER_ADMIN && user.passwordChangeRecommended ? (
        <div className="rounded-3xl bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          You can continue with this shared password, or set your own from{" "}
          <Link className="underline" href="/account/security">
            Account Security
          </Link>
          .
        </div>
      ) : null}

      {user.role !== UserRole.SUPER_ADMIN && query.password_changed ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          Password updated successfully.
        </div>
      ) : null}

      {user.role !== UserRole.SUPER_ADMIN && query.support_sent ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          Your support request has been sent to Super Admin.
        </div>
      ) : null}

      {user.role !== UserRole.SUPER_ADMIN && query.support_error ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          Please add a short title and a proper problem description before sending.
        </div>
      ) : null}

      {user.role !== UserRole.SUPER_ADMIN && supportRequests.some((item) => item.status === "resolved") ? (
        <div className="rounded-3xl bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
          You have support updates from admin below.
        </div>
      ) : null}

      {subscriptionState?.ownerNotice ? (
        <div
          className={[
            "rounded-3xl px-5 py-4 text-sm font-bold",
            subscriptionState.ownerNotice.tone === "danger"
              ? "bg-red-50 text-red-700"
              : subscriptionState.ownerNotice.tone === "warning"
                ? "bg-amber-50 text-amber-700"
                : "bg-blue-50 text-blue-700"
          ].join(" ")}
        >
          <p>{subscriptionState.ownerNotice.title}</p>
          <p className="mt-1 font-medium">{subscriptionState.ownerNotice.body}</p>
        </div>
      ) : null}

      {user.role !== UserRole.SUPER_ADMIN ? (
        <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-ink">Need help with staff orders?</h2>
              <p className="mt-1 text-sm text-slate-600">
                Raise a support ticket below if anything is broken in orders, payment
                flow, or status updates.
              </p>
            </div>
            <Link
              className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
              href="#support-desk"
            >
              Open support form
            </Link>
          </div>
        </section>
      ) : null}

      {user.role === UserRole.SUPER_ADMIN && selectedRestaurantId ? (
        <div className="rounded-3xl bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
          This is admin preview mode. Support ticket creation is shown when the real
          owner or staff account logs in directly.
        </div>
      ) : null}

      <LiveRefresh
        enableNotifications
        intervalMs={10000}
        latestValue={latestOrder?.id ?? null}
        message="This screen auto-refreshes every 10 seconds. Allow browser notifications if you want a popup when a new order comes in."
        notificationBody={`${restaurant?.name ?? "Your restaurant"} has a new order.`}
        notificationTitle="RestroWA staff alert"
        storageKey={`staff-orders-${restaurant?.id ?? "none"}`}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="New orders" value={pendingOrders.length} />
        <StatCard label="Preparing" value={preparingOrders.length} />
        <StatCard label="Ready" value={readyOrders.length} />
        <StatCard label="Delivered" value={deliveredOrders.length} />
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">
              {restaurant?.name ?? "No restaurant seeded"}
            </h2>
            <p className="text-sm text-slate-500">
              New orders from public checkout appear here. Status changes update
              customer tracking pages.
            </p>
          </div>
          {restaurant && subscriptionState ? (
            <StatusBadge value={subscriptionState.effectiveStatus} />
          ) : null}
        </div>

        <div className="mt-6 grid gap-6">
          {!orders.length ? (
            <div className="rounded-3xl border border-dashed border-orange-200 bg-cream p-8 text-center">
              <p className="text-lg font-black text-ink">No orders yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Orders will appear here after customer checkout.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-[2rem] border border-orange-100 bg-white/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black text-ink">Live orders</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Work on these first. Latest active orders stay on top by status.
                    </p>
                  </div>
                  <span className="rounded-full bg-cream px-4 py-2 text-sm font-black text-clay">
                    {activeOrders.length} active
                  </span>
                </div>

                <div className="mt-6 grid gap-6">
                  {liveStatusOrder.map((statusKey) => {
                    const sectionOrders = orders.filter((order) => order.status === statusKey);

                    if (!sectionOrders.length) {
                      return null;
                    }

                    return (
                      <div className="grid gap-3" key={statusKey}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-black text-ink">
                            {liveStatusLabels[statusKey]}
                          </h4>
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-clay">
                            {sectionOrders.length}
                          </span>
                        </div>

                        {sectionOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            restaurantId={restaurant!.id}
                            returnTo={returnTo}
                          />
                        ))}
                      </div>
                    );
                  })}

                  {!activeOrders.length ? (
                    <div className="rounded-3xl border border-dashed border-orange-200 bg-cream p-8 text-center">
                      <p className="text-lg font-black text-ink">No live orders right now</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black text-ink">Delivered orders</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Completed orders stay here for quick reference.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                    {deliveredOrders.length} delivered
                  </span>
                </div>

                <div className="mt-6 grid gap-4">
                  {!deliveredOrders.length ? (
                    <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center">
                      <p className="text-lg font-black text-ink">
                        No delivered orders yet
                      </p>
                    </div>
                  ) : (
                    deliveredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        restaurantId={restaurant!.id}
                        returnTo={returnTo}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {user.role !== UserRole.SUPER_ADMIN && restaurant ? (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
            <h2 className="text-xl font-black text-ink">Account tools</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Staff can also change the shared starter password to a private one.
            </p>
            <Link
              className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
              href="/account/security"
            >
              Open account security
            </Link>
          </div>

          <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft" id="support-desk">
            <h2 className="text-xl font-black text-ink">Need help?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Send a support note if there is any issue in orders, dashboard, or
              payment flow.
            </p>

            <form action={createSupportRequestAction} className="mt-5 grid gap-3">
              <input name="restaurantId" type="hidden" value={restaurant.id} />
              <input name="returnTo" type="hidden" value="/staff" />
              <label className="grid gap-2 text-sm font-bold text-ink">
                Issue title
                <input
                  className="rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
                  defaultValue={`${restaurant.name} staff support request`}
                  name="title"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-ink">
                Explain the problem
                <textarea
                  className="min-h-28 rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
                  defaultValue="Please check our live order dashboard. We need help."
                  name="message"
                  required
                />
              </label>
              <button className="rounded-2xl bg-saffron px-5 py-3 text-sm font-black text-white">
                Send help request
              </button>
            </form>

            <div className="mt-6 grid gap-3">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-clay">
                Your support updates
              </p>
              {supportRequests.length === 0 ? (
                <div className="rounded-2xl bg-cream px-4 py-3 text-sm text-slate-600">
                  No support tickets yet.
                </div>
              ) : (
                supportRequests.map((request) => (
                  <div className="rounded-2xl bg-cream px-4 py-3" key={request.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-ink">{request.title}</p>
                      <StatusBadge value={request.status} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{request.message}</p>
                    {request.adminReply ? (
                      <div className="mt-3 rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                          Admin reply
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {request.adminReply}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
