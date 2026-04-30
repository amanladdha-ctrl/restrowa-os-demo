import { cookies } from "next/headers";

const RECENT_ORDERS_COOKIE = "restrowa_recent_orders";
const MAX_RECENT_ORDERS = 8;

type RecentOrder = {
  restaurantId: string;
  orderId: string;
  createdAt: string;
};

export async function getRecentOrdersForRestaurant(restaurantId: string) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(RECENT_ORDERS_COOKIE)?.value;

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as RecentOrder[];
    return parsed.filter((order) => order.restaurantId === restaurantId);
  } catch {
    return [];
  }
}

export async function addRecentOrder(restaurantId: string, orderId: string) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(RECENT_ORDERS_COOKIE)?.value;
  let recentOrders: RecentOrder[] = [];

  if (raw) {
    try {
      recentOrders = JSON.parse(raw) as RecentOrder[];
    } catch {
      recentOrders = [];
    }
  }

  const nextOrders = [
    { restaurantId, orderId, createdAt: new Date().toISOString() },
    ...recentOrders.filter((order) => order.orderId !== orderId)
  ].slice(0, MAX_RECENT_ORDERS);

  cookieStore.set(RECENT_ORDERS_COOKIE, JSON.stringify(nextOrders), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 90 * 24 * 60 * 60,
    path: "/"
  });
}
