import { clsx } from "clsx";

const statusStyles: Record<string, string> = {
  trial: "bg-blue-50 text-blue-700 ring-blue-100",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  past_due: "bg-amber-50 text-amber-700 ring-amber-100",
  suspended: "bg-red-50 text-red-700 ring-red-100",
  inactive: "bg-slate-100 text-slate-700 ring-slate-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-100",
  accepted: "bg-blue-50 text-blue-700 ring-blue-100",
  preparing: "bg-orange-50 text-orange-700 ring-orange-100",
  ready: "bg-purple-50 text-purple-700 ring-purple-100",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  cancelled: "bg-red-50 text-red-700 ring-red-100"
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
        statusStyles[value] ?? "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
