import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">
          Access blocked
        </p>
        <h1 className="mt-3 text-3xl font-black text-ink">
          This login cannot open that area.
        </h1>
        <p className="mt-3 text-slate-600">
          Role-based routing is active from Phase 1 so restaurant data stays
          separated as we add real features.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
          href="/login"
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}
