import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminNavItems } from "@/lib/admin-nav";

export const dynamic = "force-dynamic";

export default async function WhatsAppLogsPage() {
  await requireRole([UserRole.SUPER_ADMIN]);

  const [messages, sessionCount] = await Promise.all([
    prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        restaurant: {
          select: { id: true, name: true, slug: true }
        }
      }
    }),
    prisma.whatsAppSession.count()
  ]);

  return (
    <AppShell
      title="WhatsApp Logs"
      subtitle="Simulator messages are stored here now so the later real WhatsApp webhook can use the same message history model."
      navItems={adminNavItems}
    >
      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">Recent simulator messages</h2>
            <p className="mt-1 text-sm text-slate-600">
              Total open sessions: {sessionCount}
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-3">Restaurant</th>
                <th>Phone</th>
                <th>Direction</th>
                <th>Message</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr className="border-t border-orange-100 align-top" key={message.id}>
                  <td className="py-4">
                    <Link
                      className="font-black text-ink underline decoration-orange-200 underline-offset-4"
                      href={`/admin/restaurants/${message.restaurant.id}`}
                    >
                      {message.restaurant.name}
                    </Link>
                    <p className="text-slate-500">/{message.restaurant.slug}</p>
                  </td>
                  <td className="font-semibold text-ink">{message.customerPhone}</td>
                  <td className="capitalize">{message.direction}</td>
                  <td className="max-w-[420px] whitespace-pre-line leading-6 text-slate-700">
                    {message.message}
                  </td>
                  <td className="capitalize">{message.status}</td>
                  <td>{message.createdAt.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
