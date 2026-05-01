# RestroWA OS

WhatsApp-first direct ordering SaaS for restaurants. This repo is being built phase by phase for a solo-developer-friendly MVP.

## Current Phase

Phase 8 prep: Link-first payment-ready ordering, custom-domain foundation, Excel menu import, and public flow speed improvements.

Built so far:

- Next.js full-stack app with App Router, TypeScript, Tailwind CSS, and Prisma.
- PostgreSQL schema for multi-tenant restaurants, users, staff, menu, orders, payments, coupons, SaaS billing, WhatsApp simulator logs, and future modules.
- Simple email/password login with signed HTTP-only cookie sessions.
- Role-based route guards for Super Admin, Restaurant Owner, and Staff.
- Seeded demo restaurant: Mewad Bites Demo Restaurant.
- Basic route skeletons for Super Admin, Owner, Staff, and public customer menu.
- Docker Compose file for local PostgreSQL.
- Super Admin restaurants page to create and manage restaurant tenants.
- Restaurant detail page with editable profile, trial, billing, delivery, and payment settings.
- Quick controls for status changes, trial extension, and mark-paid/reactivation.
- Audit log viewer for important SaaS owner actions.
- Owner menu manager for category CRUD and menu item CRUD.
- Menu item image URL support for original restaurant photos or demo food images.
- Availability, veg/non-veg/egg, popular, recommended, description, price, and sort controls.
- Public menu now reflects owner-managed menu data, image URLs, and open/closed status.
- Restaurant logo and theme color controls from Super Admin restaurant settings.
- Public menu applies each restaurant's logo, primary color, accent color, and background color.
- Menu images use lazy loading to keep the public menu lighter.
- Public menu add-to-cart flow.
- Session-based customer cart without customer login.
- Cart quantity update, item remove, coupon apply/remove.
- Checkout for delivery, pickup, and dine-in.
- COD and mock UPI QR payment modes.
- Order creation with customer, order items, payment record, status history, and platform fee ledger.
- Order confirmation and tracking pages.
- Owner live orders page with accept/reject/preparing/ready/out-for-delivery/delivered/cancelled actions.
- Staff live orders page for restaurant staff.
- Mock UPI payment verification from the order dashboard.
- Customer tracking pages update from the latest saved order status.
- Owner/staff dashboards now separate live orders from delivered orders.
- Owner/staff dashboards auto-refresh every 10 seconds.
- Customer tracking page auto-refreshes every 10 seconds.
- Browser notifications can alert owner/staff when a new order arrives if permission is allowed.
- Public WhatsApp simulator for `Hi`, menu link, order tracking, call/chat, and offers flow.
- Super Admin WhatsApp logs page for simulator messages.
- Account security page for password change.
- Owner/staff support request flow to Super Admin support inbox.
- Restaurant-prefixed readable order IDs like `ME-1002`.
- Back-to-admin navigation from Super Admin restaurant context pages.
- Central subscription enforcement helper for trial, past due, suspended, and inactive states.
- Super Admin bulk refresh for trial/subscription status sync.
- Restaurant detail page refresh action for one-click status sync.
- Owner and staff dashboard warnings for trial countdown, past due, and suspension states.
- Public menu, cart, checkout, and WhatsApp simulator now block ordering for suspended or inactive restaurants based on enforced subscription state.
- Dynamic per-order UPI payment links and QR codes on customer confirmation and tracking pages.
- Payment link mode added alongside COD and dynamic UPI QR.
- Prepaid-first checkout now defaults to dynamic UPI QR when available.
- Admin support replies now flow back to owner and staff dashboards.
- Restaurant records can now store an optional custom domain plus verification state.
- Platform links stay slug-based today, while custom-domain mapping is now ready for premium setup later.
- App home can detect a verified custom domain host and route that restaurant toward its public menu foundation flow.
- Owner menu manager supports Excel/CSV bulk upload for full-menu onboarding.
- Super Admin restaurant detail page also supports Excel/CSV bulk menu upload.
- Downloadable `.xlsx` and `.csv` templates are available for one-shot restaurant menu setup.
- Public menu add-to-cart now updates cart count and total live without a full page refresh.
- Cart page quantity changes, remove actions, and coupon changes now update live without a full page refresh.
- Public menu no longer fetches recent-order history during first load, which keeps trial/demo browsing lighter.
- Login, menu, cart, checkout, admin, owner, and staff routes now show explicit loading or pending feedback instead of blank waiting states.
- Signed session cookies now carry the basic user and restaurant context needed for role guards, which removes an extra database lookup from protected page loads after login.

## Recommended Stack

- Frontend and backend: Next.js full-stack
- UI: React + Tailwind CSS
- Database: PostgreSQL
- ORM: Prisma
- Auth: email/password with role-based access
- Payments in MVP: mock COD and mock UPI QR later
- WhatsApp in MVP: simulator later
- Deployment later: Railway, Render, VPS, or similar low-cost host

This stack keeps the MVP in one codebase, which is easier for a solo developer to understand, debug, and deploy.

## Demo Defaults

Restaurant:

- Name: Mewad Bites Demo Restaurant
- Slug: `mewad-bites`
- City: Bhilwara, Rajasthan
- Currency: INR
- Trial: 30 days
- Grace period: 5 days
- Plan: Starter
- Monthly subscription: ₹999
- Per-order fee: ₹5 enabled for demo ledger support
- Delivery: enabled
- Pickup: enabled
- Dine-in: enabled
- COD: enabled
- Mock UPI QR: enabled with placeholder UPI ID `demo@upi`

Seed logins:

- Super Admin: `admin@restrowa.local` / `Admin@12345`
- Restaurant Owner: `owner@mewadbites.local` / `Owner@12345`
- Staff: `staff@mewadbites.local` / `Staff@12345`
- Oldays Cafe Owner: `owner@oldays.local` / `Owner@12345`
- Oldays Cafe Staff: `staff@oldays.local` / `Staff@12345`
- Bella Roma Owner: `owner@bellaroma.local` / `Owner@12345`
- Bella Roma Staff: `staff@bellaroma.local` / `Staff@12345`
- Dragon Wok Owner: `owner@dragonwok.local` / `Owner@12345`
- Dragon Wok Staff: `staff@dragonwok.local` / `Staff@12345`

Demo public menus:

- Mewad Bites: `http://localhost:3000/menu/mewad-bites`
- Oldays Cafe: `http://localhost:3000/menu/new-demo-olddays`
- Bella Roma Italian Kitchen: `http://localhost:3000/menu/bella-roma`
- Dragon Wok Chinese: `http://localhost:3000/menu/dragon-wok`

## Setup Commands

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
copy .env.example .env
```

Start PostgreSQL with Docker:

```bash
docker compose up -d
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migration:

```bash
npm run prisma:migrate -- --name phase_1_init
```

Seed demo data:

```bash
npm run db:seed
```

Import a ready menu JSON file:

```bash
npm run menu:import -- menu-imports/example-menu-import.json
```

Generate fresh Excel and CSV menu templates:

```bash
npm run menu:template
```

Start development server:

```bash
npm run dev
```

Open:

- App home: `http://localhost:3000`
- Login: `http://localhost:3000/login`
- Public menu: `http://localhost:3000/menu/mewad-bites`
- Super Admin: `http://localhost:3000/admin`
- Restaurant management: `http://localhost:3000/admin/restaurants`
- Audit logs: `http://localhost:3000/admin/audit-logs`
- Support inbox: `http://localhost:3000/admin/support`
- Account security: `http://localhost:3000/account/security`
- Owner menu manager: `http://localhost:3000/owner/menu`
- Menu import template: `http://localhost:3000/templates/restrowa-menu-template.xlsx`
- Owner orders: `http://localhost:3000/owner/orders`
- Staff orders: `http://localhost:3000/staff`
- Cart example: `http://localhost:3000/menu/mewad-bites/cart`
- Checkout example: `http://localhost:3000/menu/mewad-bites/checkout`

## Test Checklist

- Open `/` and confirm RestroWA OS landing page loads.
- Open `/menu/mewad-bites` and confirm Mewad Bites menu appears.
- Login as Super Admin and confirm `/admin` opens.
- Login as Restaurant Owner and confirm `/owner` opens.
- Login as Staff and confirm `/staff` opens.
- Try opening `/admin` as Staff and confirm access is blocked.
- Login as Super Admin and open `/admin/restaurants`.
- Create a test restaurant with a unique slug and owner email.
- Open the created restaurant detail page and change its status.
- Extend trial by 7 days and confirm the trial date updates.
- Mark payment as paid and confirm status becomes active.
- Open `/admin/audit-logs` and confirm the actions were logged.
- Login as Owner and open `/owner/menu`.
- Create a category and confirm it appears in the manager.
- Add a menu item with an image URL and confirm it appears on `/menu/mewad-bites`.
- Edit item price, description, veg type, popular/recommended flags, and image URL.
- Toggle an item unavailable and confirm it disappears from the public menu.
- Delete a test item.
- In Super Admin restaurant detail, set Logo URL and theme colors.
- Confirm `/menu/mewad-bites` uses the restaurant logo/colors.
- Add an item from public menu and confirm cart count updates.
- Add an item from public menu and confirm the cart summary updates live without a full page refresh.
- Open cart, update quantity, remove item, and apply coupon `DEMO10` without a full page refresh.
- Continue to checkout.
- Place a delivery order with COD.
- Place another order with mock UPI QR and confirm payment status is pending verification.
- Place an order with payment link and confirm the confirmation page shows a dynamic UPI app link plus QR for the exact amount.
- Open confirmation page and tracking page.
- Confirm pending UPI/payment-link orders show the same payment link again on tracking page.
- Open `/owner/orders` and accept the order.
- Wait up to 10 seconds or refresh the customer tracking page and confirm the status changed.
- Move the order through preparing, ready, out for delivery, and delivered.
- For UPI QR order, click Verify payment and confirm payment becomes paid.
- Login as each demo restaurant owner/staff and confirm they only see their own restaurant orders.
- Confirm live orders remain in the live queue and delivered orders move to the delivered section.
- Open `/whatsapp-simulator/mewad-bites`, send `Hi`, then test `1`, `2`, `3`, and `4`.
- Open `/admin/whatsapp-logs` and confirm simulator messages are stored.
- Create a new restaurant from `/admin/restaurants` and note the owner login.
- Login with that owner login and confirm the dashboard opens only for that restaurant.
- Open `/account/security` and change the owner password.
- From owner or staff dashboard, send a support request.
- Open `/admin/support` and confirm the support alert appears.
- Resolve a support ticket with an admin reply and confirm the reply appears back on the same owner/staff dashboard.
- From `/admin/restaurants`, open Owner, Staff, and Public views and confirm `Back to admin` is available.
- Place a new order and confirm the order ID uses a restaurant prefix like `ME-1002`.
- Confirm each owner/staff login only sees that restaurant's own orders.
- From `/admin`, click `Refresh all statuses` and confirm success message appears.
- On any restaurant detail page, click `Refresh subscription status` and confirm trial/past due/suspended state syncs correctly.
- Set a test restaurant trial end date in the past with dues pending, refresh status, and confirm it becomes `past_due` or `suspended` based on grace period.
- Open owner/staff dashboards for a past-due or suspended restaurant and confirm the warning banner appears.
- Open public menu/cart/checkout for a suspended restaurant and confirm checkout is blocked.
- Open `/whatsapp-simulator/[slug]` for a suspended restaurant and confirm it replies that ordering is unavailable.
- Open any restaurant detail page in `/admin/restaurants/[id]` and confirm platform link plus custom-domain status are shown.
- Save a custom domain like `order.demo-restaurant.com` from the admin restaurant form and confirm it persists after reload.
- Open `/owner/menu` and import the downloadable Excel template.
- Open `/admin/restaurants/[id]` and test the same menu import from Super Admin side.
- Test on mobile width using browser dev tools.
- Confirm there are no console errors.

## Known Limitations

- Trial/subscription sync is manual from Super Admin right now; a real scheduled background job is not added yet.
- Dynamic UPI links and QR are generated locally, but payment success is still manually verified in MVP.
- Existing owner password reset/staff creation from Super Admin is not built yet.
- Custom-domain foundation is stored and surfaced in admin now, but full root-level white-label public routing for cart/checkout still comes in a later phase.
- Excel import currently expects the RestroWA template columns. Flexible column-mapping comes later.
- Image upload/storage is not built yet; use restaurant-provided image URLs or demo image URLs for now.
- External demo image URLs can feel slower than locally optimized uploaded images. Real image upload/optimization comes later.
- UPI QR is still a mock placeholder; real payment gateway comes later.
- Real-time websocket push is not built yet; customer should refresh tracking to see the latest status.
- WhatsApp simulator is internal/mock only right now; real Meta/BSP webhook integration is still later.
- Owner password-change recommendation is set for new admin-created owner accounts, not for older seeded demo accounts.
- Vercel free plus remote managed Postgres can still feel slower than same-region app+database hosting during trial traffic. The public flow now avoids full refresh on add-to-cart, but hosting latency can still affect overall responsiveness.

## What To Send Next

When you are ready for Phase 2 or data cleanup, send:

- Final demo restaurant address, phone, WhatsApp number, and timings.
- Final menu categories and 10-20 item names/prices.
- Delivery charge, free delivery threshold, and minimum order amount.
- Final pricing choice for Starter plan and per-order fee.
- Whether you want the first client demo to look more like a cafe, thali restaurant, or cloud kitchen.

## Demo Data Needed Later

You can change restaurant names and menus later from the dashboard as we build those screens.

Recommended data to arrange:

- For current Phase 2 testing: 1 restaurant is enough.
- For Phase 3 and Phase 4 testing: 3 restaurant profiles are ideal.
- For sales/demo polish: 5-10 restaurant profiles are useful.

For each restaurant profile, collect:

- Restaurant name, address, phone, WhatsApp number, opening/closing time, and slug.
- 4-6 menu categories.
- 10-20 menu items with price, veg/non-veg, short description, and availability.
- Optional image URL or original item photo for each important item.
- Delivery charge, free delivery threshold, minimum order amount, COD/UPI settings.

Bulk menu import notes:

- Current supported path: prepare JSON using `menu-imports/example-menu-import.json`, then import with `npm run menu:import -- <file>`.
- Current dashboard path: Super Admin and Owner can upload `.xlsx`, `.xls`, or `.csv` using the fixed RestroWA template.
- Template files are available in `public/templates/` and `menu-imports/`.
- Future dashboard path: preview, field mapping, and smarter validation before publish.
- Future PDF/photo/DOC path: extract text using OCR/AI, convert to the same JSON format, manually review, then import.
- Image links are manual for now; later we will add restaurant image folders and Cloudinary/Supabase-style image selection.
