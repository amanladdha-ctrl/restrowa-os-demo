import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { LiveRefresh } from "@/components/live-refresh";
import { OrderCard } from "@/components/order-card";
import { StatCard } from "@/components/stat-card";
import { formatCurrency } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { ownerNavItems } from "@/lib/owner-nav";
import { requireOwnerRestaurantIdFromSearch } from "@/lib/owner-restaurant";
import { prisma } from "@/lib/prisma";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  order_not_found: "Order was not found for this restaurant."
};

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

function renderStatusLog(
  statusHistory: Array<{
    id: string;
    status: string;
    createdAt: Date;
    changedBy: { email: string } | null;
  }>
) {
  if (!statusHistory.length) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-cream p-4 text-sm text-slate-600">
      <p className="font-black text-ink">Recent status log</p>
      <div className="mt-2 grid gap-1">
        {statusHistory.map((history) => (
          <p key={history.id}>
            {history.status.replaceAll("_", " ")} ·{" "}
            {history.changedBy?.email ?? "system"} ·{" "}
            {history.createdAt.toLocaleString("en-IN")}
          </p>
        ))}
      </div>
    </div>
  );
}

export default async function OwnerOrdersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireRole([UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN]);
  const query = await searchParams;
  const restaurantId = await requireOwnerRestaurantIdFromSearch(query.restaurantId);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { changedBy: { select: { email: true } } }
          }
        }
      }
    }
  });

  if (!restaurant) {
    return null;
  }
  const subscriptionState = evaluateRestaurantSubscription(restaurant);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = restaurant.orders.filter((order) => order.createdAt >= today);
  const pendingOrders = restaurant.orders.filter((order) => order.status === "pending");
  const activeOrders = restaurant.orders.filter((order) =>
    liveStatusOrder.includes(order.status as (typeof liveStatusOrder)[number])
  );
  const deliveredOrders = restaurant.orders.filter((order) => order.status === "delivered");
  const closedOrders = restaurant.orders.filter((order) =>
    ["cancelled", "rejected"].includes(order.status)
  );
  const todayRevenue = todayOrders
    .filter((order) => order.status !== "cancelled" && order.status !== "rejected")
    .reduce((total, order) => total + Number(order.totalAmount), 0);
  const latestOrder = [...restaurant.orders]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .at(0);
  const returnTo =
    user.role === UserRole.SUPER_ADMIN
      ? `/owner/orders?restaurantId=${restaurant.id}`
      : "/owner/orders";

  return (
    <AppShell
      title="Live Orders"
      subtitle="Accept orders, move them through kitchen statuses, verify mock UPI payments, and keep customer tracking updated."
      navItems={ownerNavItems(
        restaurant.slug,
        user.role === UserRole.SUPER_ADMIN ? restaurant.id : undefined
      )}
    >
      {query.error ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {errorMessages[query.error] ?? "Something went wrong."}
        </div>
      ) : null}

      {query.status_updated ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          Order status updated. Customer tracking page will show the latest status.
        </div>
      ) : null}

      {query.payment_verified ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          Payment marked paid.
        </div>
      ) : null}

      {subscriptionState.ownerNotice ? (
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

      <LiveRefresh
        enableNotifications
        intervalMs={10000}
        latestValue={latestOrder?.id ?? null}
        message="This screen auto-refreshes every 10 seconds. If browser notification permission is allowed, new orders will pop up here."
        notificationBody={`${restaurant.name} has received a new order.`}
        notificationTitle="RestroWA new order"
        storageKey={`owner-orders-${restaurant.id}`}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Today orders" value={todayOrders.length} />
        <StatCard label="Pending" value={pendingOrders.length} />
        <StatCard label="Active" value={activeOrders.length} />
        <StatCard label="Today revenue" value={formatCurrency(todayRevenue)} />
      </section>

      <section className="grid gap-5">
        {restaurant.orders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-white/90 p-8 text-center shadow-soft">
            <h2 className="text-2xl font-black text-ink">No orders yet</h2>
            <p className="mt-2 text-slate-600">
              Orders created from public checkout will appear here instantly.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-[2rem] border border-orange-100 bg-white/90 p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-ink">Live orders</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    New and active orders stay here until they are delivered.
                  </p>
                </div>
                <span className="rounded-full bg-cream px-4 py-2 text-sm font-black text-clay">
                  {activeOrders.length} active
                </span>
              </div>

              <div className="mt-6 grid gap-6">
                {liveStatusOrder.map((statusKey) => {
                  const sectionOrders = restaurant.orders.filter(
                    (order) => order.status === statusKey
                  );

                  if (!sectionOrders.length) {
                    return null;
                  }

                  return (
                    <div className="grid gap-3" key={statusKey}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-ink">
                          {liveStatusLabels[statusKey]}
                        </h3>
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-clay">
                          {sectionOrders.length}
                        </span>
                      </div>

                      {sectionOrders.map((order) => (
                        <div className="grid gap-3" key={order.id}>
                          <OrderCard
                            order={order}
                            restaurantId={restaurant.id}
                            returnTo={returnTo}
                          />
                          {renderStatusLog(order.statusHistory)}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {activeOrders.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-orange-200 bg-cream p-8 text-center">
                    <p className="text-lg font-black text-ink">No live orders right now</p>
                    <p className="mt-2 text-sm text-slate-600">
                      New orders will appear here automatically.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-ink">Delivered orders</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Successfully completed orders stay here for review.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                  {deliveredOrders.length} delivered
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {deliveredOrders.length === 0 ? (
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
                      restaurantId={restaurant.id}
                      returnTo={returnTo}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-ink">Closed or cancelled</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Rejected and cancelled orders are kept separately.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">
                  {closedOrders.length} closed
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {closedOrders.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-lg font-black text-ink">
                      No cancelled or rejected orders
                    </p>
                  </div>
                ) : (
                  closedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      restaurantId={restaurant.id}
                      returnTo={returnTo}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
