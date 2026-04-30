import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { findRestaurantForCustomHost } from "@/lib/domain-routing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const requestHeaders = await headers();
  const customDomainRestaurant = await findRestaurantForCustomHost(
    requestHeaders.get("host")
  );

  if (customDomainRestaurant) {
    redirect(`/menu/${customDomainRestaurant.slug}`);
  }

  const demoRestaurant = await prisma.restaurant.findUnique({
    where: { slug: "mewad-bites" },
    select: { name: true, slug: true, status: true }
  });

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-clay">
            RestroWA OS
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-ink">
            Direct restaurant ordering through WhatsApp and mobile web.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Phase 1 is the stable foundation: roles, database model, demo
            restaurant, and safe route areas. Next phases will turn this into
            the full QR to order dashboard flow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-ink px-6 py-3 text-sm font-black text-white transition hover:bg-clay"
              href="/login"
            >
              Login to dashboard
            </Link>
            <Link
              className="rounded-full border border-clay/20 bg-white px-6 py-3 text-sm font-black text-clay transition hover:bg-cream"
              href="/menu/mewad-bites"
            >
              Open demo menu
            </Link>
            <Link
              className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              href="/whatsapp-simulator/mewad-bites"
            >
              Open WhatsApp simulator
            </Link>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/80 bg-white/90 p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-saffron">
            Demo tenant
          </p>
          <h2 className="mt-3 text-3xl font-black text-ink">
            {demoRestaurant?.name ?? "Run seed to create Mewad Bites"}
          </h2>
          <div className="mt-4">
            {demoRestaurant ? (
              <StatusBadge value={demoRestaurant.status} />
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                database not seeded
              </span>
            )}
          </div>
          <div className="mt-6 grid gap-3 text-sm text-slate-600">
            <p>Public slug: /menu/mewad-bites</p>
            <p>WhatsApp simulator: /whatsapp-simulator/mewad-bites</p>
            <p>Currency: INR</p>
            <p>Trial: 30 days with 5 day grace period</p>
            <p>Per-order fee support: enabled in schema and seed</p>
          </div>
        </div>
      </section>
    </main>
  );
}
