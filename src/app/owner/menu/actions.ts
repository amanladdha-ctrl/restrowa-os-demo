"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import {
  importMenuRowsForRestaurant,
  parseMenuSpreadsheet
} from "@/lib/menu-spreadsheet-import";
import { prisma } from "@/lib/prisma";
import { requireOwnerRestaurantId } from "@/lib/owner-restaurant";

const vegTypes = ["veg", "non_veg", "egg"] as const;

async function getScopedRestaurantId(requestedRestaurantId?: string) {
  const user = await requireRole([UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN]);

  if (user.restaurantId) {
    return { restaurantId: user.restaurantId, actorId: user.id };
  }

  const restaurantId = requestedRestaurantId || (await requireOwnerRestaurantId());
  return { restaurantId, actorId: user.id };
}

function menuRedirectBase(restaurantId?: string) {
  return restaurantId ? `/owner/menu?restaurantId=${restaurantId}` : "/owner/menu";
}

function withMenuRedirectParam(base: string, key: string, value: string) {
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${key}=${value}`;
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function nullableText(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

const categorySchema = z.object({
  name: z.string().min(2),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean()
});

export async function createCategoryAction(formData: FormData) {
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const { restaurantId, actorId } = await getScopedRestaurantId(
    requestedRestaurantId
  );
  const redirectBase = menuRedirectBase(requestedRestaurantId || undefined);
  const data = categorySchema.parse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    active: checkbox(formData, "active")
  });

  try {
    await prisma.$transaction(async (tx) => {
      const category = await tx.menuCategory.create({
        data: { restaurantId, ...data }
      });

      await tx.auditLog.create({
        data: {
          restaurantId,
          actorId,
          action: "menu_category_created",
          entityType: "menu_category",
          entityId: category.id,
          metadata: { name: data.name }
        }
      });
    });
  } catch {
    redirect(withMenuRedirectParam(redirectBase, "error", "category_exists"));
  }

  revalidatePath("/owner/menu");
  redirect(withMenuRedirectParam(redirectBase, "created", "category"));
}

export async function updateCategoryAction(formData: FormData) {
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const { restaurantId, actorId } = await getScopedRestaurantId(
    requestedRestaurantId
  );
  const categoryId = String(formData.get("categoryId") || "");
  const redirectBase = menuRedirectBase(requestedRestaurantId || undefined);
  const data = categorySchema.parse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    active: checkbox(formData, "active")
  });

  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
    select: { id: true }
  });

  if (!category) redirect(withMenuRedirectParam(redirectBase, "error", "not_found"));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.menuCategory.update({
        where: { id: categoryId },
        data
      });

      await tx.auditLog.create({
        data: {
          restaurantId,
          actorId,
          action: "menu_category_updated",
          entityType: "menu_category",
          entityId: categoryId,
          metadata: { name: data.name }
        }
      });
    });
  } catch {
    redirect(withMenuRedirectParam(redirectBase, "error", "category_exists"));
  }

  revalidatePath("/owner/menu");
  redirect(withMenuRedirectParam(redirectBase, "saved", "category"));
}

export async function deleteCategoryAction(formData: FormData) {
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const { restaurantId, actorId } = await getScopedRestaurantId(
    requestedRestaurantId
  );
  const categoryId = String(formData.get("categoryId") || "");
  const redirectBase = menuRedirectBase(requestedRestaurantId || undefined);

  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
    include: { _count: { select: { items: true } } }
  });

  if (!category) redirect(withMenuRedirectParam(redirectBase, "error", "not_found"));
  if (category._count.items > 0) {
    redirect(withMenuRedirectParam(redirectBase, "error", "category_has_items"));
  }

  await prisma.$transaction(async (tx) => {
    await tx.menuCategory.delete({ where: { id: categoryId } });
    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId,
        action: "menu_category_deleted",
        entityType: "menu_category",
        entityId: categoryId,
        metadata: { name: category.name }
      }
    });
  });

  revalidatePath("/owner/menu");
  redirect(withMenuRedirectParam(redirectBase, "deleted", "category"));
}

const itemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2),
  price: z.coerce.number().min(0),
  imageUrl: z
    .string()
    .trim()
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: "Image URL must start with http:// or https://"
    })
    .nullable()
    .or(z.literal(null)),
  description: z.string().nullable(),
  vegType: z.enum(vegTypes),
  available: z.boolean(),
  recommended: z.boolean(),
  popular: z.boolean(),
  sortOrder: z.coerce.number().int().min(0)
});

function parseItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    price: formData.get("price"),
    imageUrl: nullableText(formData, "imageUrl"),
    description: nullableText(formData, "description"),
    vegType: formData.get("vegType"),
    available: checkbox(formData, "available"),
    recommended: checkbox(formData, "recommended"),
    popular: checkbox(formData, "popular"),
    sortOrder: formData.get("sortOrder")
  });

  if (!parsed.success) {
    redirect("/owner/menu?error=invalid_item");
  }

  return {
    ...parsed.data,
    imageUrl: parsed.data.imageUrl || null
  };
}

async function ensureCategoryInRestaurant(categoryId: string, restaurantId: string) {
  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
    select: { id: true }
  });

  if (!category) redirect("/owner/menu?error=category_not_found");
}

export async function createItemAction(formData: FormData) {
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const { restaurantId, actorId } = await getScopedRestaurantId(
    requestedRestaurantId
  );
  const data = parseItem(formData);
  const redirectBase = menuRedirectBase(requestedRestaurantId || undefined);
  await ensureCategoryInRestaurant(data.categoryId, restaurantId);

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.menuItem.create({
        data: { restaurantId, ...data }
      });

      await tx.auditLog.create({
        data: {
          restaurantId,
          actorId,
          action: "menu_item_created",
          entityType: "menu_item",
          entityId: item.id,
          metadata: { name: data.name, price: data.price }
        }
      });
    });
  } catch {
    redirect(withMenuRedirectParam(redirectBase, "error", "item_exists"));
  }

  revalidatePath("/owner/menu");
  redirect(withMenuRedirectParam(redirectBase, "created", "item"));
}

export async function updateItemAction(formData: FormData) {
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const { restaurantId, actorId } = await getScopedRestaurantId(
    requestedRestaurantId
  );
  const itemId = String(formData.get("itemId") || "");
  const data = parseItem(formData);
  const redirectBase = menuRedirectBase(requestedRestaurantId || undefined);
  await ensureCategoryInRestaurant(data.categoryId, restaurantId);

  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId },
    select: { id: true }
  });

  if (!item) redirect(withMenuRedirectParam(redirectBase, "error", "not_found"));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.menuItem.update({
        where: { id: itemId },
        data
      });

      await tx.auditLog.create({
        data: {
          restaurantId,
          actorId,
          action: "menu_item_updated",
          entityType: "menu_item",
          entityId: itemId,
          metadata: { name: data.name, price: data.price }
        }
      });
    });
  } catch {
    redirect(withMenuRedirectParam(redirectBase, "error", "item_exists"));
  }

  revalidatePath("/owner/menu");
  redirect(withMenuRedirectParam(redirectBase, "saved", "item"));
}

export async function deleteItemAction(formData: FormData) {
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const { restaurantId, actorId } = await getScopedRestaurantId(
    requestedRestaurantId
  );
  const itemId = String(formData.get("itemId") || "");
  const redirectBase = menuRedirectBase(requestedRestaurantId || undefined);

  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId },
    select: { id: true, name: true }
  });

  if (!item) redirect(withMenuRedirectParam(redirectBase, "error", "not_found"));

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.delete({ where: { id: itemId } });
    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId,
        action: "menu_item_deleted",
        entityType: "menu_item",
        entityId: itemId,
        metadata: { name: item.name }
      }
    });
  });

  revalidatePath("/owner/menu");
  redirect(withMenuRedirectParam(redirectBase, "deleted", "item"));
}

export async function toggleItemAvailabilityAction(formData: FormData) {
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const { restaurantId, actorId } = await getScopedRestaurantId(
    requestedRestaurantId
  );
  const itemId = String(formData.get("itemId") || "");
  const redirectBase = menuRedirectBase(requestedRestaurantId || undefined);

  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurantId },
    select: { id: true, name: true, available: true }
  });

  if (!item) redirect(withMenuRedirectParam(redirectBase, "error", "not_found"));

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.update({
      where: { id: itemId },
      data: { available: !item.available }
    });
    await tx.auditLog.create({
      data: {
        restaurantId,
        actorId,
        action: "menu_item_availability_toggled",
        entityType: "menu_item",
        entityId: itemId,
        metadata: { name: item.name, available: !item.available }
      }
    });
  });

  revalidatePath("/owner/menu");
  redirect(withMenuRedirectParam(redirectBase, "toggled", "item"));
}

export async function importMenuSpreadsheetAction(formData: FormData) {
  const user = await requireRole([UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN]);
  const requestedRestaurantId = String(formData.get("restaurantId") || "");
  const restaurantId =
    user.restaurantId ||
    requestedRestaurantId ||
    (await requireOwnerRestaurantId());
  const file = formData.get("menuFile");
  const redirectBase = menuRedirectBase(
    user.role === UserRole.SUPER_ADMIN ? restaurantId : undefined
  );

  if (!(file instanceof File) || file.size === 0) {
    redirect(withMenuRedirectParam(redirectBase, "error", "missing_menu_file"));
  }

  try {
    const rows = await parseMenuSpreadsheet(file);
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true }
    });

    await importMenuRowsForRestaurant({
      restaurantId,
      actorId: user.id,
      rows,
      sourceLabel: file.name
    });

    if (restaurant) {
      revalidatePath(`/menu/${restaurant.slug}`);
    }
  } catch (error) {
    const message = encodeURIComponent(
      error instanceof Error ? error.message : "import_failed"
    );
    const errorUrl = withMenuRedirectParam(redirectBase, "error", "import_failed");
    redirect(`${errorUrl}&details=${message}`);
  }

  revalidatePath("/owner/menu");
  redirect(withMenuRedirectParam(redirectBase, "imported", "1"));
}
