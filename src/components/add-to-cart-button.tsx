"use client";

import { useState } from "react";

type AddToCartButtonProps = {
  menuItemId: string;
  restaurantSlug: string;
  themeColor: string;
};

export function AddToCartButton({
  menuItemId,
  restaurantSlug,
  themeColor
}: AddToCartButtonProps) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  async function handleAdd() {
    if (pending) return;

    setPending(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/public/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          restaurantSlug,
          menuItemId,
          quantity: 1
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; itemCount?: number; totalAmount?: number }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error("Add to cart failed.");
      }

      window.dispatchEvent(
        new CustomEvent("restrowa-cart-updated", {
          detail: {
            itemCount: payload.itemCount ?? 0,
            totalAmount: payload.totalAmount ?? 0
          }
        })
      );

      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 1400);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 1800);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      className="rounded-full px-4 py-2 text-xs font-black text-white transition disabled:cursor-wait disabled:opacity-70"
      onClick={handleAdd}
      style={{ backgroundColor: themeColor }}
      type="button"
    >
      {pending
        ? "Adding..."
        : status === "done"
          ? "Added"
          : status === "error"
            ? "Retry"
            : "Add"}
    </button>
  );
}
