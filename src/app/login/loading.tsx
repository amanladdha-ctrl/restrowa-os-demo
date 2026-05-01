import { PageLoadingCard } from "@/components/page-loading-card";

export default function Loading() {
  return (
    <PageLoadingCard
      body="Checking your login and opening the right dashboard."
      eyebrow="Signing in"
      title="Please wait a moment"
    />
  );
}
