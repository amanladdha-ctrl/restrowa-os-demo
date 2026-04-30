import {
  WhatsAppDirection,
  WhatsAppMessageStatus,
  type Restaurant
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateRestaurantSubscription } from "@/lib/subscription-enforcement";

function normalizeMessage(message: string) {
  return message.trim().toLowerCase();
}

async function getLatestSession(restaurantId: string, customerPhone: string) {
  return prisma.whatsAppSession.findFirst({
    where: { restaurantId, customerPhone },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getOrCreateWhatsAppSession(
  restaurantId: string,
  customerPhone: string
) {
  const existing = await getLatestSession(restaurantId, customerPhone);

  if (existing) {
    return prisma.whatsAppSession.update({
      where: { id: existing.id },
      data: { lastMessageAt: new Date() }
    });
  }

  return prisma.whatsAppSession.create({
    data: {
      restaurantId,
      customerPhone,
      state: "main_menu"
    }
  });
}

export async function logWhatsAppMessage(input: {
  restaurantId: string;
  customerPhone: string;
  direction: WhatsAppDirection;
  message: string;
  status?: WhatsAppMessageStatus;
  metadata?: object;
}) {
  return prisma.whatsAppMessage.create({
    data: {
      restaurantId: input.restaurantId,
      customerPhone: input.customerPhone,
      direction: input.direction,
      message: input.message,
      status:
        input.status ??
        (input.direction === "incoming"
          ? WhatsAppMessageStatus.received
          : WhatsAppMessageStatus.sent),
      metadata: input.metadata
    }
  });
}

async function getActiveOfferLine(restaurantId: string) {
  const now = new Date();
  const coupon = await prisma.coupon.findFirst({
    where: {
      restaurantId,
      active: true,
      startDate: { lte: now },
      endDate: { gte: now }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!coupon) {
    return "No live offers right now. Order directly from the menu for the latest pricing.";
  }

  return `Offer live: use ${coupon.code} on eligible orders from the menu checkout.`;
}

function getMenuLink(restaurant: Pick<Restaurant, "slug">) {
  return `/menu/${restaurant.slug}`;
}

function getTrackingLink(slug: string, orderId: string) {
  return `/menu/${slug}/orders/${orderId}/track`;
}

function getWelcomeMessage(restaurantName: string) {
  return `Hi, welcome to ${restaurantName}.
Please choose an option:
1. View Menu
2. Track Order
3. Call/Chat Restaurant
4. Offers`;
}

export async function processSimulatorMessage(input: {
  restaurant: Pick<
    Restaurant,
    | "id"
    | "name"
    | "slug"
    | "phone"
    | "whatsappNumber"
    | "status"
    | "trialEndDate"
    | "subscriptionEndDate"
    | "gracePeriodDays"
    | "paymentDueAmount"
  >;
  customerPhone: string;
  rawMessage: string;
}) {
  const session = await getOrCreateWhatsAppSession(
    input.restaurant.id,
    input.customerPhone
  );
  const message = normalizeMessage(input.rawMessage);

  await logWhatsAppMessage({
    restaurantId: input.restaurant.id,
    customerPhone: input.customerPhone,
    direction: WhatsAppDirection.incoming,
    message: input.rawMessage
  });

  const subscriptionState = evaluateRestaurantSubscription(input.restaurant);

  if (subscriptionState.orderingBlocked) {
    const unavailableMessage =
      subscriptionState.customerNotice?.body ??
      "Online ordering is temporarily unavailable. Please contact the restaurant directly.";

    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: {
        state: "blocked",
        lastMessageAt: new Date()
      }
    });

    await logWhatsAppMessage({
      restaurantId: input.restaurant.id,
      customerPhone: input.customerPhone,
      direction: WhatsAppDirection.outgoing,
      message: unavailableMessage
    });

    return [unavailableMessage];
  }

  const outgoingMessages: string[] = [];
  let nextState = session.state;

  if (["hi", "hello", "start", "menu"].includes(message)) {
    outgoingMessages.push(getWelcomeMessage(input.restaurant.name));
    nextState = "main_menu";
  } else if (
    message === "1" ||
    message.includes("view menu") ||
    message.includes("menu link")
  ) {
    outgoingMessages.push(
      `Open menu here: ${getMenuLink(input.restaurant)}`
    );
    nextState = "main_menu";
  } else if (
    message === "2" ||
    message.includes("track order") ||
    message.includes("track")
  ) {
    outgoingMessages.push(
      "Please send your order number, for example: 1002"
    );
    nextState = "awaiting_order_number";
  } else if (session.state === "awaiting_order_number") {
    const cleanLookup = input.rawMessage.trim().toUpperCase();
    const orderNumber = Number(message.replace(/\D/g, ""));
    const order = await prisma.order.findFirst({
      where: {
        restaurantId: input.restaurant.id,
        customerPhone: input.customerPhone,
        OR: [
          { orderCode: cleanLookup },
          ...(Number.isFinite(orderNumber) ? [{ orderNumber }] : [])
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    if (order) {
      outgoingMessages.push(
        `Order ${order.orderCode} is currently ${order.status.replaceAll("_", " ")}. Track here: ${getTrackingLink(
          input.restaurant.slug,
          order.id
        )}`
      );
      nextState = "main_menu";
    } else {
      outgoingMessages.push(
        "I could not find that order for this phone number. Please check the order ID and try again."
      );
      nextState = "awaiting_order_number";
    }
  } else if (
    message === "3" ||
    message.includes("call") ||
    message.includes("chat")
  ) {
    outgoingMessages.push(
      `Call the restaurant: ${input.restaurant.phone}
WhatsApp: ${input.restaurant.whatsappNumber}`
    );
    nextState = "main_menu";
  } else if (message === "4" || message.includes("offer")) {
    outgoingMessages.push(await getActiveOfferLine(input.restaurant.id));
    nextState = "main_menu";
  } else {
    outgoingMessages.push(
      "Please reply with 1 for menu, 2 for track order, 3 for call/chat, or 4 for offers."
    );
    nextState = "main_menu";
  }

  await prisma.whatsAppSession.update({
    where: { id: session.id },
    data: {
      state: nextState,
      lastMessageAt: new Date()
    }
  });

  for (const reply of outgoingMessages) {
    await logWhatsAppMessage({
      restaurantId: input.restaurant.id,
      customerPhone: input.customerPhone,
      direction: WhatsAppDirection.outgoing,
      message: reply
    });
  }

  return outgoingMessages;
}
