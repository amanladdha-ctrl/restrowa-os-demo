import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { adminNavItems } from "@/lib/admin-nav";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireRole([UserRole.SUPER_ADMIN]);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      restaurant: { select: { id: true, name: true, slug: true } },
      actor: { select: { name: true, email: true } }
    }
  });

  return (
    <AppShell
      title="Audit Logs"
      subtitle="Track important SaaS owner actions such as restaurant creation, suspension, trial extension, and payment updates."
      navItems={adminNavItems}
    >
      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">Recent activity</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-3">Action</th>
                <th>Restaurant</th>
                <th>Actor</th>
                <th>Entity</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr className="border-t border-orange-100" key={log.id}>
                  <td className="py-4 font-black text-ink">{log.action}</td>
                  <td>
                    {log.restaurant ? (
                      <Link
                        className="font-bold text-clay underline decoration-orange-200 underline-offset-4"
                        href={`/admin/restaurants/${log.restaurant.id}`}
                      >
                        {log.restaurant.name}
                      </Link>
                    ) : (
                      "Platform"
                    )}
                  </td>
                  <td>
                    <p className="font-semibold text-ink">
                      {log.actor?.name ?? "System"}
                    </p>
                    <p className="text-slate-500">{log.actor?.email ?? "n/a"}</p>
                  </td>
                  <td>
                    {log.entityType}
                    {log.entityId ? (
                      <span className="text-slate-500"> · {log.entityId.slice(0, 8)}</span>
                    ) : null}
                  </td>
                  <td>{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
