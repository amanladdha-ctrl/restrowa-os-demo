type PageLoadingCardProps = {
  eyebrow?: string;
  title: string;
  body: string;
};

export function PageLoadingCard({
  eyebrow = "Loading",
  title,
  body
}: PageLoadingCardProps) {
  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-clay">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-black text-ink">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{body}</p>

        <div className="mt-6 grid gap-4">
          <div className="h-28 animate-pulse rounded-3xl bg-cream" />
          <div className="h-28 animate-pulse rounded-3xl bg-cream" />
          <div className="h-28 animate-pulse rounded-3xl bg-cream" />
        </div>
      </section>
    </main>
  );
}
