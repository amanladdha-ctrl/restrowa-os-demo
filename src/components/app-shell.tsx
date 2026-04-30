import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
};

export function AppShell({
  title,
  subtitle,
  navItems,
  children
}: {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay">
                RestroWA OS
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            </div>
            <form action="/logout" method="post">
              <button className="focus-ring rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-clay">
                Logout
              </button>
            </form>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                className="rounded-full border border-orange-100 bg-cream px-4 py-2 text-sm font-semibold text-clay transition hover:bg-saffron hover:text-white"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
