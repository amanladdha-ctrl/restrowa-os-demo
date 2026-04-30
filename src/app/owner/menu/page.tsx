import { UserRole } from "@prisma/client";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { FoodImage } from "@/components/food-image";
import { StatusBadge } from "@/components/status-badge";
import {
  createCategoryAction,
  createItemAction,
  deleteCategoryAction,
  importMenuSpreadsheetAction,
  deleteItemAction,
  toggleItemAvailabilityAction,
  updateCategoryAction,
  updateItemAction
} from "@/app/owner/menu/actions";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { ownerNavItems } from "@/lib/owner-nav";
import { requireOwnerRestaurantIdFromSearch } from "@/lib/owner-restaurant";
import { prisma } from "@/lib/prisma";
import { getRestaurantOpenState } from "@/lib/restaurant-open";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  category_exists: "A category with that name already exists.",
  category_has_items: "Delete or move items before deleting this category.",
  item_exists: "An item with that name already exists in this restaurant.",
  invalid_item:
    "Item could not be saved. Check required fields and use an image URL starting with http:// or https://.",
  not_found: "That menu record was not found.",
  category_not_found: "Selected category was not found.",
  missing_menu_file: "Please choose an Excel or CSV file before uploading.",
  import_failed: "Menu import failed. Check the file format and template columns."
};

const successMessages: Record<string, string> = {
  "created:category": "Category added.",
  "saved:category": "Category saved.",
  "deleted:category": "Category deleted.",
  "created:item": "Menu item added.",
  "saved:item": "Menu item saved.",
  "deleted:item": "Menu item deleted.",
  "toggled:item": "Availability updated.",
  imported: "Menu spreadsheet imported. Categories and items are now ready."
};

function Field({
  label,
  children,
  wide = false
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={`grid gap-2 text-sm font-bold text-ink ${wide ? "md:col-span-2" : ""}`}
    >
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal";

const smallInputClass =
  "focus-ring rounded-2xl border border-orange-100 bg-white px-4 py-3 font-normal";

export default async function OwnerMenuPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole([UserRole.RESTAURANT_OWNER, UserRole.SUPER_ADMIN]);
  const query = await searchParams;
  const restaurantId = await requireOwnerRestaurantIdFromSearch(query.restaurantId);
  const successKey =
    (query.created && `created:${query.created}`) ||
    (query.saved && `saved:${query.saved}`) ||
    (query.deleted && `deleted:${query.deleted}`) ||
    (query.toggled && `toggled:${query.toggled}`) ||
    (query.imported && "imported") ||
    "";

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
          }
        }
      }
    }
  });

  if (!restaurant) {
    return null;
  }

  const openState = getRestaurantOpenState(
    restaurant.openingTime,
    restaurant.closingTime
  );
  const totalItems = restaurant.categories.reduce(
    (total, category) => total + category.items.length,
    0
  );
  const availableItems = restaurant.categories.reduce(
    (total, category) =>
      total + category.items.filter((item) => item.available).length,
    0
  );

  return (
    <AppShell
      title="Menu Manager"
      subtitle="Add categories, menu items, prices, veg/non-veg labels, images, and availability from the owner panel."
      navItems={ownerNavItems(
        restaurant.slug,
        query.restaurantId ? restaurant.id : undefined
      )}
    >
      {query.error ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {errorMessages[query.error] ?? "Something went wrong."}
          {query.details ? (
            <p className="mt-2 font-medium">{decodeURIComponent(query.details)}</p>
          ) : null}
        </div>
      ) : null}

      {successKey && successMessages[successKey] ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          {successMessages[successKey]}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
          <p className="text-sm font-bold text-slate-500">Restaurant</p>
          <p className="mt-3 text-xl font-black text-ink">{restaurant.name}</p>
          <div className="mt-3">
            <StatusBadge value={restaurant.status} />
          </div>
        </div>
        <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
          <p className="text-sm font-bold text-slate-500">Categories</p>
          <p className="mt-3 text-3xl font-black text-ink">
            {restaurant.categories.length}
          </p>
        </div>
        <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
          <p className="text-sm font-bold text-slate-500">Available items</p>
          <p className="mt-3 text-3xl font-black text-ink">
            {availableItems}/{totalItems}
          </p>
        </div>
        <div className="rounded-3xl bg-white/90 p-5 shadow-soft">
          <p className="text-sm font-bold text-slate-500">Open status</p>
          <p className="mt-3 text-2xl font-black text-ink">{openState.label}</p>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Bulk menu import</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upload one Excel or CSV file and RestroWA will create or update the
              full menu in one go. Best for first-time restaurant onboarding.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-full bg-cream px-4 py-2 text-sm font-black text-clay"
              href="/templates/restrowa-menu-template.xlsx"
            >
              Download Excel template
            </a>
            <a
              className="rounded-full bg-cream px-4 py-2 text-sm font-black text-clay"
              href="/templates/restrowa-menu-template.csv"
            >
              Download CSV template
            </a>
          </div>
        </div>

        <form action={importMenuSpreadsheetAction} className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <input name="restaurantId" type="hidden" value={restaurant.id} />
          <Field label="Menu file (.xlsx, .xls, .csv)" wide>
            <input
              accept=".xlsx,.xls,.csv"
              className={inputClass}
              name="menuFile"
              required
              type="file"
            />
          </Field>
          <button className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">
            Import menu file
          </button>
        </form>

        <div className="mt-5 rounded-3xl bg-cream p-4 text-sm text-slate-600">
          <p className="font-black text-ink">Template columns</p>
          <p className="mt-1">
            `categoryName`, `categorySortOrder`, `itemName`, `price`, `vegType`,
            `description`, `imageUrl`, `available`, `recommended`, `popular`,
            `itemSortOrder`
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-5">
          <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
            <h2 className="text-xl font-black text-ink">Add category</h2>
            <form action={createCategoryAction} className="mt-5 grid gap-4">
              <input name="restaurantId" type="hidden" value={restaurant.id} />
              <Field label="Category name">
                <input
                  className={inputClass}
                  name="name"
                  placeholder="Starters"
                  required
                />
              </Field>
              <Field label="Sort order">
                <input
                  className={inputClass}
                  defaultValue="0"
                  min="0"
                  name="sortOrder"
                  type="number"
                />
              </Field>
              <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
                <input defaultChecked name="active" type="checkbox" />
                Show category publicly
              </label>
              <button className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white">
                Add category
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
            <h2 className="text-xl font-black text-ink">Add menu item</h2>
            <p className="mt-1 text-sm text-slate-500">
              Image URL can be original restaurant photo or a demo food image.
            </p>
            <form action={createItemAction} className="mt-5 grid gap-4">
              <input name="restaurantId" type="hidden" value={restaurant.id} />
              <Field label="Category">
                <select className={inputClass} name="categoryId" required>
                  {restaurant.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Item name">
                <input
                  className={inputClass}
                  name="name"
                  placeholder="Paneer Tikka"
                  required
                />
              </Field>
              <Field label="Price">
                <input
                  className={inputClass}
                  min="0"
                  name="price"
                  placeholder="199"
                  required
                  type="number"
                />
              </Field>
              <Field label="Veg type">
                <select className={inputClass} name="vegType">
                  <option value="veg">veg</option>
                  <option value="non_veg">non_veg</option>
                  <option value="egg">egg</option>
                </select>
              </Field>
              <Field label="Image URL" wide>
                <input
                  className={inputClass}
                  name="imageUrl"
                  placeholder="https://example.com/food-photo.jpg"
                  type="url"
                />
              </Field>
              <Field label="Description" wide>
                <textarea
                  className={`${inputClass} min-h-24`}
                  name="description"
                  placeholder="Short customer-friendly item description"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
                  <input defaultChecked name="available" type="checkbox" />
                  Available
                </label>
                <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
                  <input name="recommended" type="checkbox" />
                  Recommended
                </label>
                <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
                  <input name="popular" type="checkbox" />
                  Popular
                </label>
              </div>
              <Field label="Sort order">
                <input
                  className={inputClass}
                  defaultValue="0"
                  min="0"
                  name="sortOrder"
                  type="number"
                />
              </Field>
              <button className="rounded-2xl bg-saffron px-5 py-3 text-sm font-black text-white">
                Add item
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-5">
          {restaurant.categories.map((category) => (
            <section
              className="rounded-[2rem] bg-white/90 p-5 shadow-soft"
              key={category.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <form
                  action={updateCategoryAction}
                  className="grid flex-1 gap-3 md:grid-cols-[1fr_8rem_auto]"
                >
                  <input name="restaurantId" type="hidden" value={restaurant.id} />
                  <input name="categoryId" type="hidden" value={category.id} />
                  <Field label="Category">
                    <input
                      className={smallInputClass}
                      defaultValue={category.name}
                      name="name"
                      required
                    />
                  </Field>
                  <Field label="Sort">
                    <input
                      className={smallInputClass}
                      defaultValue={category.sortOrder}
                      min="0"
                      name="sortOrder"
                      type="number"
                    />
                  </Field>
                  <div className="grid gap-2">
                    <label className="flex items-center gap-2 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
                      <input
                        defaultChecked={category.active}
                        name="active"
                        type="checkbox"
                      />
                      Public
                    </label>
                    <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white">
                      Save
                    </button>
                  </div>
                </form>
                <form action={deleteCategoryAction}>
                  <input name="restaurantId" type="hidden" value={restaurant.id} />
                  <input name="categoryId" type="hidden" value={category.id} />
                  <button className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                    Delete category
                  </button>
                </form>
              </div>

              <div className="mt-5 grid gap-4">
                {category.items.length === 0 ? (
                  <div className="rounded-3xl bg-cream p-6 text-center text-sm text-slate-600">
                    No items in this category yet.
                  </div>
                ) : (
                  category.items.map((item) => (
                    <article
                      className="rounded-3xl border border-orange-100 bg-cream p-4"
                      key={item.id}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row">
                        <FoodImage
                          alt={item.name}
                          className="h-28 w-full lg:h-32 lg:w-32"
                          src={item.imageUrl}
                        />
                        <form
                          action={updateItemAction}
                          className="grid flex-1 gap-3 md:grid-cols-2"
                        >
                          <input name="restaurantId" type="hidden" value={restaurant.id} />
                          <input name="itemId" type="hidden" value={item.id} />
                          <Field label="Item name">
                            <input
                              className={smallInputClass}
                              defaultValue={item.name}
                              name="name"
                              required
                            />
                          </Field>
                          <Field label="Category">
                            <select
                              className={smallInputClass}
                              defaultValue={category.id}
                              name="categoryId"
                            >
                              {restaurant.categories.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Price">
                            <input
                              className={smallInputClass}
                              defaultValue={item.price.toString()}
                              min="0"
                              name="price"
                              type="number"
                            />
                          </Field>
                          <Field label="Veg type">
                            <select
                              className={smallInputClass}
                              defaultValue={item.vegType}
                              name="vegType"
                            >
                              <option value="veg">veg</option>
                              <option value="non_veg">non_veg</option>
                              <option value="egg">egg</option>
                            </select>
                          </Field>
                          <Field label="Image URL" wide>
                            <input
                              className={smallInputClass}
                              defaultValue={item.imageUrl ?? ""}
                              name="imageUrl"
                              type="url"
                            />
                          </Field>
                          <Field label="Description" wide>
                            <textarea
                              className={`${smallInputClass} min-h-20`}
                              defaultValue={item.description ?? ""}
                              name="description"
                            />
                          </Field>
                          <div className="grid gap-3 md:col-span-2 md:grid-cols-4">
                            <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-ink">
                              <input
                                defaultChecked={item.available}
                                name="available"
                                type="checkbox"
                              />
                              Available
                            </label>
                            <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-ink">
                              <input
                                defaultChecked={item.recommended}
                                name="recommended"
                                type="checkbox"
                              />
                              Recommended
                            </label>
                            <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-ink">
                              <input
                                defaultChecked={item.popular}
                                name="popular"
                                type="checkbox"
                              />
                              Popular
                            </label>
                            <label className="grid gap-1 text-sm font-bold text-ink">
                              Sort
                              <input
                                className="focus-ring rounded-2xl border border-orange-100 bg-white px-4 py-2 font-normal"
                                defaultValue={item.sortOrder}
                                min="0"
                                name="sortOrder"
                                type="number"
                              />
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2 md:col-span-2">
                            <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white">
                              Save item
                            </button>
                            <span className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-clay">
                              {formatCurrency(item.price.toString())}
                            </span>
                            <span className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-600">
                              {item.available ? "Visible" : "Hidden"}
                            </span>
                          </div>
                        </form>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <form action={toggleItemAvailabilityAction}>
                          <input name="restaurantId" type="hidden" value={restaurant.id} />
                          <input name="itemId" type="hidden" value={item.id} />
                          <button className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-clay">
                            {item.available ? "Mark unavailable" : "Mark available"}
                          </button>
                        </form>
                        <form action={deleteItemAction}>
                          <input name="restaurantId" type="hidden" value={restaurant.id} />
                          <input name="itemId" type="hidden" value={item.id} />
                          <button className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                            Delete item
                          </button>
                        </form>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
