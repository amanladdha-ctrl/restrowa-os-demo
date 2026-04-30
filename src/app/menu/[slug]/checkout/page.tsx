import Link from "next/link";
import { notFound } from "next/navigation";
import { placeOrderAction } from "@/app/menu/[slug]/checkout/actions";
import { calculateCartTotals, getCartForRestaurant } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "Please check customer details and try again.",
  delivery_disabled: "Delivery is not enabled for this restaurant.",
  pickup_disabled: "Pickup is not enabled for this restaurant.",
  dine_in_disabled: "Dine-in is not enabled for this restaurant.",
  cod_disabled: "COD is not enabled for this restaurant.",
  upi_disabled: "UPI QR is not enabled for this restaurant.",
  payment_link_disabled: "Payment link is not enabled for this restaurant.",
  minimum_order: "Cart total is below the minimum order amount.",
  address_required: "Delivery address is required.",
  table_required: "Table number is required for dine-in."
};

export default async function CheckoutPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });

  if (!restaurant) notFound();
  const subscriptionState = evaluateRestaurantSubscription(restaurant);

  const cart = await getCartForRestaurant(restaurant.id);
  const totals = cart ? calculateCartTotals(cart) : null;

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen px-4 py-5">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-soft">
          <h1 className="text-3xl font-black text-ink">Cart is empty</h1>
          <p className="mt-2 text-slate-600">Add items before checkout.</p>
          <Link
            className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
            href={`/menu/${slug}`}
          >
            Back to menu
          </Link>
        </section>
      </main>
    );
  }

  const preferredPaymentMode = restaurant.upiQrEnabled
    ? "upi_qr"
    : restaurant.codEnabled
      ? "cod"
      : "payment_link";

  return (
    <main className="min-h-screen px-4 py-5">
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-5 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-clay">
          Checkout
        </p>
        <h1 className="mt-2 text-3xl font-black text-ink">{restaurant.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Place order with COD, dynamic UPI QR, or a payment link.
        </p>

        {query.error ? (
          <div className="mt-5 rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {errorMessages[query.error] ?? "Something went wrong."}
          </div>
        ) : null}

        {subscriptionState.orderingBlocked ? (
          <div className="mt-5 rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {subscriptionState.customerNotice?.title ?? "Ordering unavailable"}.
            {" "}
            {subscriptionState.customerNotice?.body ?? "Please contact the restaurant directly."}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <form action={placeOrderAction} className="grid gap-4">
            <input name="restaurantSlug" type="hidden" value={slug} />

            <section className="rounded-3xl bg-cream p-5">
              <h2 className="text-xl font-black text-ink">Order type</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink">
                  <input
                    className="mr-2"
                    defaultChecked={restaurant.deliveryEnabled}
                    disabled={!restaurant.deliveryEnabled}
                    name="orderType"
                    type="radio"
                    value="delivery"
                  />
                  Delivery
                </label>
                <label className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink">
                  <input
                    className="mr-2"
                    defaultChecked={!restaurant.deliveryEnabled && restaurant.pickupEnabled}
                    disabled={!restaurant.pickupEnabled}
                    name="orderType"
                    type="radio"
                    value="pickup"
                  />
                  Pickup
                </label>
                <label className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink">
                  <input
                    className="mr-2"
                    disabled={!restaurant.dineInEnabled}
                    name="orderType"
                    type="radio"
                    value="dine_in"
                  />
                  Dine-in
                </label>
              </div>
            </section>

            <section className="rounded-3xl bg-cream p-5">
              <h2 className="text-xl font-black text-ink">Customer details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-ink">
                  Name
                  <input
                    className="rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                    name="customerName"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink">
                  Phone
                  <input
                    className="rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                    name="customerPhone"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink sm:col-span-2">
                  Delivery address
                  <input
                    className="rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                    name="deliveryAddress"
                    placeholder="Required for delivery"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink">
                  Landmark
                  <input
                    className="rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                    name="landmark"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink">
                  Pickup time
                  <input
                    className="rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                    name="pickupTime"
                    placeholder="Optional"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink">
                  Table number
                  <input
                    className="rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                    name="tableNumber"
                    placeholder="For dine-in"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink sm:col-span-2">
                  Instructions
                  <textarea
                    className="min-h-24 rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal"
                    name="instructions"
                    placeholder="Less spicy, no onion, extra chutney..."
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl bg-cream p-5">
              <h2 className="text-xl font-black text-ink">Payment</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink">
                  <input
                    className="mr-2"
                    defaultChecked={preferredPaymentMode === "cod"}
                    disabled={!restaurant.codEnabled}
                    name="paymentMode"
                    type="radio"
                    value="cod"
                  />
                  Cash / COD
                </label>
                <label className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink">
                  <input
                    className="mr-2"
                    defaultChecked={preferredPaymentMode === "upi_qr"}
                    disabled={!restaurant.upiQrEnabled}
                    name="paymentMode"
                    type="radio"
                    value="upi_qr"
                  />
                  Dynamic UPI QR (recommended)
                </label>
                <label className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink sm:col-span-2">
                  <input
                    className="mr-2"
                    defaultChecked={preferredPaymentMode === "payment_link"}
                    disabled={!restaurant.upiQrEnabled}
                    name="paymentMode"
                    type="radio"
                    value="payment_link"
                  />
                  Payment link / open UPI app
                </label>
              </div>
              {restaurant.upiQrEnabled ? (
                <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600">
                  UPI ID: <strong>{restaurant.upiId ?? "demo@upi"}</strong>. After
                  order placement we generate an amount-based UPI link and QR for this
                  exact order total. Payment still stays pending verification in MVP.
                </div>
              ) : null}
            </section>

            {subscriptionState.orderingBlocked ? (
              <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-base font-black text-slate-500 shadow-soft">
                Checkout disabled
              </div>
            ) : (
              <button className="rounded-2xl bg-saffron px-5 py-4 text-base font-black text-white shadow-soft">
                Place order
              </button>
            )}
          </form>

          <aside className="h-fit rounded-3xl bg-cream p-5">
            <h2 className="text-xl font-black text-ink">Order summary</h2>
            <div className="mt-4 grid gap-3">
              {cart.items.map((item) => (
                <div className="flex justify-between gap-3 text-sm" key={item.id}>
                  <span>
                    {item.quantity} x {item.menuItem.name}
                  </span>
                  <strong>
                    {formatCurrency(Number(item.menuItem.price) * item.quantity)}
                  </strong>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 border-t border-orange-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{formatCurrency(totals?.subtotal ?? 0)}</strong>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <strong>-{formatCurrency(totals?.discountAmount ?? 0)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Delivery estimate</span>
                <strong>{formatCurrency(totals?.deliveryCharge ?? 0)}</strong>
              </div>
              <div className="mt-2 flex justify-between text-lg font-black">
                <span>Total</span>
                <span>{formatCurrency(totals?.totalAmount ?? 0)}</span>
              </div>
            </div>
            <Link
              className="mt-5 inline-flex text-sm font-black text-clay"
              href={`/menu/${slug}/cart`}
            >
              Back to cart
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
