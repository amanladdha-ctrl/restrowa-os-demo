import type { RestaurantStatus } from "@prisma/client";

type MoneyValue = number | string | { toString(): string } | null | undefined;

export type SubscriptionSnapshot = {
  status: RestaurantStatus;
  trialEndDate: Date;
  subscriptionEndDate?: Date | null;
  gracePeriodDays: number;
  paymentDueAmount: MoneyValue;
};

type NoticeTone = "info" | "warning" | "danger";

export type SubscriptionNotice = {
  tone: NoticeTone;
  title: string;
  body: string;
};

export type SubscriptionEvaluation = {
  effectiveStatus: RestaurantStatus;
  orderingBlocked: boolean;
  paymentDue: boolean;
  trialDaysLeft: number;
  graceDaysLeft: number | null;
  shouldSyncStatus: boolean;
  statusReason: string;
  ownerNotice: SubscriptionNotice | null;
  customerNotice: SubscriptionNotice | null;
};

function toAmount(value: MoneyValue) {
  return Number(value?.toString?.() ?? value ?? 0);
}

function startOfDay(date: Date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function diffInDays(target: Date, now: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil(
    (startOfDay(target).getTime() - startOfDay(now).getTime()) / millisecondsPerDay
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function evaluateRestaurantSubscription(
  snapshot: SubscriptionSnapshot,
  now = new Date()
): SubscriptionEvaluation {
  const paymentDue = toAmount(snapshot.paymentDueAmount) > 0;
  const trialDaysLeft = diffInDays(snapshot.trialEndDate, now);

  if (snapshot.status === "inactive") {
    return {
      effectiveStatus: "inactive",
      orderingBlocked: true,
      paymentDue,
      trialDaysLeft,
      graceDaysLeft: null,
      shouldSyncStatus: false,
      statusReason: "restaurant_inactive",
      ownerNotice: {
        tone: "danger",
        title: "Restaurant is inactive",
        body: "Public ordering is off until Super Admin reactivates this restaurant."
      },
      customerNotice: {
        tone: "danger",
        title: "Online ordering temporarily unavailable",
        body: "Please contact the restaurant directly for help with your order."
      }
    };
  }

  if (snapshot.status === "suspended") {
    return {
      effectiveStatus: "suspended",
      orderingBlocked: true,
      paymentDue,
      trialDaysLeft,
      graceDaysLeft: null,
      shouldSyncStatus: false,
      statusReason: "restaurant_suspended",
      ownerNotice: {
        tone: "danger",
        title: "Ordering is suspended",
        body: "Checkout, public menu ordering, and WhatsApp ordering stay blocked until payment is marked paid or trial is extended."
      },
      customerNotice: {
        tone: "danger",
        title: "Online ordering temporarily unavailable",
        body: "Please contact the restaurant directly. New online orders are paused right now."
      }
    };
  }

  if (snapshot.status === "trial") {
    if (trialDaysLeft >= 0) {
      return {
        effectiveStatus: "trial",
        orderingBlocked: false,
        paymentDue,
        trialDaysLeft,
        graceDaysLeft: null,
        shouldSyncStatus: false,
        statusReason: "trial_active",
        ownerNotice:
          trialDaysLeft <= 7
            ? {
                tone: "warning",
                title: `Trial ends in ${trialDaysLeft} day(s)`,
                body: "Ask the restaurant to confirm payment before the trial ends so ordering never gets interrupted."
              }
            : null,
        customerNotice: null
      };
    }

    if (paymentDue) {
      const graceEnds = addDays(snapshot.trialEndDate, snapshot.gracePeriodDays);
      const graceDaysLeft = diffInDays(graceEnds, now);

      if (graceDaysLeft >= 0) {
        return {
          effectiveStatus: "past_due",
          orderingBlocked: false,
          paymentDue: true,
          trialDaysLeft,
          graceDaysLeft,
          shouldSyncStatus: true,
          statusReason: "trial_expired_grace_period",
          ownerNotice: {
            tone: "danger",
            title: "Trial ended, payment due",
            body: `Grace period is running. ${graceDaysLeft} day(s) left before automatic suspension.`
          },
          customerNotice: null
        };
      }

      return {
        effectiveStatus: "suspended",
        orderingBlocked: true,
        paymentDue: true,
        trialDaysLeft,
        graceDaysLeft,
        shouldSyncStatus: true,
        statusReason: "trial_expired_grace_over",
        ownerNotice: {
          tone: "danger",
          title: "Trial expired and restaurant is suspended",
          body: "Super Admin must extend the trial or mark payment received to restore ordering."
        },
        customerNotice: {
          tone: "danger",
          title: "Online ordering temporarily unavailable",
          body: "Please contact the restaurant directly. New online orders are paused right now."
        }
      };
    }

    return {
      effectiveStatus: "active",
      orderingBlocked: false,
      paymentDue: false,
      trialDaysLeft,
      graceDaysLeft: null,
      shouldSyncStatus: true,
      statusReason: "trial_completed_no_due",
      ownerNotice: null,
      customerNotice: null
    };
  }

  const referenceEndDate = snapshot.subscriptionEndDate ?? snapshot.trialEndDate;

  if (
    snapshot.status === "past_due" ||
    (snapshot.status === "active" && paymentDue && now > referenceEndDate)
  ) {
    const graceEnds = addDays(referenceEndDate, snapshot.gracePeriodDays);
    const graceDaysLeft = diffInDays(graceEnds, now);

    if (graceDaysLeft >= 0) {
      return {
        effectiveStatus: paymentDue ? "past_due" : "active",
        orderingBlocked: false,
        paymentDue,
        trialDaysLeft,
        graceDaysLeft,
        shouldSyncStatus: snapshot.status !== (paymentDue ? "past_due" : "active"),
        statusReason: paymentDue ? "subscription_past_due" : "subscription_active",
        ownerNotice: paymentDue
          ? {
              tone: "danger",
              title: "Subscription payment is due",
              body: `${graceDaysLeft} day(s) left before ordering is suspended.`
            }
          : null,
        customerNotice: null
      };
    }

    if (paymentDue) {
      return {
        effectiveStatus: "suspended",
        orderingBlocked: true,
        paymentDue,
        trialDaysLeft,
        graceDaysLeft,
        shouldSyncStatus: true,
        statusReason: "subscription_grace_over",
        ownerNotice: {
          tone: "danger",
          title: "Subscription overdue and restaurant is suspended",
          body: "Public ordering stays blocked until payment is marked paid."
        },
        customerNotice: {
          tone: "danger",
          title: "Online ordering temporarily unavailable",
          body: "Please contact the restaurant directly. New online orders are paused right now."
        }
      };
    }
  }

  return {
    effectiveStatus: "active",
    orderingBlocked: false,
    paymentDue,
    trialDaysLeft,
    graceDaysLeft: null,
    shouldSyncStatus: snapshot.status !== "active",
    statusReason: "subscription_active",
    ownerNotice: null,
    customerNotice: null
  };
}
