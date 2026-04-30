import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveRefresh } from "@/components/live-refresh";
import { OrderStatusSteps } from "@/components/order-status-steps";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/format";
import { buildUpiPaymentLink, buildUpiQrDataUrl } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TrackOrderPage({
  params
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurant: { slug }
    },
    include: {
      restaurant: true,
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!order) notFound();
  const canShowUpiPayment =
    order.paymentStatus === "payment_pending_verification" &&
    (order.paymentMode === "upi_qr" || order.paymentMode === "payment_link");
  const upiId = order.restaurant.upiId ?? "demo@upi";
  const upiLink = canShowUpiPayment
    ? buildUpiPaymentLink({
        payeeName: order.restaurant.name,
        upiId,
        amount: Number(order.totalAmount),
        orderCode: order.orderCode
      })
    : null;
  const upiQrDataUrl =
    canShowUpiPayment && upiLink
      ? await buildUpiQrDataUrl({
          payeeName: order.restaurant.name,
          upiId,
          amount: Number(order.totalAmount),
          orderCode: order.orderCode
        })
      : null;

  return (
    <main className="min-h-screen px-4 py-5">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-6 shadow-soft">
        <LiveRefresh
          intervalMs={10000}
          latestValue={`${order.status}-${order.paymentStatus}`}
          message="This tracking screen auto-refreshes every 10 seconds, so the customer can see the latest order progress."
          storageKey={`track-${order.id}`}
        />
        <p className="text-sm font-black uppercase tracking-[0.2em] text-clay">
          Track order
        </p>
        <h1 className="mt-2 text-3xl font-black text-ink">
          {order.orderCode} · {order.restaurant.name}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Estimated time: 30-40 minutes after restaurant accepts the order.
          Refresh this page to see the latest restaurant update.
        </p>

        <div className="mt-6 grid gap-4 rounded-3xl bg-cream p-5">
          <div className="flex justify-between">
            <span className="font-bold text-slate-500">Status</span>
            <StatusBadge value={order.status} />
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-500">Payment</span>
            <StatusBadge value={order.paymentStatus} />
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-slate-500">Total</span>
            <strong>{formatCurrency(order.totalAmount.toString())}</strong>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">Order progress</h2>
          <div className="mt-4">
            <OrderStatusSteps status={order.status} />
          </div>
        </div>

        {canShowUpiPayment && upiLink ? (
          <div className="mt-6 rounded-3xl bg-cream p-5">
            <h2 className="text-xl font-black text-ink">Pending payment</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pay the exact order amount from this page. Restaurant will verify the
              payment in MVP.
            </p>
            <div className="mt-4 flex flex-col items-center gap-4 rounded-3xl bg-white p-4">
              <div className="h-40 w-40 overflow-hidden rounded-3xl border border-orange-100 bg-white p-2">
                {upiQrDataUrl ? (
                  <img
                    alt={`UPI QR for ${order.orderCode}`}
                    className="h-full w-full rounded-2xl object-contain"
                    src={upiQrDataUrl}
                  />
                ) : null}
              </div>
              <p className="text-sm text-slate-600">
                UPI ID: <strong>{upiId}</strong>
              </p>
              <p className="text-sm text-slate-600">
                Amount: <strong>{formatCurrency(order.totalAmount.toString())}</strong>
              </p>
              <a
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white"
                href={upiLink}
              >
                Pay now in UPI app
              </a>
              <input
                className="w-full rounded-2xl border border-orange-100 bg-cream px-4 py-3 text-xs text-slate-600"
                readOnly
                value={upiLink}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl bg-cream p-5">
          <h2 className="text-xl font-black text-ink">Items</h2>
          <div className="mt-4 grid gap-2">
            {order.items.map((item) => (
              <div className="flex justify-between text-sm" key={item.id}>
                <span>
                  {item.quantity} x {item.itemName}
                </span>
                <strong>{formatCurrency(Number(item.unitPrice) * item.quantity)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
            href={`/menu/${slug}`}
          >
            Back to menu
          </Link>
          <a
            className="rounded-full bg-cream px-5 py-3 text-sm font-black text-clay"
            href={`tel:${order.restaurant.phone}`}
          >
            Call restaurant
          </a>
          <Link
            className="rounded-full bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700"
            href={`/menu/${slug}/orders/${order.id}/track`}
          >
            Refresh status
          </Link>
        </div>
      </section>
    </main>
  );
}
