"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

type CartSummaryLinkProps = {
  className: string;
  href: string;
  initialItemCount: number;
  initialTotalAmount: number;
  themeColor?: string;
};

type CartUpdatedEventDetail = {
  itemCount: number;
  totalAmount: number;
};

export function CartSummaryLink({
  className,
  href,
  initialItemCount,
  initialTotalAmount,
  themeColor
}: CartSummaryLinkProps) {
  const [itemCount, setItemCount] = useState(initialItemCount);
  const [totalAmount, setTotalAmount] = useState(initialTotalAmount);

  useEffect(() => {
    setItemCount(initialItemCount);
    setTotalAmount(initialTotalAmount);
  }, [initialItemCount, initialTotalAmount]);

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdatedEventDetail>).detail;
      if (!detail) return;

      setItemCount(detail.itemCount);
      setTotalAmount(detail.totalAmount);
    };

    window.addEventListener("restrowa-cart-updated", handleCartUpdated);
    return () =>
      window.removeEventListener("restrowa-cart-updated", handleCartUpdated);
  }, []);

  const style = themeColor ? { backgroundColor: themeColor } : undefined;

  return (
    <Link className={className} href={href} style={style}>
      {itemCount > 0 ? (
        <>
          <span>{itemCount} item(s) in cart</span>
          <span>{formatCurrency(totalAmount)} - Checkout</span>
        </>
      ) : (
        <span>Open cart</span>
      )}
    </Link>
  );
}
