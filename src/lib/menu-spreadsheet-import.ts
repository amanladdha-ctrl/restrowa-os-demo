import type { Prisma, VegType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const headerAliases: Record<string, string[]> = {
  categoryName: ["category", "categoryname", "category_name"],
  categorySortOrder: ["categorysortorder", "category_sort_order", "categorysort"],
  itemName: ["item", "itemname", "item_name", "name"],
  price: ["price", "rate", "amount"],
  vegType: ["vegtype", "veg_type", "type"],
  description: ["description", "desc"],
  imageUrl: ["imageurl", "image_url", "image", "photo", "photourl"],
  available: ["available", "isavailable"],
  recommended: ["recommended", "isrecommended"],
  popular: ["popular", "ispopular"],
  itemSortOrder: ["itemsortorder", "item_sort_order", "itemsort"]
};

type ParsedImportRow = {
  categoryName: string;
  categorySortOrder: number;
  itemName: string;
  price: number;
  vegType: VegType;
  description: string | null;
  imageUrl: string | null;
  available: boolean;
  recommended: boolean;
  popular: boolean;
  itemSortOrder: number;
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getCellValue(row: Record<string, unknown>, aliases: string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    normalizeHeader(key),
    value
  ] as const);

  for (const alias of aliases) {
    const match = normalizedEntries.find(([key]) => key === alias);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

function parseBoolean(value: unknown, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  return ["true", "yes", "y", "1"].includes(normalized);
}

function parseVegType(value: unknown): VegType {
  const normalized = String(value ?? "veg").trim().toLowerCase();
  if (normalized === "non_veg" || normalized === "nonveg" || normalized === "non-veg") {
    return "non_veg";
  }
  if (normalized === "egg") {
    return "egg";
  }
  return "veg";
}

function parseNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseRequiredText(value: unknown) {
  return String(value ?? "").trim();
}

function validateImageUrl(value: string | null) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : null;
}

export async function parseMenuSpreadsheet(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(bytes, {
    type: "buffer",
    cellDates: false
  });

  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    throw new Error("Spreadsheet does not contain any sheet.");
  }

  const sheet = workbook.Sheets[firstSheet];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ""
  });

  const parsedRows: ParsedImportRow[] = rawRows
    .map((row, index) => {
      const categoryName = parseRequiredText(
        getCellValue(row, headerAliases.categoryName)
      );
      const itemName = parseRequiredText(getCellValue(row, headerAliases.itemName));
      const price = parseNumber(getCellValue(row, headerAliases.price), NaN);

      if (!categoryName && !itemName) {
        return null;
      }

      if (!categoryName || !itemName || !Number.isFinite(price)) {
        throw new Error(
          `Row ${index + 2} is invalid. Required columns: categoryName, itemName, price.`
        );
      }

      return {
        categoryName,
        categorySortOrder: parseNumber(
          getCellValue(row, headerAliases.categorySortOrder),
          index
        ),
        itemName,
        price,
        vegType: parseVegType(getCellValue(row, headerAliases.vegType)),
        description: parseText(getCellValue(row, headerAliases.description)),
        imageUrl: validateImageUrl(
          parseText(getCellValue(row, headerAliases.imageUrl))
        ),
        available: parseBoolean(
          getCellValue(row, headerAliases.available),
          true
        ),
        recommended: parseBoolean(
          getCellValue(row, headerAliases.recommended),
          false
        ),
        popular: parseBoolean(getCellValue(row, headerAliases.popular), false),
        itemSortOrder: parseNumber(
          getCellValue(row, headerAliases.itemSortOrder),
          index
        )
      };
    })
    .filter((row): row is ParsedImportRow => row !== null);

  if (!parsedRows.length) {
    throw new Error("Spreadsheet does not contain any menu rows.");
  }

  return parsedRows;
}

export async function importMenuRowsForRestaurant(input: {
  restaurantId: string;
  actorId: string;
  rows: ParsedImportRow[];
  sourceLabel: string;
}) {
  const categoryMap = new Map<string, string>();
  let categoriesCreated = 0;
  let itemsCreated = 0;
  let itemsUpdated = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of input.rows) {
      let categoryId = categoryMap.get(row.categoryName);

      if (!categoryId) {
        const existingCategory = await tx.menuCategory.findUnique({
          where: {
            restaurantId_name: {
              restaurantId: input.restaurantId,
              name: row.categoryName
            }
          }
        });

        if (existingCategory) {
          categoryId = existingCategory.id;
          await tx.menuCategory.update({
            where: { id: existingCategory.id },
            data: {
              active: true,
              sortOrder: row.categorySortOrder
            }
          });
        } else {
          const createdCategory = await tx.menuCategory.create({
            data: {
              restaurantId: input.restaurantId,
              name: row.categoryName,
              active: true,
              sortOrder: row.categorySortOrder
            }
          });
          categoryId = createdCategory.id;
          categoriesCreated += 1;
        }

        categoryMap.set(row.categoryName, categoryId);
      }

      const menuItemData: Prisma.MenuItemUncheckedCreateInput = {
        restaurantId: input.restaurantId,
        categoryId,
        name: row.itemName,
        price: row.price,
        imageUrl: row.imageUrl,
        description: row.description,
        vegType: row.vegType,
        available: row.available,
        recommended: row.recommended,
        popular: row.popular,
        sortOrder: row.itemSortOrder
      };

      const existingItem = await tx.menuItem.findUnique({
        where: {
          restaurantId_name: {
            restaurantId: input.restaurantId,
            name: row.itemName
          }
        }
      });

      if (existingItem) {
        await tx.menuItem.update({
          where: { id: existingItem.id },
          data: menuItemData
        });
        itemsUpdated += 1;
      } else {
        await tx.menuItem.create({
          data: menuItemData
        });
        itemsCreated += 1;
      }
    }

    await tx.auditLog.create({
      data: {
        restaurantId: input.restaurantId,
        actorId: input.actorId,
        action: "menu_spreadsheet_imported",
        entityType: "menu_import",
        metadata: {
          sourceLabel: input.sourceLabel,
          rowCount: input.rows.length,
          categoriesCreated,
          itemsCreated,
          itemsUpdated
        }
      }
    });
  });

  return {
    rowCount: input.rows.length,
    categoriesCreated,
    itemsCreated,
    itemsUpdated
  };
}
