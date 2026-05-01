import { PageLoadingCard } from "@/components/page-loading-card";

export default function Loading() {
  return (
    <PageLoadingCard
      body="Fetching the restaurant menu and your cart summary."
      eyebrow="Menu"
      title="Opening menu"
    />
  );
}
