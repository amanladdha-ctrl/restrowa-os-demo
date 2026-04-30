import { loginAction } from "@/app/login/actions";

const errorMessages: Record<string, string> = {
  missing: "Email and password are required.",
  invalid: "Invalid email or password."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-soft lg:grid-cols-[1fr_0.9fr]">
        <div className="bg-ink p-8 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-saffron">
            RestroWA OS
          </p>
          <h1 className="mt-8 text-4xl font-black leading-tight">
            WhatsApp-first ordering, built one calm phase at a time.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-orange-50/80">
            Phase 1 gives us login, role routing, multi-tenant schema, and demo
            data. The order flow comes next, once this foundation is solid.
          </p>
          <div className="mt-8 rounded-3xl bg-white/10 p-5 text-sm leading-7">
            <p className="font-bold text-saffron">Seed logins</p>
            <p>Super Admin: admin@restrowa.local / Admin@12345</p>
            <p>Owner: owner@mewadbites.local / Owner@12345</p>
            <p>Staff: staff@mewadbites.local / Staff@12345</p>
          </div>
        </div>

        <form action={loginAction} className="p-8 sm:p-10">
          <h2 className="text-2xl font-black text-ink">Login</h2>
          <p className="mt-2 text-sm text-slate-600">
            Use one of the seeded demo accounts after running the database seed.
          </p>

          {error ? (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <label className="mt-6 block text-sm font-bold text-ink" htmlFor="email">
            Email
          </label>
          <input
            className="focus-ring mt-2 w-full rounded-2xl border border-orange-100 bg-cream px-4 py-3"
            id="email"
            name="email"
            placeholder="admin@restrowa.local"
            type="email"
          />

          <label
            className="mt-5 block text-sm font-bold text-ink"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="focus-ring mt-2 w-full rounded-2xl border border-orange-100 bg-cream px-4 py-3"
            id="password"
            name="password"
            placeholder="Admin@12345"
            type="password"
          />

          <button className="focus-ring mt-7 w-full rounded-2xl bg-saffron px-5 py-3 font-black text-white transition hover:bg-clay">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
