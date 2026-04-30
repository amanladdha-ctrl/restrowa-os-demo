"use server";

import { OrderStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const orderStatuses = [
  "pending",
  "accepted",
  "rejected",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled"
] as const;

function appendReturnParam(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

async function getActorAndRestaurant(restaurantIdFromForm?: string) {
  const user = await requireRole([
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.SUPER_ADMIN
  ]);

  if (user.restaurantId) {
    return { actorId: user.id, restaurantId: user.restaurantId };
  }

  if (user.role === UserRole.SUPER_ADMIN && restaurantIdFromForm) {
    return { actorId: user.id, restaurantId: restaurantIdFromForm };
  }

  const firstRestaurant = await prisma.restaurant.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" }
  });

  if (!firstRestaurant) redirect("/admin/restaurants");
  return { actorId: user.id, restaurantId: firstRestaurant.id };
}

export async function updateOrderStatusAction(formData: FormData) {
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const orderId = String(formData.get("orderId") || "");
  const status = z.enum(orderStatuses).parse(formData.get("status")) as OrderStatus;
  const returnTo = String(formData.get("returnTo") || "/owner/orders");
  const { actorId, restaurantId } = await getActorAndRestaurant(requestedRestaurantId);

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      restaurant: { select: { slug: true } }
    }
  });

  if (!order) redirect(appendReturnParam(returnTo, "error", "order_not_found"));

  const paymentStatus =
    status === "delivered" && order.paymentStatus === "cod"
      ? "paid"
      : order.paymentStatus;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status, paymentStatus }
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status,
        changedById: actorId,
        note: `Status changed from ${order.status} to ${status}.`
      }
    });

    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId,
        action: "order_status_changed",
        entityType: "order",
        entityId: orderId,
        metadata: { fromStatus: order.status, toStatus: status }
      }
    });
  });

  revalidatePath(returnTo);
  revalidatePath(`/menu/${order.restaurant.slug}/orders/${orderId}/track`);
  revalidatePath(`/menu/${order.restaurant.slug}/orders/${orderId}/confirmation`);
  redirect(appendReturnParam(returnTo, "status_updated", "1"));
}

export async function verifyPaymentAction(formData: FormData) {
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const orderId = String(formData.get("orderId") || "");
  const returnTo = String(formData.get("returnTo") || "/owner/orders");
  const { actorId, restaurantId } = await getActorAndRestaurant(requestedRestaurantId);

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      payments: true,
      restaurant: { select: { slug: true } }
    }
  });

  if (!order) redirect(appendReturnParam(returnTo, "error", "order_not_found"));

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "paid" }
    });

    await tx.payment.updateMany({
      where: { orderId },
      data: { status: "paid" }
    });

    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId,
        action: "order_payment_verified",
        entityType: "order",
        entityId: orderId,
        metadata: { previousPaymentStatus: order.paymentStatus }
      }
    });
  });

  revalidatePath(returnTo);
  revalidatePath(`/menu/${order.restaurant.slug}/orders/${orderId}/track`);
  revalidatePath(`/menu/${order.restaurant.slug}/orders/${orderId}/confirmation`);
  redirect(appendReturnParam(returnTo, "payment_verified", "1"));
}
