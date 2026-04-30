import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";
import { sendSimulatorMessageAction } from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  missing_fields: "Phone number and message are required."
};

export default async function WhatsAppSimulatorPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const phone = query.phone?.trim() ?? "";

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      whatsappNumber: true,
      status: true,
      trialEndDate: true,
      subscriptionEndDate: true,
      gracePeriodDays: true,
      paymentDueAmount: true,
      logoUrl: true
    }
  });

  if (!restaurant) {
    notFound();
  }
  const subscriptionState = evaluateRestaurantSubscription(restaurant);

  const messages = phone
    ? await prisma.whatsAppMessage.findMany({
        where: {
          restaurantId: restaurant.id,
          customerPhone: phone
        },
        orderBy: { createdAt: "asc" },
        take: 40
      })
    : [];

  const session = phone
    ? await prisma.whatsAppSession.findFirst({
        where: { restaurantId: restaurant.id, customerPhone: phone },
        orderBy: { updatedAt: "desc" }
      })
    : null;

  return (
    <main className="min-h-screen px-4 py-6">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-clay">
            WhatsApp Simulator
          </p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-ink">{restaurant.name}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This mock inbox simulates customer WhatsApp entry for menu link,
                order tracking, call/chat option, and offers.
              </p>
            </div>
            {restaurant.logoUrl ? (
              <BrandLogo className="h-16 w-16" name={restaurant.name} src={restaurant.logoUrl} />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ink text-lg font-black text-white">
                WA
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge value={subscriptionState.effectiveStatus} />
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-black text-clay">
              Phone: {restaurant.whatsappNumber}
            </span>
          </div>

          <div className="mt-6 rounded-3xl bg-cream p-5">
            <p className="font-black text-ink">How to test</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <p>1. Enter a phone number.</p>
              <p>2. Send `Hi`.</p>
              <p>3. Try `1`, `2`, `3`, or `4` like a customer would.</p>
              <p>4. For tracking, send the order ID from your demo order, for example `ME-1002`.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
              href={`/menu/${restaurant.slug}`}
            >
              Open public menu
            </Link>
            <Link
              className="rounded-full bg-cream px-5 py-3 text-sm font-black text-clay"
              href="/admin/whatsapp-logs"
            >
              Open WhatsApp logs
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-soft">
          {query.error ? (
            <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {errorMessages[query.error] ?? "Something went wrong."}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-ink">Chat window</h2>
              <p className="mt-1 text-sm text-slate-600">
                Messages are stored in `whatsapp_messages` and session state in
                `whatsapp_sessions`.
              </p>
            </div>
            {session ? (
              <span className="rounded-full bg-mint px-3 py-2 text-xs font-black uppercase text-emerald-800">
                {session.state.replaceAll("_", " ")}
              </span>
            ) : null}
          </div>

          <form action={sendSimulatorMessageAction} className="mt-5 grid gap-3 rounded-3xl bg-cream p-4">
            <input name="slug" type="hidden" value={restaurant.slug} />
            <label className="grid gap-2 text-sm font-bold text-ink">
              Customer phone
              <input
                className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none"
                defaultValue={phone}
                name="customerPhone"
                placeholder="+91 9876543210"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Message
              <textarea
                className="min-h-24 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none"
                defaultValue={phone ? "" : "Hi"}
                name="message"
                placeholder="Type Hi, 1, 2, 3, 4 or order ID"
                required
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full bg-ink px-5 py-3 text-sm font-black text-white">
                Send message
              </button>
              {!phone ? (
                <button
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white"
                  formAction={sendSimulatorMessageAction}
                  name="message"
                  value="Hi"
                >
                  Quick start with Hi
                </button>
              ) : null}
            </div>
          </form>

          <div className="mt-5 rounded-[2rem] bg-slate-50 p-4">
            <div className="grid gap-3">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <p className="text-lg font-black text-ink">No chat yet</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Start by sending `Hi` from any phone number.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const incoming = message.direction === "incoming";

                  return (
                    <div
                      className={`max-w-[88%] rounded-[1.4rem] px-4 py-3 text-sm shadow-soft ${
                        incoming
                          ? "mr-auto bg-white text-ink"
                          : "ml-auto bg-emerald-600 text-white"
                      }`}
                      key={message.id}
                    >
                      <p className="whitespace-pre-line leading-6">{message.message}</p>
                      <p
                        className={`mt-2 text-[11px] font-bold ${
                          incoming ? "text-slate-500" : "text-emerald-100"
                        }`}
                      >
                        {incoming ? "Customer" : "Bot"} ·{" "}
                        {message.createdAt.toLocaleString("en-IN")}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
