import { PageLoadingCard } from "@/components/page-loading-card";

export default function Loading() {
  return (
    <PageLoadingCard
      body="Preparing checkout and payment options."
      eyebrow="Checkout"
      title="Almost ready"
    />
  );
}
