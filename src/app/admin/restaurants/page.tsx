import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { RestaurantForm } from "@/app/admin/restaurants/form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { adminNavItems } from "@/lib/admin-nav";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  slug_exists: "That public slug is already used by another restaurant.",
  owner_exists: "That owner email already exists.",
  not_found: "Restaurant was not found."
};

export default async function RestaurantsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole([UserRole.SUPER_ADMIN]);
  const params = await searchParams;

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: UserRole.RESTAURANT_OWNER },
        select: { email: true, name: true }
      },
      _count: { select: { orders: true, menuItems: true, customers: true } }
    }
  });

  return (
    <AppShell
      title="Restaurants"
      subtitle="Create tenants, owner logins, trial windows, payment settings, and suspension controls from one place."
      navItems={adminNavItems}
    >
      {params.error ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {errorMessages[params.error] ?? "Something went wrong."}
        </div>
      ) : null}

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">All restaurants</h2>
            <p className="mt-1 text-sm text-slate-500">
              Click a restaurant to edit status, plan, trial, payment, and core
              profile details.
            </p>
          </div>
          <a
            className="rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
            href="#create-restaurant"
          >
            Create restaurant
          </a>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-3">Restaurant</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Trial end</th>
                <th>Orders</th>
                <th>Customers</th>
                <th>Monthly</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((restaurant) => (
                <tr className="border-t border-orange-100" key={restaurant.id}>
                  <td className="py-4">
                    <Link
                      className="font-black text-ink underline decoration-orange-200 underline-offset-4 hover:text-clay"
                      href={`/admin/restaurants/${restaurant.id}`}
                    >
                      {restaurant.name}
                    </Link>
                    <p className="text-slate-500">/{restaurant.slug}</p>
                  </td>
                  <td>
                    <p className="font-semibold text-ink">
                      {restaurant.users[0]?.name ?? "No owner"}
                    </p>
                    <p className="text-slate-500">
                      {restaurant.users[0]?.email ?? "Create owner later"}
                    </p>
                  </td>
                  <td>
                    <StatusBadge value={restaurant.status} />
                  </td>
                  <td>{restaurant.planType}</td>
                  <td>{formatDate(restaurant.trialEndDate)}</td>
                  <td>{restaurant._count.orders}</td>
                  <td>{restaurant._count.customers}</td>
                  <td>{formatCurrency(restaurant.subscriptionAmount.toString())}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-full bg-cream px-4 py-2 text-xs font-black text-clay"
                        href={`/admin/restaurants/${restaurant.id}`}
                      >
                        Manage
                      </Link>
                      <Link
                        className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white"
                        href={`/owner?restaurantId=${restaurant.id}&from=admin`}
                      >
                        Owner
                      </Link>
                      <Link
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                        href={`/staff?restaurantId=${restaurant.id}&from=admin`}
                      >
                        Staff
                      </Link>
                      <Link
                        className="rounded-full bg-saffron px-4 py-2 text-xs font-black text-white"
                        href={`/menu/${restaurant.slug}?from=admin`}
                      >
                        Public
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="create-restaurant">
        <div className="mb-4 rounded-[2rem] bg-ink p-5 text-white shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-saffron">
            New tenant
          </p>
          <h2 className="mt-2 text-2xl font-black">Create restaurant</h2>
          <p className="mt-2 text-sm leading-6 text-orange-50/80">
            This creates the restaurant, its subscription row, owner login, and
            an audit log entry. Menu data can be customized in Phase 3.
          </p>
        </div>
        <RestaurantForm mode="create" />
      </section>
    </AppShell>
  );
}
