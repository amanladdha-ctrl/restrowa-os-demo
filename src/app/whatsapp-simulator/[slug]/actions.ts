"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { processSimulatorMessage } from "@/lib/whatsapp-simulator";

function cleanPhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export async function sendSimulatorMessageAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const rawPhone = String(formData.get("customerPhone") || "");
  const message = String(formData.get("message") || "").trim();

  const customerPhone = cleanPhone(rawPhone);

  if (!slug || !customerPhone || !message) {
    redirect(`/whatsapp-simulator/${slug}?error=missing_fields`);
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      whatsappNumber: true,
      status: true,
      trialEndDate: true,
      subscriptionEndDate: true,
      gracePeriodDays: true,
      paymentDueAmount: true
    }
  });

  if (!restaurant) {
    redirect("/");
  }

  await processSimulatorMessage({
    restaurant,
    customerPhone,
    rawMessage: message
  });

  redirect(`/whatsapp-simulator/${slug}?phone=${encodeURIComponent(customerPhone)}`);
}
