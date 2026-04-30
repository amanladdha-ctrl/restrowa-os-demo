"use server";

import { SupportRequestStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  restaurantId: z.string().min(1),
  title: z.string().min(3),
  message: z.string().min(10)
});

const resolveSchema = z.object({
  supportRequestId: z.string().min(1),
  returnTo: z.string().min(1),
  adminReply: z.string().min(3)
});

export async function createSupportRequestAction(formData: FormData) {
  const user = await requireRole([
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF
  ]);

  const returnTo = String(formData.get("returnTo") || "/owner");
  const parsed = createSchema.safeParse({
    restaurantId: formData.get("restaurantId"),
    title: formData.get("title"),
    message: formData.get("message")
  });

  if (!parsed.success) {
    redirect(`${returnTo}?support_error=invalid`);
  }

  const restaurantId = user.restaurantId ?? parsed.data.restaurantId;

  await prisma.supportRequest.create({
    data: {
      restaurantId,
      userId: user.id,
      title: parsed.data.title,
      message: parsed.data.message
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/support");
  revalidatePath(returnTo);
  redirect(`${returnTo}?support_sent=1`);
}

export async function resolveSupportRequestAction(formData: FormData) {
  await requireRole([UserRole.SUPER_ADMIN]);
  const parsed = resolveSchema.safeParse({
    supportRequestId: formData.get("supportRequestId"),
    returnTo: String(formData.get("returnTo") || "/admin/support"),
    adminReply: formData.get("adminReply")
  });

  if (!parsed.success) {
    redirect("/admin/support?error=reply_required");
  }

  await prisma.supportRequest.update({
    where: { id: parsed.data.supportRequestId },
    data: {
      status: SupportRequestStatus.resolved,
      adminReply: parsed.data.adminReply,
      resolvedAt: new Date()
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/support");
  redirect(`${parsed.data.returnTo}?resolved=1`);
}
