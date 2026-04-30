"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type LiveRefreshProps = {
  intervalMs?: number;
  latestValue?: string | null;
  storageKey?: string;
  notificationTitle?: string;
  notificationBody?: string;
  enableNotifications?: boolean;
  message?: string;
};

export function LiveRefresh({
  intervalMs = 10000,
  latestValue,
  storageKey,
  notificationTitle,
  notificationBody,
  enableNotifications = false,
  message
}: LiveRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, router]);

  useEffect(() => {
    if (!enableNotifications || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, [enableNotifications]);

  useEffect(() => {
    if (!storageKey || !latestValue) {
      return;
    }

    const key = `restrowa-live:${storageKey}`;
    const previousValue = window.localStorage.getItem(key);

    if (!previousValue) {
      window.localStorage.setItem(key, latestValue);
      return;
    }

    if (previousValue === latestValue) {
      return;
    }

    window.localStorage.setItem(key, latestValue);

    if (
      enableNotifications &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(notificationTitle ?? "New order received", {
        body: notificationBody ?? "A new order has arrived in your dashboard."
      });
    }
  }, [
    enableNotifications,
    latestValue,
    notificationBody,
    notificationTitle,
    storageKey
  ]);

  if (!message) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
      {message}
    </div>
  );
}
