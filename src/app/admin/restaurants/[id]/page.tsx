import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { RestaurantForm } from "@/app/admin/restaurants/form";
import {
  changeRestaurantStatusAction,
  extendTrialAction,
  importRestaurantMenuSpreadsheetAction,
  markPaidAction,
  refreshRestaurantSubscriptionStatusAction
} from "@/app/admin/restaurants/actions";
import { requireRole } from "@/lib/auth";
import { getRestaurantPublicLinks } from "@/lib/domain-routing";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { adminNavItems } from "@/lib/admin-nav";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

export const dynamic = "force-dynamic";

  const messageMap: Record<string, string> = {
  created: "Restaurant created successfully.",
  saved: "Restaurant changes saved.",
  paid: "Payment marked paid and restaurant reactivated.",
  menu_imported: "Menu spreadsheet imported successfully.",
  refreshed: "Subscription status refreshed.",
  error: "Something needs attention."
};

export default async function RestaurantDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole([UserRole.SUPER_ADMIN]);
  const { id } = await params;
  const query = await searchParams;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      users: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, role: true }
      },
      subscription: { include: { plan: true } },
      subscriptionPayments: {
        orderBy: { createdAt: "desc" },
        take: 5
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: { select: { name: true, email: true } } }
      },
      _count: {
        select: {
          menuItems: true,
          orders: true,
          customers: true,
          staff: true
        }
      }
    }
  });

  if (!restaurant) notFound();
  const evaluation = evaluateRestaurantSubscription(restaurant);
  const publicLinks = getRestaurantPublicLinks(restaurant);

  const messageKey = Object.keys(messageMap).find((key) => query[key]);

  return (
    <AppShell
      title={restaurant.name}
      subtitle="Manage tenant status, subscription details, owner access, trial extensions, and payment status."
      navItems={adminNavItems}
    >
      {messageKey ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          {messageMap[messageKey]}
        </div>
      ) : null}

      {query.error === "slug_exists" ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          That public slug is already used by another restaurant.
        </div>
      ) : null}

      {query.error === "custom_domain_exists" ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          That custom domain is already mapped to another restaurant.
        </div>
      ) : null}

      {query.error === "missing_menu_file" ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          Please choose an Excel or CSV file before uploading.
        </div>
      ) : null}

      {query.error === "import_failed" ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          Menu import failed.
          {query.details ? (
            <p className="mt-2 font-medium">{decodeURIComponent(query.details)}</p>
          ) : null}
        </div>
      ) : null}

      {evaluation.ownerNotice ? (
        <div
          className={[
            "rounded-3xl px-5 py-4 text-sm font-bold",
            evaluation.ownerNotice.tone === "danger"
              ? "bg-red-50 text-red-700"
              : evaluation.ownerNotice.tone === "warning"
                ? "bg-amber-50 text-amber-700"
                : "bg-blue-50 text-blue-700"
          ].join(" ")}
        >
          <p>{evaluation.ownerNotice.title}</p>
          <p className="mt-1 font-medium">{evaluation.ownerNotice.body}</p>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
          <p className="text-sm font-bold text-slate-500">Status</p>
          <div className="mt-3">
            <StatusBadge value={evaluation.effectiveStatus} />
          </div>
        </div>
        <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
          <p className="text-sm font-bold text-slate-500">Trial ends</p>
          <p className="mt-3 text-2xl font-black text-ink">
            {formatDate(restaurant.trialEndDate)}
          </p>
        </div>
        <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
          <p className="text-sm font-bold text-slate-500">Monthly</p>
          <p className="mt-3 text-2xl font-black text-ink">
            {formatCurrency(restaurant.subscriptionAmount.toString())}
          </p>
        </div>
        <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
          <p className="text-sm font-bold text-slate-500">Due</p>
          <p className="mt-3 text-2xl font-black text-ink">
            {formatCurrency(restaurant.paymentDueAmount.toString())}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">Quick controls</h2>
          <p className="mt-1 text-sm text-slate-500">
            These controls are intentionally direct for your master panel.
          </p>

          <form
            action={refreshRestaurantSubscriptionStatusAction}
            className="mt-5 rounded-3xl bg-blue-50 p-4"
          >
            <input name="restaurantId" type="hidden" value={restaurant.id} />
            <p className="text-sm font-bold text-blue-700">
              Sync trial, grace period, and suspension state from billing dates.
            </p>
            <button className="mt-3 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white">
              Refresh subscription status
            </button>
          </form>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(["trial", "active", "past_due", "suspended", "inactive"] as const).map(
              (status) => (
                <form action={changeRestaurantStatusAction} key={status}>
                  <input name="restaurantId" type="hidden" value={restaurant.id} />
                  <input name="status" type="hidden" value={status} />
                  <button className="focus-ring w-full rounded-2xl bg-cream px-4 py-3 text-sm font-black text-clay transition hover:bg-saffron hover:text-white">
                    Set {status.replaceAll("_", " ")}
                  </button>
                </form>
              )
            )}
          </div>

          <form
            action={extendTrialAction}
            className="mt-5 rounded-3xl bg-mint p-4"
          >
            <input name="restaurantId" type="hidden" value={restaurant.id} />
            <label className="grid gap-2 text-sm font-bold text-ink">
              Extend trial by days
              <input
                className="focus-ring rounded-2xl border border-emerald-100 bg-white px-4 py-3 font-normal"
                defaultValue="7"
                max="90"
                min="1"
                name="days"
                type="number"
              />
            </label>
            <button className="mt-3 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white">
              Extend trial
            </button>
          </form>

          <form
            action={markPaidAction}
            className="mt-5 rounded-3xl bg-cream p-4"
          >
            <input name="restaurantId" type="hidden" value={restaurant.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-ink">
                Amount received
                <input
                  className="focus-ring rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                  defaultValue={restaurant.paymentDueAmount.toString()}
                  min="0"
                  name="amount"
                  type="number"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-ink">
                Reference
                <input
                  className="focus-ring rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                  name="reference"
                  placeholder="UPI / cash / bank ref"
                />
              </label>
            </div>
            <button className="mt-3 rounded-2xl bg-saffron px-5 py-3 text-sm font-black text-white">
              Mark paid and activate
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">Tenant summary</h2>
          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <p>Platform menu path: {publicLinks.platformMenuPath}</p>
            <p>Platform menu URL: {publicLinks.platformMenuUrl}</p>
            <p>
              Custom domain: {publicLinks.customDomainUrl ?? "Not configured yet"}
            </p>
            <p>
              Domain status:{" "}
              {restaurant.customDomain
                ? restaurant.customDomainVerified
                  ? "verified"
                  : "pending verification"
                : "platform link only"}
            </p>
            <p>Phone: {restaurant.phone}</p>
            <p>WhatsApp: {restaurant.whatsappNumber}</p>
            <p>Menu items: {restaurant._count.menuItems}</p>
            <p>Orders: {restaurant._count.orders}</p>
            <p>Customers: {restaurant._count.customers}</p>
            <p>Staff records: {restaurant._count.staff}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white"
              href={`/owner?restaurantId=${restaurant.id}&from=admin`}
            >
              Owner view
            </Link>
            <Link
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
              href={`/staff?restaurantId=${restaurant.id}&from=admin`}
            >
              Staff view
            </Link>
            <Link
              className="rounded-full bg-saffron px-4 py-2 text-xs font-black text-white"
              href={`/menu/${restaurant.slug}?from=admin`}
            >
              Public menu
            </Link>
            <Link
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white"
              href={`/whatsapp-simulator/${restaurant.slug}?from=admin`}
            >
              Simulator
            </Link>
          </div>

          <div className="mt-5 rounded-3xl bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-bold">Domain foundation is now ready.</p>
            <p className="mt-1">
              Start with the platform link today, then point a restaurant&apos;s
              own verified domain here later without changing their menu or orders.
            </p>
          </div>

          <h3 className="mt-6 font-black text-ink">Users</h3>
          <div className="mt-3 grid gap-2">
            {restaurant.users.map((user) => (
              <div
                className="rounded-2xl bg-cream px-4 py-3 text-sm"
                key={user.id}
              >
                <p className="font-bold text-ink">{user.name}</p>
                <p className="text-slate-500">
                  {user.email} · {user.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RestaurantForm mode="edit" restaurant={restaurant} />

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Bulk menu import</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Upload one Excel or CSV menu file for this restaurant. It will create
              missing categories and create or update menu items in one pass.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-full bg-cream px-4 py-2 text-sm font-black text-clay"
              href="/templates/restrowa-menu-template.xlsx"
            >
              Download Excel template
            </a>
            <a
              className="rounded-full bg-cream px-4 py-2 text-sm font-black text-clay"
              href="/templates/restrowa-menu-template.csv"
            >
              Download CSV template
            </a>
          </div>
        </div>

        <form
          action={importRestaurantMenuSpreadsheetAction}
          className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <input name="restaurantId" type="hidden" value={restaurant.id} />
          <label className="grid gap-2 text-sm font-bold text-ink">
            Menu file (.xlsx, .xls, .csv)
            <input
              accept=".xlsx,.xls,.csv"
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              name="menuFile"
              required
              type="file"
            />
          </label>
          <button className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">
            Import into {restaurant.name}
          </button>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">Recent payments</h2>
          <div className="mt-4 grid gap-3">
            {restaurant.subscriptionPayments.length === 0 ? (
              <p className="rounded-3xl bg-cream p-5 text-sm text-slate-600">
                No subscription payments recorded yet.
              </p>
            ) : (
              restaurant.subscriptionPayments.map((payment) => (
                <div className="rounded-3xl bg-cream p-4" key={payment.id}>
                  <p className="font-black text-ink">
                    {formatCurrency(payment.amount.toString())}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(payment.paidAt)} · {payment.reference ?? "No ref"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">Recent audit logs</h2>
          <div className="mt-4 grid gap-3">
            {restaurant.auditLogs.map((log) => (
              <div className="rounded-3xl bg-cream p-4" key={log.id}>
                <p className="font-black text-ink">{log.action}</p>
                <p className="text-sm text-slate-500">
                  {formatDate(log.createdAt)} · {log.actor?.email ?? "system"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
