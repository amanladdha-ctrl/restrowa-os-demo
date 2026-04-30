import { PrismaClient, VegType } from "@prisma/client";
import { readFileSync } from "fs";
import { z } from "zod";

const prisma = new PrismaClient();

const menuImportSchema = z.object({
  restaurantSlug: z.string().min(2),
  categories: z.array(
    z.object({
      name: z.string().min(2),
      sortOrder: z.number().int().min(0).optional(),
      active: z.boolean().optional(),
      items: z.array(
        z.object({
          name: z.string().min(2),
          price: z.number().min(0),
          vegType: z.enum(["veg", "non_veg", "egg"]).optional(),
          description: z.string().optional(),
          imageUrl: z.string().url().optional().or(z.literal("")),
          available: z.boolean().optional(),
          popular: z.boolean().optional(),
          recommended: z.boolean().optional(),
          sortOrder: z.number().int().min(0).optional()
        })
      )
    })
  )
});

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    throw new Error(
      "Usage: npm run menu:import -- menu-imports/example-menu.json"
    );
  }

  const raw = readFileSync(filePath, "utf8");
  const input = menuImportSchema.parse(JSON.parse(raw));

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: input.restaurantSlug },
    select: { id: true, name: true }
  });

  if (!restaurant) {
    throw new Error(`Restaurant not found for slug: ${input.restaurantSlug}`);
  }

  let itemCount = 0;

  for (const [categoryIndex, categoryInput] of input.categories.entries()) {
    const category = await prisma.menuCategory.upsert({
      where: {
        restaurantId_name: {
          restaurantId: restaurant.id,
          name: categoryInput.name
        }
      },
      update: {
        sortOrder: categoryInput.sortOrder ?? categoryIndex,
        active: categoryInput.active ?? true
      },
      create: {
        restaurantId: restaurant.id,
        name: categoryInput.name,
        sortOrder: categoryInput.sortOrder ?? categoryIndex,
        active: categoryInput.active ?? true
      }
    });

    for (const [itemIndex, itemInput] of categoryInput.items.entries()) {
      await prisma.menuItem.upsert({
        where: {
          restaurantId_name: {
            restaurantId: restaurant.id,
            name: itemInput.name
          }
        },
        update: {
          categoryId: category.id,
          price: itemInput.price,
          vegType: (itemInput.vegType ?? "veg") as VegType,
          description: itemInput.description ?? null,
          imageUrl: itemInput.imageUrl || null,
          available: itemInput.available ?? true,
          popular: itemInput.popular ?? false,
          recommended: itemInput.recommended ?? false,
          sortOrder: itemInput.sortOrder ?? itemIndex
        },
        create: {
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: itemInput.name,
          price: itemInput.price,
          vegType: (itemInput.vegType ?? "veg") as VegType,
          description: itemInput.description ?? null,
          imageUrl: itemInput.imageUrl || null,
          available: itemInput.available ?? true,
          popular: itemInput.popular ?? false,
          recommended: itemInput.recommended ?? false,
          sortOrder: itemInput.sortOrder ?? itemIndex
        }
      });

      itemCount += 1;
    }
  }

  await prisma.auditLog.create({
    data: {
      restaurantId: restaurant.id,
      action: "menu_imported_from_json",
      entityType: "menu_import",
      metadata: {
        filePath,
        categoryCount: input.categories.length,
        itemCount
      }
    }
  });

  console.log(
    `Imported ${itemCount} menu items across ${input.categories.length} categories for ${restaurant.name}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
