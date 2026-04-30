import type { Restaurant } from "@prisma/client";
import {
  createRestaurantAction,
  updateRestaurantAction
} from "@/app/admin/restaurants/actions";
import { toDateInputValue } from "@/lib/date-input";

type RestaurantFormProps = {
  mode: "create" | "edit";
  restaurant?: Restaurant;
};

function numberValue(value: unknown, fallback = "0") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function defaultDate(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return toDateInputValue(date);
}

export function RestaurantForm({ mode, restaurant }: RestaurantFormProps) {
  const isEdit = mode === "edit";
  const action = isEdit ? updateRestaurantAction : createRestaurantAction;

  return (
    <form action={action} className="grid gap-6">
      {restaurant ? (
        <input name="restaurantId" type="hidden" value={restaurant.id} />
      ) : null}

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">Restaurant Details</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-ink">
            Restaurant name
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.name ?? "New Demo Restaurant"}
              name="name"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Public slug
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.slug ?? "new-demo-restaurant"}
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink md:col-span-2">
            Custom domain
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.customDomain ?? ""}
              name="customDomain"
              placeholder="order.restaurant.com"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink md:col-span-2">
            <input
              defaultChecked={restaurant?.customDomainVerified ?? false}
              name="customDomainVerified"
              type="checkbox"
            />
            Custom domain verified and ready to use
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink md:col-span-2">
            Address
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.address ?? "Demo Address, Rajasthan"}
              name="address"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Phone
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.phone ?? "+91 90000 00003"}
              name="phone"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            WhatsApp number
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.whatsappNumber ?? "+91 90000 00004"}
              name="whatsappNumber"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink md:col-span-2">
            Logo URL
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.logoUrl ?? ""}
              name="logoUrl"
              placeholder="https://example.com/restaurant-logo.png"
              type="url"
            />
          </label>
          <div className="grid gap-4 rounded-3xl bg-cream p-4 md:col-span-2 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-ink">
              Primary color
              <input
                className="h-12 w-full rounded-2xl border border-orange-100 bg-white px-2"
                defaultValue={restaurant?.themePrimary ?? "#1f2933"}
                name="themePrimary"
                type="color"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Accent color
              <input
                className="h-12 w-full rounded-2xl border border-orange-100 bg-white px-2"
                defaultValue={restaurant?.themeAccent ?? "#e6902e"}
                name="themeAccent"
                type="color"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Background color
              <input
                className="h-12 w-full rounded-2xl border border-orange-100 bg-white px-2"
                defaultValue={restaurant?.themeBackground ?? "#fff7ed"}
                name="themeBackground"
                type="color"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Opening time
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.openingTime ?? "10:00"}
              name="openingTime"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Closing time
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.closingTime ?? "22:30"}
              name="closingTime"
              required
            />
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">Trial And Billing</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-bold text-ink">
            Status
            <select
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.status ?? "trial"}
              name="status"
            >
              <option value="trial">trial</option>
              <option value="active">active</option>
              <option value="past_due">past_due</option>
              <option value="suspended">suspended</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Trial start
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={
                restaurant
                  ? toDateInputValue(restaurant.trialStartDate)
                  : defaultDate(0)
              }
              name="trialStartDate"
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Trial end
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={
                restaurant ? toDateInputValue(restaurant.trialEndDate) : defaultDate(30)
              }
              name="trialEndDate"
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Grace period days
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.gracePeriodDays ?? 5}
              min="0"
              name="gracePeriodDays"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Plan
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.planType ?? "Starter"}
              name="planType"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Monthly amount
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={numberValue(restaurant?.subscriptionAmount, "999")}
              min="0"
              name="subscriptionAmount"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Payment due
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={numberValue(restaurant?.paymentDueAmount, "0")}
              min="0"
              name="paymentDueAmount"
              type="number"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
            <input
              defaultChecked={restaurant?.perOrderFeeEnabled ?? true}
              name="perOrderFeeEnabled"
              type="checkbox"
            />
            Per-order fee enabled
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Per-order fee
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={numberValue(restaurant?.perOrderFeeAmount, "5")}
              min="0"
              name="perOrderFeeAmount"
              type="number"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">Order Rules</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
            <input
              defaultChecked={restaurant?.deliveryEnabled ?? true}
              name="deliveryEnabled"
              type="checkbox"
            />
            Delivery enabled
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
            <input
              defaultChecked={restaurant?.pickupEnabled ?? true}
              name="pickupEnabled"
              type="checkbox"
            />
            Pickup enabled
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
            <input
              defaultChecked={restaurant?.dineInEnabled ?? true}
              name="dineInEnabled"
              type="checkbox"
            />
            Dine-in enabled
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Delivery charge
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={numberValue(restaurant?.deliveryCharge, "30")}
              min="0"
              name="deliveryCharge"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Free delivery above
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={numberValue(restaurant?.freeDeliveryAbove, "499")}
              min="0"
              name="freeDeliveryAbove"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Minimum order
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={numberValue(restaurant?.minimumOrderAmount, "99")}
              min="0"
              name="minimumOrderAmount"
              type="number"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">Payment Settings</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
            <input
              defaultChecked={restaurant?.codEnabled ?? true}
              name="codEnabled"
              type="checkbox"
            />
            COD enabled
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink">
            <input
              defaultChecked={restaurant?.upiQrEnabled ?? true}
              name="upiQrEnabled"
              type="checkbox"
            />
            UPI QR enabled
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            UPI ID
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={restaurant?.upiId ?? "demo@upi"}
              name="upiId"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Payment instructions
            <input
              className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              defaultValue={
                restaurant?.paymentInstructions ??
                "This is a mock UPI flow for MVP demo only."
              }
              name="paymentInstructions"
            />
          </label>
        </div>
      </section>

      {!isEdit ? (
        <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">Owner Login</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The owner can keep this starter password or change it later from the
            dashboard security page.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-ink">
              Owner name
              <input
                className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
                defaultValue="Restaurant Owner"
                name="ownerName"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Owner email
              <input
                className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
                defaultValue="owner-new@restrowa.local"
                name="ownerEmail"
                required
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Owner password
              <input
                className="focus-ring rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
                defaultValue="Owner@12345"
                minLength={8}
                name="ownerPassword"
                required
                type="text"
              />
            </label>
          </div>
        </section>
      ) : null}

      <button className="focus-ring rounded-2xl bg-saffron px-6 py-4 text-base font-black text-white shadow-soft transition hover:bg-clay">
        {isEdit ? "Save restaurant changes" : "Create restaurant and owner"}
      </button>
    </form>
  );
}
