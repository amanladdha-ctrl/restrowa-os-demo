"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FoodImage } from "@/components/food-image";
import type { PublicCartSnapshot } from "@/lib/public-cart-snapshot";
import { formatCurrency } from "@/lib/format";

type PublicCartClientProps = {
  initialCart: PublicCartSnapshot | null;
  orderingBlocked: boolean;
  orderingMessage: string;
  slug: string;
};

type CartMutationResponse = {
  cart: PublicCartSnapshot | null;
  message?: string;
  ok?: boolean;
};

export function PublicCartClient({
  initialCart,
  orderingBlocked,
  orderingMessage,
  slug
}: PublicCartClientProps) {
  const [cart, setCart] = useState(initialCart);
  const [couponCode, setCouponCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const isEmpty = !cart || cart.items.length === 0;

  const totals = useMemo(
    () => ({
      deliveryCharge: cart?.deliveryCharge ?? 0,
      discountAmount: cart?.discountAmount ?? 0,
      subtotal: cart?.subtotal ?? 0,
      totalAmount: cart?.totalAmount ?? 0
    }),
    [cart]
  );

  async function runMutation(
    body:
      | {
          action: "updateItem";
          cartItemId: string;
          quantity: number;
          restaurantSlug: string;
        }
      | {
          action: "removeItem";
          cartItemId: string;
          restaurantSlug: string;
        }
      | {
          action: "applyCoupon";
          couponCode: string;
          restaurantSlug: string;
        }
      | {
          action: "clearCoupon";
          restaurantSlug: string;
        },
    pendingId: string,
    successMessage?: string
  ) {
    setPendingKey(pendingId);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await fetch("/api/public/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const payload = (await response.json().catch(() => null)) as
        | CartMutationResponse
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "Cart update failed.");
      }

      setCart(payload.cart ?? null);

      if (payload.cart) {
        window.dispatchEvent(
          new CustomEvent("restrowa-cart-updated", {
            detail: {
              itemCount: payload.cart.itemCount,
              totalAmount: payload.cart.totalAmount
            }
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("restrowa-cart-updated", {
            detail: {
              itemCount: 0,
              totalAmount: 0
            }
          })
        );
      }

      if (successMessage) {
        setInfoMessage(successMessage);
        window.setTimeout(() => setInfoMessage(null), 1400);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Cart update failed."
      );
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <>
      {errorMessage ? (
        <div className="mt-5 rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {infoMessage ? (
        <div className="mt-5 rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          {infoMessage}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-cream p-8 text-center">
          <h2 className="text-2xl font-black text-ink">Cart is empty</h2>
          <p className="mt-2 text-sm text-slate-600">
            Add items from the public menu to continue.
          </p>
          <Link
            className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
            href={`/menu/${slug}`}
          >
            Back to menu
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4">
            {cart.items.map((item) => (
              <article
                className="rounded-3xl border border-orange-100 bg-cream p-4"
                key={item.id}
              >
                <div className="flex gap-4">
                  <FoodImage alt={item.menuItem.name} src={item.menuItem.imageUrl} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-black text-ink">{item.menuItem.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatCurrency(item.menuItem.price)} each
                        </p>
                      </div>
                      <p className="font-black text-clay">
                        {formatCurrency(item.lineTotal)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 rounded-2xl bg-white px-2 py-2">
                        <button
                          className="h-9 w-9 rounded-xl bg-cream text-sm font-black text-ink disabled:cursor-wait disabled:opacity-60"
                          disabled={pendingKey === item.id}
                          onClick={() =>
                            runMutation(
                              {
                                action: "updateItem",
                                cartItemId: item.id,
                                quantity: Math.max(item.quantity - 1, 0),
                                restaurantSlug: slug
                              },
                              item.id,
                              "Cart updated."
                            )
                          }
                          type="button"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-black text-ink">
                          {item.quantity}
                        </span>
                        <button
                          className="h-9 w-9 rounded-xl bg-ink text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
                          disabled={pendingKey === item.id || item.quantity >= 20}
                          onClick={() =>
                            runMutation(
                              {
                                action: "updateItem",
                                cartItemId: item.id,
                                quantity: Math.min(item.quantity + 1, 20),
                                restaurantSlug: slug
                              },
                              item.id,
                              "Cart updated."
                            )
                          }
                          type="button"
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-700 disabled:cursor-wait disabled:opacity-70"
                        disabled={pendingKey === `remove-${item.id}`}
                        onClick={() =>
                          runMutation(
                            {
                              action: "removeItem",
                              cartItemId: item.id,
                              restaurantSlug: slug
                            },
                            `remove-${item.id}`,
                            "Item removed."
                          )
                        }
                        type="button"
                      >
                        {pendingKey === `remove-${item.id}` ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-6 rounded-3xl bg-cream p-5">
            <h2 className="text-xl font-black text-ink">Coupon</h2>
            {cart.couponCode ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <p className="font-black text-emerald-700">{cart.couponCode}</p>
                <button
                  className="text-sm font-black text-red-700 disabled:opacity-70"
                  disabled={pendingKey === "clear-coupon"}
                  onClick={() =>
                    runMutation(
                      {
                        action: "clearCoupon",
                        restaurantSlug: slug
                      },
                      "clear-coupon",
                      "Coupon removed."
                    )
                  }
                  type="button"
                >
                  {pendingKey === "clear-coupon" ? "Removing..." : "Remove"}
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-2xl border border-orange-100 bg-white px-4 py-3 font-bold uppercase"
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="DEMO10"
                  value={couponCode}
                />
                <button
                  className="rounded-2xl bg-saffron px-5 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-70"
                  disabled={pendingKey === "apply-coupon" || !couponCode.trim()}
                  onClick={() =>
                    runMutation(
                      {
                        action: "applyCoupon",
                        couponCode,
                        restaurantSlug: slug
                      },
                      "apply-coupon",
                      "Coupon applied."
                    ).then(() => setCouponCode(""))
                  }
                  type="button"
                >
                  {pendingKey === "apply-coupon" ? "Applying..." : "Apply"}
                </button>
              </div>
            )}
          </section>

          <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-ink">Bill summary</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{formatCurrency(totals.subtotal)}</strong>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <strong>-{formatCurrency(totals.discountAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Delivery estimate</span>
                <strong>{formatCurrency(totals.deliveryCharge)}</strong>
              </div>
              <div className="mt-3 flex justify-between border-t border-orange-100 pt-3 text-lg font-black">
                <span>Total</span>
                <span>{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>

            {orderingBlocked ? (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                {orderingMessage}
              </div>
            ) : (
              <Link
                className="mt-5 flex justify-center rounded-2xl bg-ink px-5 py-4 text-base font-black text-white"
                href={`/menu/${slug}/checkout`}
              >
                Continue to checkout
              </Link>
            )}
          </section>
        </>
      )}
    </>
  );
}
