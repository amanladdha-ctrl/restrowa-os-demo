const statusSteps = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered"
];

export function OrderStatusSteps({ status }: { status: string }) {
  const currentIndex = statusSteps.indexOf(status);
  const cancelled = status === "cancelled" || status === "rejected";

  return (
    <div className="grid gap-3">
      {statusSteps.map((step, index) => {
        const active = !cancelled && index <= currentIndex;
        return (
          <div className="flex items-center gap-3" key={step}>
            <span
              className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${
                active ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`text-sm font-bold ${
                active ? "text-ink" : "text-slate-400"
              }`}
            >
              {step.replaceAll("_", " ")}
            </span>
          </div>
        );
      })}

      {cancelled ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          This order is {status.replaceAll("_", " ")}.
        </div>
      ) : null}
    </div>
  );
}
