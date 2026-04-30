import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { resolveSupportRequestAction } from "@/app/support/actions";
import { requireRole } from "@/lib/auth";
import { adminNavItems } from "@/lib/admin-nav";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole([UserRole.SUPER_ADMIN]);
  const query = await searchParams;

  const requests = await prisma.supportRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      restaurant: { select: { id: true, name: true, slug: true } },
      user: { select: { name: true, email: true } }
    }
  });

  const openRequests = requests.filter((request) => request.status === "open");
  const resolvedRequests = requests.filter((request) => request.status === "resolved");

  return (
    <AppShell
      title="Support Inbox"
      subtitle="Owners and staff can raise issues here so you can follow up from the master admin side."
      navItems={adminNavItems}
    >
      {query.resolved ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          Support request marked resolved.
        </div>
      ) : null}

      {query.error === "reply_required" ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          Please write a short admin reply before marking a ticket resolved.
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-ink">Open issues</h2>
            <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700">
              {openRequests.length} open
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            {openRequests.length === 0 ? (
              <div className="rounded-3xl bg-cream p-6 text-sm text-slate-600">
                No open support requests right now.
              </div>
            ) : (
              openRequests.map((request) => (
                <article
                  className="rounded-3xl border border-orange-100 bg-cream p-4"
                  key={request.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-ink">{request.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {request.restaurant.name} · {request.user.email}
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-clay">
                      Open ticket
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {request.message}
                  </p>
                  <form action={resolveSupportRequestAction} className="mt-4 grid gap-3">
                    <input name="supportRequestId" type="hidden" value={request.id} />
                    <input name="returnTo" type="hidden" value="/admin/support" />
                    <label className="grid gap-2 text-sm font-bold text-ink">
                      Admin reply
                      <textarea
                        className="min-h-24 rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                        defaultValue={`Hi ${request.user.name ?? "team"}, issue checked. Please try again and let us know if it still happens.`}
                        name="adminReply"
                        required
                      />
                    </label>
                    <button className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white">
                      Reply and resolve
                    </button>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                    <span>{request.createdAt.toLocaleString("en-IN")}</span>
                    <Link
                      className="text-clay underline decoration-orange-200 underline-offset-4"
                      href={`/admin/restaurants/${request.restaurant.id}`}
                    >
                      Open restaurant
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-ink">Resolved issues</h2>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              {resolvedRequests.length} resolved
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            {resolvedRequests.length === 0 ? (
              <div className="rounded-3xl bg-cream p-6 text-sm text-slate-600">
                No resolved requests yet.
              </div>
            ) : (
              resolvedRequests.map((request) => (
                <article
                  className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4"
                  key={request.id}
                >
                  <p className="text-lg font-black text-ink">{request.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {request.restaurant.name} · {request.user.email}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {request.message}
                  </p>
                  {request.adminReply ? (
                    <div className="mt-4 rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                        Admin reply
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                        {request.adminReply}
                      </p>
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs font-bold text-slate-500">
                    {request.resolvedAt
                      ? `Resolved at ${request.resolvedAt.toLocaleString("en-IN")}`
                      : "Resolved"}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
