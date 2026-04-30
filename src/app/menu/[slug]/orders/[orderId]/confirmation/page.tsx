import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusSteps } from "@/components/order-status-steps";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/format";
import { buildUpiPaymentLink, buildUpiQrDataUrl } from "@/lib/payment-links";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
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
      items: true
    }
  });

  if (!order) notFound();
  const canShowUpiPayment =
    order.paymentMode === "upi_qr" || order.paymentMode === "payment_link";
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
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
          Order placed
        </p>
        <h1 className="mt-2 text-3xl font-black text-ink">
          Thank you, {order.customerName}
        </h1>
        <p className="mt-2 text-slate-600">
          Your order has been created and is now visible in the restaurant live
          orders dashboard.
        </p>

        <div className="mt-6 grid gap-4 rounded-3xl bg-cream p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-500">Order ID</span>
            <strong className="text-xl text-ink">{order.orderCode}</strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-500">Total</span>
            <strong className="text-xl text-ink">
              {formatCurrency(order.totalAmount.toString())}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-500">Order status</span>
            <StatusBadge value={order.status} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-500">Payment</span>
            <StatusBadge value={order.paymentStatus} />
          </div>
        </div>

        {canShowUpiPayment && upiLink ? (
          <div className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-white p-5 text-center">
            <div className="mx-auto h-40 w-40 overflow-hidden rounded-3xl border border-orange-100 bg-white p-2">
              {upiQrDataUrl ? (
                <img
                  alt={`UPI QR for ${order.orderCode}`}
                  className="h-full w-full rounded-2xl object-contain"
                  src={upiQrDataUrl}
                />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-2xl bg-cream text-sm font-black text-clay">
                  UPI QR
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-600">
              UPI ID: <strong>{upiId}</strong>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Exact amount: <strong>{formatCurrency(order.totalAmount.toString())}</strong>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Payment stays pending until restaurant verifies it in MVP.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white"
                href={upiLink}
              >
                Pay now in UPI app
              </a>
            </div>
            <div className="mt-4 rounded-2xl bg-cream px-4 py-3 text-left">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-clay">
                Payment link
              </p>
              <input
                className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-xs text-slate-600"
                readOnly
                value={upiLink}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl bg-cream p-5">
          <h2 className="text-xl font-black text-ink">Tracking</h2>
          <div className="mt-4">
            <OrderStatusSteps status={order.status} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
            href={`/menu/${slug}/orders/${order.id}/track`}
          >
            Track order
          </Link>
          <Link
            className="rounded-full bg-cream px-5 py-3 text-sm font-black text-clay"
            href={`/menu/${slug}`}
          >
            Back to menu
          </Link>
        </div>
      </section>
    </main>
  );
}
