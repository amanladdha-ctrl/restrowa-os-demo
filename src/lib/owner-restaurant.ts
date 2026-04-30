import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireOwnerRestaurantId() {
  const user = await requireRole([UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN]);

  if (user.restaurantId) {
    return user.restaurantId;
  }

  const firstRestaurant = await prisma.restaurant.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" }
  });

  if (!firstRestaurant) {
    throw new Error("No restaurant found for this user.");
  }

  return firstRestaurant.id;
}

export async function requireOwnerRestaurantIdFromSearch(
  requestedRestaurantId?: string
) {
  const user = await requireRole([UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN]);

  if (user.restaurantId) {
    return user.restaurantId;
  }

  if (requestedRestaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: requestedRestaurantId },
      select: { id: true }
    });

    if (restaurant) {
      return restaurant.id;
    }
  }

  return requireOwnerRestaurantId();
}
