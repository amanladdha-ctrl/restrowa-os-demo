# TODO

## Phase 1

- [x] Create Next.js + TypeScript + Tailwind project skeleton.
- [x] Add Prisma PostgreSQL schema with multi-tenant restaurant models.
- [x] Add seeded demo restaurant, users, menu, coupon, plan, and subscription.
- [x] Add simple signed-cookie auth.
- [x] Add role-based route protection.
- [x] Add Super Admin, Owner, Staff, and public menu route skeletons.
- [x] Add README, TODO, CHANGELOG, `.env.example`, and Docker Compose.

## Phase 2: Super Admin MVP

- [x] Super Admin restaurant list.
- [x] Create restaurant form.
- [x] Edit restaurant details.
- [x] Create owner user during restaurant creation.
- [x] Assign plan, trial dates, status, subscription amount, and per-order fee.
- [x] Activate, suspend, mark past due, mark inactive, extend trial, and mark paid actions.
- [x] Audit log viewer.
- [ ] Add list filters/search.
- [ ] Add owner password reset.
- [ ] Add staff creation from Super Admin.

## Phase 3: Restaurant Menu Manager

- [x] Owner dashboard menu manager link.
- [x] Category CRUD.
- [x] Menu item CRUD.
- [x] Availability toggle.
- [x] Image URL support.
- [x] Popular/recommended flags.
- [x] Public menu image display.
- [x] Restaurant open/closed display.
- [x] Restaurant logo URL support.
- [x] Restaurant theme color support.
- [x] Lazy image loading for menu item photos.
- [x] Four seeded demo restaurant menus: Indian/Rajasthani, multi-cuisine cafe, Italian, Chinese.
- [x] JSON menu import script foundation.
- [ ] Real image upload/storage.
- [ ] Safer delete handling after orders exist.
- [ ] Drag-and-drop sorting.
- [ ] Image optimization/storage through Cloudinary or Supabase Storage.
- [ ] Dashboard bulk menu import with preview and validation.
- [ ] PDF/DOC/photo menu extraction pipeline.

## Phase 4: Customer Cart + Order Flow

- [x] Add to cart.
- [x] Quantity update and remove item.
- [x] Apply and remove coupon.
- [x] Delivery, pickup, and dine-in details.
- [x] Checkout summary.
- [x] COD and mock UPI QR.
- [x] Order creation.
- [x] Customer creation/update.
- [x] Payment record creation.
- [x] Order status history creation.
- [x] Platform per-order fee ledger creation.
- [x] Order confirmation and tracking page.
- [ ] Client-side cart drawer polish.
- [ ] Better QR image for mock UPI.
- [ ] Customer-friendly validation without full page redirects.

## Later Phases

- [x] Restaurant order dashboard and status updates.
- [x] Staff live order dashboard and status updates.
- [x] Customer recent order tracking links on public menu.
- [x] Payment verification button for mock UPI orders.
- [x] Status history and audit logs for order updates.
- [x] Preserve selected restaurant across owner/staff order actions.
- [x] Separate live and delivered order sections.
- [x] Auto-refresh customer tracking and kitchen dashboards.
- [x] WhatsApp simulator.
- [x] Super Admin WhatsApp logs page.
- [x] Owner password change option.
- [x] Support/help request button for owner and staff.
- [x] Super Admin support inbox.
- [x] Back-to-admin navigation for restaurant context switching.
- [x] Restaurant-prefixed readable order IDs.
- [x] Trial/subscription enforcement warnings and blocking.
- [x] Manual Super Admin subscription status refresh.
- [x] Dynamic UPI link and QR per order amount.
- [x] Support replies from admin back to owner/staff dashboards.
- [x] Custom-domain foundation fields and admin setup.
- [x] Excel/CSV bulk menu upload from owner and admin panels.
- [ ] Real-time sound alerts or websocket push notifications.
- [ ] Scheduled subscription status checker / cron job.
- [ ] Real auto payment verification via webhook/gateway.
- [ ] Full custom-domain white-label routing for menu, cart, checkout, and tracking.
- [ ] Flexible spreadsheet column mapping and import preview.
- [ ] Platform fee ledger and billing.
- [ ] Reports and basic CRM.
- [ ] Table booking module.
- [ ] Real WhatsApp Cloud API/BSP integration.
- [ ] Real payment gateway with webhook verification.
- [ ] Production deployment guide.
