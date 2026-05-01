import { PageLoadingCard } from "@/components/page-loading-card";

export default function Loading() {
  return (
    <PageLoadingCard
      body="Refreshing your cart and latest totals."
      eyebrow="Cart"
      title="Updating your cart"
    />
  );
}
