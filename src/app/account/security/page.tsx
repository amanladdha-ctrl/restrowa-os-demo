import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { adminNavItems } from "@/lib/admin-nav";
import { ownerNavItems } from "@/lib/owner-nav";
import { staffNavItems } from "@/lib/staff-nav";
import { changePasswordAction } from "./actions";

const errorMessages: Record<string, string> = {
  invalid_password: "Use at least 8 characters and match both new password fields.",
  wrong_current_password: "Current password does not match our records.",
  user_missing: "User record not found."
};

export default async function SecurityPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireRole([
    UserRole.SUPER_ADMIN,
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF
  ]);
  const query = await searchParams;

  const navItems =
    user.role === UserRole.SUPER_ADMIN
      ? adminNavItems
      : user.role === UserRole.RESTAURANT_OWNER
        ? ownerNavItems(user.restaurant?.slug ?? "mewad-bites")
        : staffNavItems(user.restaurant?.slug ?? "mewad-bites");

  const returnTo =
    user.role === UserRole.SUPER_ADMIN ? "/account/security" : "/account/security";

  return (
    <AppShell
      title="Account Security"
      subtitle="Update your login password any time. New owners can change their shared starter password from here."
      navItems={navItems}
    >
      {query.password_changed ? (
        <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          Password updated successfully.
        </div>
      ) : null}

      {query.error ? (
        <div className="rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {errorMessages[query.error] ?? "Something went wrong."}
        </div>
      ) : null}

      <section className="mx-auto w-full max-w-2xl rounded-[2rem] bg-white/90 p-6 shadow-soft">
        <h2 className="text-2xl font-black text-ink">Change password</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use this if you want a private password after the admin shares your first login.
        </p>

        <form action={changePasswordAction} className="mt-6 grid gap-4">
          <input name="returnTo" type="hidden" value={returnTo} />
          <label className="grid gap-2 text-sm font-bold text-ink">
            Current password
            <input
              className="rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              name="currentPassword"
              required
              type="password"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-ink">
            New password
            <input
              className="rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              minLength={8}
              name="newPassword"
              required
              type="password"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-ink">
            Confirm new password
            <input
              className="rounded-2xl border border-orange-100 bg-cream px-4 py-3 font-normal"
              minLength={8}
              name="confirmPassword"
              required
              type="password"
            />
          </label>

          <button className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white">
            Update password
          </button>
        </form>
      </section>
    </AppShell>
  );
}
