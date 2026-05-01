"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDefaultPath, setSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      id: true,
      name: true,
      passwordChangeRecommended: true,
      passwordHash: true,
      restaurantId: true,
      role: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          paymentDueAmount: true,
          slug: true,
          status: true,
          trialEndDate: true
        }
      }
    }
  });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    redirect("/login?error=invalid");
  }

  await setSession({
    email: user.email,
    id: user.id,
    name: user.name,
    passwordChangeRecommended: user.passwordChangeRecommended,
    restaurant: user.restaurant
      ? {
          id: user.restaurant.id,
          name: user.restaurant.name,
          paymentDueAmount: user.restaurant.paymentDueAmount.toString(),
          slug: user.restaurant.slug,
          status: user.restaurant.status,
          trialEndDate: user.restaurant.trialEndDate.toISOString()
        }
      : null,
    restaurantId: user.restaurantId,
    role: user.role
  });
  redirect(getDefaultPath(user.role));
}
