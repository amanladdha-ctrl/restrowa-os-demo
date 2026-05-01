"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export async function changePasswordAction(formData: FormData) {
  const user = await requireRole([
    UserRole.SUPER_ADMIN,
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF
  ]);

  const returnTo = String(formData.get("returnTo") || "/account/security");
  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirect(`${returnTo}?error=invalid_password`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true }
  });

  if (!dbUser) {
    redirect(`${returnTo}?error=user_missing`);
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);

  if (!valid) {
    redirect(`${returnTo}?error=wrong_current_password`);
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordChangeRecommended: false
    }
  });

  await setSession({
    ...user,
    passwordChangeRecommended: false,
    restaurant: user.restaurant
      ? {
          ...user.restaurant,
          paymentDueAmount: String(user.restaurant.paymentDueAmount),
          trialEndDate: String(user.restaurant.trialEndDate)
        }
      : null
  });

  redirect(`${returnTo}?password_changed=1`);
}
