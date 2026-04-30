import type { OrderStatus } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import {
  updateOrderStatusAction,
  verifyPaymentAction
} from "@/app/owner/orders/actions";
import { formatCurrency } from "@/lib/format";

type OrderCardProps = {
  order: {
    id: string;
    orderNumber: number;
    orderCode: string;
    customerName: string | null;
    customerPhone: string;
    orderType: string;
    status: string;
    paymentStatus: string;
    paymentMode: string;
    totalAmount: { toString(): string };
    createdAt: Date;
    deliveryAddress: string | null;
    tableNumber: string | null;
    pickupTime: string | null;
    instructions: string | null;
    items: Array<{
      id: string;
      itemName: string;
      quantity: number;
      unitPrice: { toString(): string };
    }>;
  };
  restaurantId: string;
  returnTo: string;
};

const statusActions: Array<{ label: string; status: OrderStatus }> = [
  { label: "Accept", status: "accepted" },
  { label: "Reject", status: "rejected" },
  { label: "Preparing", status: "preparing" },
  { label: "Ready", status: "ready" },
  { label: "Out for delivery", status: "out_for_delivery" },
  { label: "Delivered", status: "delivered" },
  { label: "Cancel", status: "cancelled" }
];

export function OrderCard({ order, restaurantId, returnTo }: OrderCardProps) {
  return (
    <article className="rounded-[2rem] border border-orange-100 bg-white/95 p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-clay">
            Order {order.orderCode}
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            {order.customerName ?? "Customer"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{order.customerPhone}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge value={order.status} />
            <StatusBadge value={order.paymentStatus} />
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-black text-clay">
              {order.orderType.replaceAll("_", " ")}
            </span>
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-black text-clay">
              {order.paymentMode.replaceAll("_", " ")}
            </span>
          </div>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-3xl font-black text-ink">
            {formatCurrency(order.totalAmount.toString())}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {order.createdAt.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-cream p-4">
        <p className="font-black text-ink">Items</p>
        <div className="mt-3 grid gap-2">
          {order.items.map((item) => (
            <div className="flex justify-between gap-3 text-sm" key={item.id}>
              <span>
                {item.quantity} x {item.itemName}
              </span>
              <strong>
                {formatCurrency(Number(item.unitPrice) * item.quantity)}
              </strong>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600">
        {order.deliveryAddress ? <p>Address: {order.deliveryAddress}</p> : null}
        {order.tableNumber ? <p>Table: {order.tableNumber}</p> : null}
        {order.pickupTime ? <p>Pickup time: {order.pickupTime}</p> : null}
        {order.instructions ? <p>Instructions: {order.instructions}</p> : null}
        {order.paymentStatus === "payment_pending_verification" ? (
          <p className="font-bold text-amber-700">
            Waiting for restaurant payment verification.
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {statusActions.map((action) => (
          <form action={updateOrderStatusAction} key={action.status}>
            <input name="restaurantId" type="hidden" value={restaurantId} />
            <input name="orderId" type="hidden" value={order.id} />
            <input name="status" type="hidden" value={action.status} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white transition hover:bg-clay">
              {action.label}
            </button>
          </form>
        ))}

        {order.paymentStatus === "payment_pending_verification" ? (
          <form action={verifyPaymentAction}>
            <input name="restaurantId" type="hidden" value={restaurantId} />
            <input name="orderId" type="hidden" value={order.id} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
              Verify payment
            </button>
          </form>
        ) : null}

        <button className="rounded-2xl bg-cream px-4 py-3 text-sm font-black text-clay">
          Print KOT
        </button>
      </div>
    </article>
  );
}
