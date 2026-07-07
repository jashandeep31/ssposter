import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Media", href: "/dashboard/media" },
];

export function DashboardNavbar() {
  return (
    <header className="border-b border-emerald-100 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:gap-5">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2"
            aria-label="ssposter home"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white">
              ss
            </span>
            <span className="truncate text-lg font-semibold">ssposter</span>
          </Link>

          <nav
            className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm font-medium sm:shrink-0"
            aria-label="Dashboard navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex h-9 items-center rounded-lg px-3 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <SignOutButton />
      </div>
    </header>
  );
}
