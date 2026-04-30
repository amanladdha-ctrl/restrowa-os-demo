import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { createSupportRequestAction } from "@/app/support/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { ownerNavItems } from "@/lib/owner-nav";
import { requireOwnerRestaurantIdFromSearch } from "@/lib/owner-restaurant";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

export const dynamic = "force-dynamic";

export default async function OwnerPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireRole([UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN]);
  const params = await searchParams;
  const restaurantId = await requireOwnerRestaurantIdFromSearch(params.restaurantId);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      categories: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" }
      },
      _count: { select: { orders: true, customers: true, staff: true } }
    }
  });

  if (!restaurant) {
    return null;
  }
  const subscriptionState = evaluateRestaurantSubscription(restaurant);
  const supportRequests =
    user.role !== UserRole.SUPER_ADMIN
      ? await prisma.supportRequest.findMany({
          where: { restaurantId: restaurant.id, userId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 5
        })
      : [];

  const itemCount = restaurant.categories.reduce(
    (total, category) => total + category.items.length,
    0
  );

  return (
    <AppShell
      title="Restaurant Owner"
      subtitle="Owner dashboard for restaurant health, menu preview, settings, trial state, and future order management."
      navItems={ownerNavItems(
        restaurant.slug,
        user.role === UserRole.SUPER_ADMIN ? restaurant.id : undefined
      )}
    >
      {user.role !== UserRole.SUPER_ADMIN && user.passwordChangeRecommended ? (
        <div className="rounded-3xl bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          This login was likely shared by admin. You can keep using it, or change
          your password from{" "}
          <Link className="underline" href="/account/security">
            Account Security
          </Link>
          .
        </div>
      ) : null}

      {user.role !== UserRole.SUPER_ADMIN && params.password_changed ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          Password updated successfully.
        </div>
      ) : null}

      {user.role !== UserRole.SUPER_ADMIN && params.support_sent ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          Your support request has been sent to Super Admin.
        </div>
      ) : null}

      {user.role !== UserRole.SUPER_ADMIN && params.support_error ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          Please add a short title and a proper problem description before sending.
        </div>
      ) : null}

      {user.role !== UserRole.SUPER_ADMIN && supportRequests.some((item) => item.status === "resolved") ? (
        <div className="rounded-3xl bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
          You have support updates from admin below.
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

      {user.role !== UserRole.SUPER_ADMIN ? (
        <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-ink">Need help with your dashboard?</h2>
              <p className="mt-1 text-sm text-slate-600">
                Raise a support ticket from the section below. Super Admin will see it
                in the support inbox immediately.
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

      {user.role === UserRole.SUPER_ADMIN && params.restaurantId ? (
        <div className="rounded-3xl bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
          This is admin preview mode. Support ticket creation is shown when the real
          owner logs in with their own account.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today orders" value="0" helper="Order flow starts Phase 4" />
        <StatCard label="Menu items" value={itemCount} />
        <StatCard label="Customers" value={restaurant._count.customers} />
        <StatCard
          label="Trial end"
          value={formatDate(restaurant.trialEndDate)}
          helper={`${restaurant.gracePeriodDays} day grace period`}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <BrandLogo name={restaurant.name} src={restaurant.logoUrl} />
              <div>
                <h2 className="text-2xl font-black text-ink">{restaurant.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{restaurant.address}</p>
              </div>
            </div>
            <StatusBadge value={subscriptionState.effectiveStatus} />
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <p>Phone: {restaurant.phone}</p>
            <p>WhatsApp: {restaurant.whatsappNumber}</p>
            <p>
              Timing: {restaurant.openingTime} to {restaurant.closingTime}
            </p>
            <p>Delivery charge: {formatCurrency(restaurant.deliveryCharge.toString())}</p>
            <p>
              Free delivery above:{" "}
              {restaurant.freeDeliveryAbove
                ? formatCurrency(restaurant.freeDeliveryAbove.toString())
                : "Not set"}
            </p>
            <p>UPI: {restaurant.upiId ?? "Placeholder only"}</p>
            <p>
              Theme: {restaurant.themePrimary} / {restaurant.themeAccent}
            </p>
          </div>
          <Link
            className="mt-6 inline-flex rounded-full bg-saffron px-5 py-3 text-sm font-black text-white"
            href={`/menu/${restaurant.slug}`}
          >
            Preview customer menu
          </Link>
        </div>

        <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-ink">Menu Preview</h2>
            <Link
              className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white"
              href={
                user.role === UserRole.SUPER_ADMIN
                  ? `/owner/menu?restaurantId=${restaurant.id}`
                  : "/owner/menu"
              }
            >
              Manage menu
            </Link>
          </div>
          <div className="mt-4 grid gap-4">
            {restaurant.categories.map((category) => (
              <div className="rounded-3xl bg-cream p-4" key={category.id}>
                <p className="font-black text-clay">{category.name}</p>
                <div className="mt-3 grid gap-2">
                  {category.items.map((item) => (
                    <div
                      className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3"
                      key={item.id}
                    >
                      <span className="font-semibold text-ink">{item.name}</span>
                      <span className="font-black text-clay">
                        {formatCurrency(item.price.toString())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {user.role !== UserRole.SUPER_ADMIN ? (
        <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">Account tools</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this area if you want to set your own private password after the
            admin shares your first login.
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
            If anything breaks, send a note here. It will appear in your admin
            support inbox immediately.
          </p>

          <form action={createSupportRequestAction} className="mt-5 grid gap-3">
            <input name="restaurantId" type="hidden" value={restaurant.id} />
            <input name="returnTo" type="hidden" value="/owner" />
            <label className="grid gap-2 text-sm font-bold text-ink">
              Issue title
              <input
                className="rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
                defaultValue={`${restaurant.name} support request`}
                name="title"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Explain the problem
              <textarea
                className="min-h-28 rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
                defaultValue="Please check our dashboard or order flow. We need help."
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
