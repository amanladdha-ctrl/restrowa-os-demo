# Changelog

## 0.9.3 - Public Flow Speed Pass

Added:

- Client-side add-to-cart flow on the public menu, so cart count and amount update live without a full page refresh.
- Dedicated JSON cart-add API route for lighter public ordering interactions.
- Client-side cart mutations for quantity changes, remove item, apply coupon, and clear coupon without a full page refresh.
- Dedicated JSON cart-mutation API route for live cart updates.
- Shared route loading states for login, menu, cart, checkout, admin, owner, and staff pages.
- Pending button feedback like `Signing you in...` and `Adding...` so clicks no longer feel invisible.

Changed:

- Removed recent-order lookup from the first public menu render to reduce page-load work for trial traffic.
- Public menu cart summary now stays visible as a live-updating checkout shortcut.
- Public cart page now keeps totals in sync after quantity and coupon changes without a route redirect.

Verified:

- `npm run typecheck`
- `npm run build`

## 0.9.2 - Prepaid First And Excel Menu Import

Added:

- Prepaid-first checkout default that prefers dynamic UPI QR when available.
- Bulk `.xlsx`, `.xls`, and `.csv` menu import from owner menu manager.
- Bulk `.xlsx`, `.xls`, and `.csv` menu import from Super Admin restaurant detail.
- Spreadsheet parser that creates missing categories and creates or updates menu items in one pass.
- Downloadable demo menu templates in `public/templates` and `menu-imports`.
- Owner menu actions now preserve selected restaurant context better for Super Admin previews.

Verified:

- `npm run menu:template`
- `npm run typecheck`
- `npm run build`

## 0.9.1 - Custom Domain Foundation

Added:

- Optional `customDomain` and `customDomainVerified` fields on restaurant records.
- Domain normalization helper for future white-label routing.
- Admin restaurant detail page now shows platform menu URL, custom-domain status, and simulator shortcut.
- App home can detect a verified custom-domain host and route toward that restaurant's public menu foundation flow.

Verified:

- `npm run prisma:generate`
- `npm run typecheck`
- `npm run build`

## 0.9.0 - Link-First Payment Ready Flow

Added:

- Dynamic per-order UPI payment links based on exact order amount.
- Dynamic QR generation for UPI payments on order confirmation and tracking pages.
- Payment link mode alongside COD and UPI QR in checkout.
- Payment link display for easy WhatsApp/manual sharing.
- Admin support replies with resolve note.
- Owner and staff dashboards now show support updates after admin responds.

Verified:

- `npm run prisma:migrate -- --name support_replies`
- `npm run prisma:generate`
- `npm run typecheck`
- `npm run build`

## 0.8.0 - Phase 7 Trial And Subscription Enforcement

Added:

- Central subscription evaluation helper for trial, active, past due, suspended, and inactive restaurant states.
- Super Admin `Refresh all statuses` action on `/admin`.
- Restaurant-level `Refresh subscription status` action on `/admin/restaurants/[id]`.
- Owner and staff warning banners for upcoming trial end, past due grace period, and suspension.
- Public menu, cart, checkout, and WhatsApp simulator enforcement for suspended/inactive restaurants.
- Payment reactivation now resets the subscription window for the next 30 days.

Verified:

- `npm run typecheck`
- `npm run build`

## 0.7.0 - Admin Ops And Account Support

Added:

- Account security page at `/account/security` for password changes.
- Recommended password-change flow for newly created owner accounts.
- Support request flow from owner and staff dashboards.
- Super Admin support inbox at `/admin/support`.
- Open support alerts section on the Super Admin dashboard.
- Back-to-admin navigation from Super Admin owner/staff/public restaurant views.
- Readable restaurant-prefixed order codes such as `ME-1002`.
- Staff-specific navigation that avoids owner-only links for real staff users.

Verified:

- `npm run prisma:generate`
- `npm run typecheck`
- `npm run build`

## 0.6.0 - Phase 6 WhatsApp Simulator

Added:

- Public WhatsApp simulator route at `/whatsapp-simulator/[slug]`.
- Stored simulator conversations in `whatsapp_messages`.
- Stored simulator session state in `whatsapp_sessions`.
- Welcome flow for `Hi` with options for menu, order tracking, call/chat, and offers.
- Order tracking reply by order number and customer phone.
- Super Admin WhatsApp logs page at `/admin/whatsapp-logs`.
- Quick links to the simulator from home and public menu.

Verified:

- `npm run typecheck`
- `npm run build`

## 0.5.1 - Phase 5 Order Routing Fixes

Fixed:

- Preserved selected restaurant context after owner/staff status updates.
- Revalidated customer tracking and confirmation pages after order status/payment changes.
- Staff orders page now supports selected restaurant view for Super Admin.
- Owner navigation now keeps the selected restaurant when opening staff orders.
- Added seeded staff accounts for Oldays Cafe, Bella Roma, and Dragon Wok.
- Updated order confirmation copy now that live order dashboards exist.

Verified:

- `npm run typecheck`

## 0.5.2 - Phase 5 Live Queue Refresh

Added:

- Owner dashboard now separates live, delivered, and closed orders.
- Staff dashboard now separates live and delivered orders.
- Browser auto-refresh every 10 seconds on owner, staff, and customer tracking pages.
- Optional browser notifications for new owner/staff orders when permission is allowed.

Verified:

- `npm run typecheck`

## 0.5.0 - Phase 5 Live Order Dashboard

Added:

- Owner live orders page at `/owner/orders`.
- Staff live orders page with real order cards.
- Order status actions: accept, reject, preparing, ready, out for delivery, delivered, cancelled.
- Mock UPI payment verification action.
- Status history entries for every status change.
- Audit logs for order status and payment verification.
- Customer recent order links on the public menu for the same browser/session.

Verified:

- `npm run typecheck`
- `npm run build`
- `npm run lint`

Notes:

- Print KOT is still a placeholder button.
- Real-time websocket updates are not added yet; refresh shows latest server state.

## 0.4.0 - Phase 4 Customer Cart + Order Flow

Added:

- Public menu add-to-cart actions.
- Session cookie based cart.
- Cart page with item quantity update, remove item, coupon apply, and coupon clear.
- Checkout page for delivery, pickup, and dine-in.
- COD and mock UPI QR payment mode support.
- Order creation transaction that creates customer, order, order items, payment, status history, and platform fee ledger.
- Order confirmation page.
- Customer order tracking page.

Verified:

- `npm run typecheck`
- `npm run build`
- `npm run lint`

Notes:

- Restaurant staff live order dashboard and status update actions are still Phase 5.
- Mock UPI QR does not verify real payment yet.

## 0.3.0 - Phase 3 Restaurant Menu Manager

Added:

- Owner menu manager route at `/owner/menu`.
- Category create, update, and delete actions.
- Menu item create, update, delete, and availability toggle actions.
- Menu item support for image URL, description, price, veg/non-veg/egg, sort order, popular, recommended, and availability.
- Tenant-scoped owner menu actions to prevent cross-restaurant edits.
- Public menu image rendering with fallback placeholder.
- Public menu popular/recommended badges.
- Open/closed display based on restaurant timings.
- Demo seed image URLs for Mewad Bites items.
- Restaurant branding fields for logo URL, primary color, accent color, and background color.
- Super Admin controls for restaurant logo and theme colors.
- Public menu branding based on restaurant theme settings.
- Lazy loading for menu item images.
- Seeded Oldays Cafe with a multi-cuisine demo menu.
- Seeded Bella Roma Italian Kitchen with an Italian demo menu.
- Seeded Dragon Wok Chinese with a Chinese demo menu.
- Added `menu:import` JSON import script and example import file.
- Added menu import workflow documentation.

Verified:

- `npm run prisma:migrate -- --name phase_3_brand_theme`
- `npm run prisma:generate`
- `npm run db:seed`
- `npm run menu:import -- menu-imports/example-menu-import.json`
- `npm run typecheck`
- `npm run build`
- `npm run lint`
- `npm run db:seed`

Notes:

- Image upload/storage is deferred; use image URLs for now.
- Cart and checkout remain deferred to Phase 4.

## 0.2.0 - Phase 2 Super Admin MVP

Added:

- Super Admin restaurant management page.
- Create restaurant flow with owner login creation.
- Restaurant detail page for profile, trial, billing, delivery, and payment settings.
- Quick status controls for trial, active, past due, suspended, and inactive.
- Trial extension action.
- Mark-paid action that reactivates the restaurant and records subscription payment.
- Audit logs for restaurant creation, updates, status changes, trial extension, and payment updates.
- Audit log viewer page.

Verified:

- `npm run typecheck`
- `npm run build`
- `npm run lint`

Notes:

- Menu editing is still deferred to Phase 3.
- Order/cart flow is still deferred to Phase 4.
- Scheduled trial expiry enforcement is still deferred to Phase 7.

## 0.1.0 - Phase 1 Skeleton

Added:

- Next.js App Router project skeleton with TypeScript and Tailwind CSS.
- Prisma PostgreSQL schema for RestroWA OS multi-tenant SaaS foundation.
- Demo defaults for Mewad Bites Demo Restaurant.
- Seed script with Super Admin, Restaurant Owner, and Staff accounts.
- Simple email/password login using signed HTTP-only cookies.
- Role guards for Super Admin, Owner, and Staff dashboards.
- Public mobile-first menu preview route by restaurant slug.
- Local PostgreSQL Docker Compose setup.
- README, TODO, CHANGELOG, and `.env.example`.

Verified:

- `npm run prisma:generate`
- `npm run typecheck`
- `npm run build`
- `npm run lint`

Notes:

- Cart, checkout, real orders, status updates, WhatsApp simulator, and payment flow are intentionally deferred to later phases.
