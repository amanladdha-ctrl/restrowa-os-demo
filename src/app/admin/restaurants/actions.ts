"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { normalizeCustomDomain } from "@/lib/domain-routing";
import {
  importMenuRowsForRestaurant,
  parseMenuSpreadsheet
} from "@/lib/menu-spreadsheet-import";
import { prisma } from "@/lib/prisma";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

const restaurantStatuses = [
  "trial",
  "active",
  "past_due",
  "suspended",
  "inactive"
] as const;

const restaurantFormSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  customDomain: z.string().optional(),
  customDomainVerified: z.boolean(),
  address: z.string().min(5),
  phone: z.string().min(8),
  whatsappNumber: z.string().min(8),
  logoUrl: z.string().url().optional().or(z.literal("")),
  themePrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  themeAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  themeBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  openingTime: z.string().min(4),
  closingTime: z.string().min(4),
  status: z.enum(restaurantStatuses),
  trialStartDate: z.coerce.date(),
  trialEndDate: z.coerce.date(),
  gracePeriodDays: z.coerce.number().int().min(0).max(30),
  planType: z.string().min(2),
  subscriptionAmount: z.coerce.number().min(0),
  paymentDueAmount: z.coerce.number().min(0),
  perOrderFeeEnabled: z.boolean(),
  perOrderFeeAmount: z.coerce.number().min(0),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  dineInEnabled: z.boolean(),
  deliveryCharge: z.coerce.number().min(0),
  freeDeliveryAbove: z.coerce.number().min(0).optional(),
  minimumOrderAmount: z.coerce.number().min(0),
  codEnabled: z.boolean(),
  upiQrEnabled: z.boolean(),
  upiId: z.string().optional(),
  paymentInstructions: z.string().optional()
});

const ownerSchema = z.object({
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8)
});

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function optionalNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value ? Number(value) : undefined;
}

function parseRestaurantForm(formData: FormData) {
  const parsed = restaurantFormSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    customDomain: normalizeCustomDomain(String(formData.get("customDomain") || "")),
    customDomainVerified: checkbox(formData, "customDomainVerified"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    whatsappNumber: formData.get("whatsappNumber"),
    logoUrl: String(formData.get("logoUrl") || "").trim(),
    themePrimary: formData.get("themePrimary"),
    themeAccent: formData.get("themeAccent"),
    themeBackground: formData.get("themeBackground"),
    openingTime: formData.get("openingTime"),
    closingTime: formData.get("closingTime"),
    status: formData.get("status"),
    trialStartDate: formData.get("trialStartDate"),
    trialEndDate: formData.get("trialEndDate"),
    gracePeriodDays: formData.get("gracePeriodDays"),
    planType: formData.get("planType"),
    subscriptionAmount: formData.get("subscriptionAmount"),
    paymentDueAmount: formData.get("paymentDueAmount"),
    perOrderFeeEnabled: checkbox(formData, "perOrderFeeEnabled"),
    perOrderFeeAmount: formData.get("perOrderFeeAmount"),
    deliveryEnabled: checkbox(formData, "deliveryEnabled"),
    pickupEnabled: checkbox(formData, "pickupEnabled"),
    dineInEnabled: checkbox(formData, "dineInEnabled"),
    deliveryCharge: formData.get("deliveryCharge"),
    freeDeliveryAbove: optionalNumber(formData, "freeDeliveryAbove"),
    minimumOrderAmount: formData.get("minimumOrderAmount"),
    codEnabled: checkbox(formData, "codEnabled"),
    upiQrEnabled: checkbox(formData, "upiQrEnabled"),
    upiId: String(formData.get("upiId") || "").trim() || undefined,
    paymentInstructions:
      String(formData.get("paymentInstructions") || "").trim() || undefined
  });

  return {
    ...parsed,
    customDomainVerified: parsed.customDomain ? parsed.customDomainVerified : false,
    logoUrl: parsed.logoUrl || undefined
  };
}

async function getStarterPlan(planType: string, subscriptionAmount: number) {
  return prisma.subscriptionPlan.upsert({
    where: { name: planType },
    update: { monthlyPrice: subscriptionAmount },
    create: {
      name: planType,
      monthlyPrice: subscriptionAmount,
      setupFee: planType.toLowerCase() === "starter" ? 4999 : 0,
      features: ["Restaurant ordering SaaS plan"]
    }
  });
}

async function syncRestaurantSubscriptionStatus(
  restaurantId: string,
  actorId: string,
  source: "single_refresh" | "bulk_refresh"
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { subscription: true }
  });

  if (!restaurant) {
    return false;
  }

  const evaluation = evaluateRestaurantSubscription(restaurant);
  const currentSubscriptionStatus = restaurant.subscription?.status ?? restaurant.status;
  const shouldSync =
    evaluation.shouldSyncStatus ||
    restaurant.status !== evaluation.effectiveStatus ||
    currentSubscriptionStatus !== evaluation.effectiveStatus;

  if (!shouldSync) {
    return false;
  }

  await prisma.$transaction(async (tx) => {
    await tx.restaurant.update({
      where: { id: restaurantId },
      data: { status: evaluation.effectiveStatus }
    });

    await tx.restaurantSubscription.updateMany({
      where: { restaurantId },
      data: { status: evaluation.effectiveStatus }
    });

    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId,
        action: "subscription_status_refreshed",
        entityType: "restaurant",
        entityId: restaurantId,
        metadata: {
          fromStatus: restaurant.status,
          toStatus: evaluation.effectiveStatus,
          source,
          reason: evaluation.statusReason
        }
      }
    });
  });

  return true;
}

export async function createRestaurantAction(formData: FormData) {
  const actor = await requireRole([UserRole.SUPER_ADMIN]);
  const restaurantData = parseRestaurantForm(formData);
  const ownerData = ownerSchema.parse({
    ownerName: formData.get("ownerName"),
    ownerEmail: String(formData.get("ownerEmail") || "").trim().toLowerCase(),
    ownerPassword: formData.get("ownerPassword")
  });

  const existingSlug = await prisma.restaurant.findUnique({
    where: { slug: restaurantData.slug },
    select: { id: true }
  });

  if (existingSlug) {
    redirect("/admin/restaurants?error=slug_exists");
  }

  if (restaurantData.customDomain) {
    const existingCustomDomain = await prisma.restaurant.findUnique({
      where: { customDomain: restaurantData.customDomain },
      select: { id: true }
    });

    if (existingCustomDomain) {
      redirect("/admin/restaurants?error=custom_domain_exists");
    }
  }

  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerData.ownerEmail },
    select: { id: true }
  });

  if (existingOwner) {
    redirect("/admin/restaurants?error=owner_exists");
  }

  const plan = await getStarterPlan(
    restaurantData.planType,
    restaurantData.subscriptionAmount
  );
  const ownerHash = await bcrypt.hash(ownerData.ownerPassword, 12);

  const restaurant = await prisma.$transaction(async (tx) => {
    const createdRestaurant = await tx.restaurant.create({
      data: restaurantData
    });

    await tx.user.create({
      data: {
        email: ownerData.ownerEmail,
        name: ownerData.ownerName,
        passwordHash: ownerHash,
        role: UserRole.RESTAURANT_OWNER,
        passwordChangeRecommended: true,
        restaurantId: createdRestaurant.id
      }
    });

    await tx.restaurantSubscription.create({
      data: {
        restaurantId: createdRestaurant.id,
        planId: plan.id,
        status: restaurantData.status,
        startDate: restaurantData.trialStartDate,
        endDate: restaurantData.trialEndDate,
        amountDue: restaurantData.paymentDueAmount
      }
    });

    await tx.auditLog.create({
      data: {
        restaurantId: createdRestaurant.id,
        actorId: actor.id,
        action: "restaurant_created",
        entityType: "restaurant",
        entityId: createdRestaurant.id,
        metadata: {
          status: restaurantData.status,
          planType: restaurantData.planType,
          ownerEmail: ownerData.ownerEmail
        }
      }
    });

    return createdRestaurant;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  redirect(`/admin/restaurants/${restaurant.id}?created=1`);
}

export async function updateRestaurantAction(formData: FormData) {
  const actor = await requireRole([UserRole.SUPER_ADMIN]);
  const restaurantId = String(formData.get("restaurantId") || "");
  const restaurantData = parseRestaurantForm(formData);

  const existing = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { subscription: true }
  });

  if (!existing) {
    redirect("/admin/restaurants?error=not_found");
  }

  const slugOwner = await prisma.restaurant.findUnique({
    where: { slug: restaurantData.slug },
    select: { id: true }
  });

  if (slugOwner && slugOwner.id !== restaurantId) {
    redirect(`/admin/restaurants/${restaurantId}?error=slug_exists`);
  }

  if (restaurantData.customDomain) {
    const customDomainOwner = await prisma.restaurant.findUnique({
      where: { customDomain: restaurantData.customDomain },
      select: { id: true }
    });

    if (customDomainOwner && customDomainOwner.id !== restaurantId) {
      redirect(`/admin/restaurants/${restaurantId}?error=custom_domain_exists`);
    }
  }

  const plan = await getStarterPlan(
    restaurantData.planType,
    restaurantData.subscriptionAmount
  );

  await prisma.$transaction(async (tx) => {
    await tx.restaurant.update({
      where: { id: restaurantId },
      data: restaurantData
    });

    await tx.restaurantSubscription.upsert({
      where: { restaurantId },
      update: {
        planId: plan.id,
        status: restaurantData.status,
        startDate: restaurantData.trialStartDate,
        endDate: restaurantData.trialEndDate,
        amountDue: restaurantData.paymentDueAmount
      },
      create: {
        restaurantId,
        planId: plan.id,
        status: restaurantData.status,
        startDate: restaurantData.trialStartDate,
        endDate: restaurantData.trialEndDate,
        amountDue: restaurantData.paymentDueAmount
      }
    });

    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId: actor.id,
        action:
          existing.status === restaurantData.status
            ? "restaurant_updated"
            : "restaurant_status_changed",
        entityType: "restaurant",
        entityId: restaurantId,
        metadata: {
          fromStatus: existing.status,
          toStatus: restaurantData.status,
          planType: restaurantData.planType
        }
      }
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
  redirect(`/admin/restaurants/${restaurantId}?saved=1`);
}

export async function changeRestaurantStatusAction(formData: FormData) {
  const actor = await requireRole([UserRole.SUPER_ADMIN]);
  const restaurantId = String(formData.get("restaurantId") || "");
  const status = z.enum(restaurantStatuses).parse(formData.get("status"));

  const existing = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, status: true }
  });

  if (!existing) {
    redirect("/admin/restaurants?error=not_found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.restaurant.update({
      where: { id: restaurantId },
      data: { status }
    });

    await tx.restaurantSubscription.updateMany({
      where: { restaurantId },
      data: { status }
    });

    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId: actor.id,
        action: "restaurant_status_changed",
        entityType: "restaurant",
        entityId: restaurantId,
        metadata: { fromStatus: existing.status, toStatus: status }
      }
    });
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
  redirect(`/admin/restaurants/${restaurantId}?status=${status}`);
}

export async function extendTrialAction(formData: FormData) {
  const actor = await requireRole([UserRole.SUPER_ADMIN]);
  const restaurantId = String(formData.get("restaurantId") || "");
  const days = z.coerce.number().int().min(1).max(90).parse(formData.get("days"));

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { trialEndDate: true }
  });

  if (!restaurant) {
    redirect("/admin/restaurants?error=not_found");
  }

  const newTrialEndDate = new Date(restaurant.trialEndDate);
  newTrialEndDate.setDate(newTrialEndDate.getDate() + days);

  await prisma.$transaction(async (tx) => {
    await tx.restaurant.update({
      where: { id: restaurantId },
      data: { status: "trial", trialEndDate: newTrialEndDate }
    });

    await tx.restaurantSubscription.updateMany({
      where: { restaurantId },
      data: { status: "trial", endDate: newTrialEndDate }
    });

    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId: actor.id,
        action: "trial_extended",
        entityType: "restaurant",
        entityId: restaurantId,
        metadata: { days, newTrialEndDate }
      }
    });
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
  redirect(`/admin/restaurants/${restaurantId}?trial_extended=${days}`);
}

export async function markPaidAction(formData: FormData) {
  const actor = await requireRole([UserRole.SUPER_ADMIN]);
  const restaurantId = String(formData.get("restaurantId") || "");
  const amount = z.coerce.number().min(0).parse(formData.get("amount"));
  const reference = String(formData.get("reference") || "").trim() || undefined;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true }
  });

  if (!restaurant) {
    redirect("/admin/restaurants?error=not_found");
  }

  const now = new Date();
  const subscriptionEndDate = new Date(now);
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

  await prisma.$transaction(async (tx) => {
    await tx.restaurant.update({
      where: { id: restaurantId },
      data: {
        status: "active",
        paymentDueAmount: 0,
        subscriptionStartDate: now,
        subscriptionEndDate
      }
    });

    await tx.restaurantSubscription.updateMany({
      where: { restaurantId },
      data: {
        status: "active",
        amountDue: 0,
        startDate: now,
        endDate: subscriptionEndDate,
        lastPaymentDate: now
      }
    });

    if (amount > 0) {
      await tx.subscriptionPayment.create({
        data: {
          restaurantId,
          amount,
          paidAt: now,
          reference,
          notes: "Marked paid from Super Admin Phase 2 panel."
        }
      });
    }

    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId: actor.id,
        action: "payment_marked_paid",
        entityType: "restaurant",
        entityId: restaurantId,
        metadata: { amount, reference }
      }
    });
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
  redirect(`/admin/restaurants/${restaurantId}?paid=1`);
}

export async function refreshRestaurantSubscriptionStatusAction(formData: FormData) {
  const actor = await requireRole([UserRole.SUPER_ADMIN]);
  const restaurantId = String(formData.get("restaurantId") || "");

  const refreshed = await syncRestaurantSubscriptionStatus(
    restaurantId,
    actor.id,
    "single_refresh"
  );

  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
  redirect(`/admin/restaurants/${restaurantId}?refreshed=${refreshed ? "1" : "0"}`);
}

export async function refreshAllSubscriptionStatusesAction() {
  const actor = await requireRole([UserRole.SUPER_ADMIN]);
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true }
  });

  let refreshedCount = 0;

  for (const restaurant of restaurants) {
    const refreshed = await syncRestaurantSubscriptionStatus(
      restaurant.id,
      actor.id,
      "bulk_refresh"
    );

    if (refreshed) {
      refreshedCount += 1;
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  redirect(`/admin?subscription_refreshed=${refreshedCount}`);
}

export async function importRestaurantMenuSpreadsheetAction(formData: FormData) {
  const actor = await requireRole([UserRole.SUPER_ADMIN]);
  const restaurantId = String(formData.get("restaurantId") || "");
  const file = formData.get("menuFile");

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/restaurants/${restaurantId}?error=missing_menu_file`);
  }

  try {
    const rows = await parseMenuSpreadsheet(file);
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true }
    });

    await importMenuRowsForRestaurant({
      restaurantId,
      actorId: actor.id,
      rows,
      sourceLabel: file.name
    });

    if (restaurant) {
      revalidatePath(`/menu/${restaurant.slug}`);
    }
  } catch (error) {
    const details = encodeURIComponent(
      error instanceof Error ? error.message : "import_failed"
    );
    redirect(
      `/admin/restaurants/${restaurantId}?error=import_failed&details=${details}`
    );
  }

  revalidatePath(`/admin/restaurants/${restaurantId}`);
  revalidatePath("/owner/menu");
  redirect(`/admin/restaurants/${restaurantId}?menu_imported=1`);
}
