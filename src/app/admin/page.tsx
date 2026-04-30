import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { refreshAllSubscriptionStatusesAction } from "@/app/admin/restaurants/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { adminNavItems } from "@/lib/admin-nav";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole([UserRole.SUPER_ADMIN]);
  const query = await searchParams;

  const [
    restaurants,
    users,
    orders,
    ledgerDue,
    simulatorMessages,
    openSupport,
    latestSupport
  ] = await Promise.all([
    prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true, menuItems: true } } }
    }),
    prisma.user.count(),
    prisma.order.count(),
    prisma.platformFeeLedger.aggregate({
      where: { status: "unpaid" },
      _sum: { platformFeeAmount: true }
    }),
    prisma.whatsAppMessage.count(),
    prisma.supportRequest.count({ where: { status: "open" } }),
    prisma.supportRequest.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        restaurant: { select: { id: true, name: true } },
        user: { select: { email: true } }
      }
    })
  ]);

  const evaluations = restaurants.map((restaurant) => ({
    restaurant,
    evaluation: evaluateRestaurantSubscription(restaurant)
  }));

  const trialCount = evaluations.filter(
    ({ evaluation }) => evaluation.effectiveStatus === "trial"
  ).length;
  const activeCount = evaluations.filter(
    ({ evaluation }) => evaluation.effectiveStatus === "active"
  ).length;
  const suspendedCount = evaluations.filter(
    ({ evaluation }) => evaluation.effectiveStatus === "suspended"
  ).length;
  const actionNeededCount = evaluations.filter(
    ({ evaluation }) => evaluation.shouldSyncStatus
  ).length;
  return (
    <AppShell
      title="Super Admin"
      subtitle="Your SaaS control center. Phase 2 adds restaurant management, billing controls, and audit visibility."
      navItems={adminNavItems}
    >
      {query.subscription_refreshed ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          Subscription refresh completed. {query.subscription_refreshed} restaurant(s)
          changed status.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Restaurants" value={restaurants.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Trial" value={trialCount} />
        <StatCard label="Suspended" value={suspendedCount} />
        <StatCard label="Open support" value={openSupport} />
        <StatCard
          label="Platform dues"
          value={formatCurrency(ledgerDue._sum.platformFeeAmount?.toString() ?? 0)}
          helper={`${orders} total orders, ${users} users, ${simulatorMessages} WhatsApp logs`}
        />
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">Subscription enforcement</h2>
            <p className="mt-1 text-sm text-slate-500">
              Phase 7 can refresh all restaurant trial and billing states from one
              place.
            </p>
          </div>
          <form action={refreshAllSubscriptionStatusesAction}>
            <button className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white">
              Refresh all statuses
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-3xl bg-cream p-4 text-sm text-slate-700">
          <strong className="text-ink">{actionNeededCount}</strong> restaurant(s) are
          currently due for a status sync based on trial end date, grace period, or
          overdue subscription amount.
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">Restaurants</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-3">Restaurant</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Trial ends</th>
                <th>Menu items</th>
                <th>Orders</th>
                <th>Monthly</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map(({ restaurant, evaluation }) => (
                <tr className="border-t border-orange-100" key={restaurant.id}>
                  <td className="py-4">
                    <Link
                      className="font-bold text-ink underline decoration-orange-200 underline-offset-4 hover:text-clay"
                      href={`/admin/restaurants/${restaurant.id}`}
                    >
                      {restaurant.name}
                    </Link>
                    <p className="text-slate-500">/{restaurant.slug}</p>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={evaluation.effectiveStatus} />
                      {evaluation.shouldSyncStatus ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase text-amber-700">
                          needs refresh
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>{restaurant.planType}</td>
                  <td>{formatDate(restaurant.trialEndDate)}</td>
                  <td>{restaurant._count.menuItems}</td>
                  <td>{restaurant._count.orders}</td>
                  <td>{formatCurrency(restaurant.subscriptionAmount.toString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">Open support alerts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Restaurant help requests come here from owner and staff dashboards.
            </p>
          </div>
          <Link
            className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white"
            href="/admin/support"
          >
            Open support inbox
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {latestSupport.length === 0 ? (
            <div className="rounded-3xl bg-cream p-5 text-sm text-slate-600">
              No open support alerts right now.
            </div>
          ) : (
            latestSupport.map((request) => (
              <div className="rounded-3xl bg-cream p-4" key={request.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-ink">{request.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.restaurant.name} · {request.user.email}
                    </p>
                  </div>
                  <Link
                    className="text-sm font-black text-clay underline decoration-orange-200 underline-offset-4"
                    href="/admin/support"
                  >
                    Review
                  </Link>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{request.message}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
