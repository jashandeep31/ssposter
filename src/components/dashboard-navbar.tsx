"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Posts", href: "/dashboard/posts" },
  { label: "Media", href: "/dashboard/media" },
  { label: "Accounts", href: "/dashboard/accounts" },
];

export function DashboardNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-emerald-100 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-[1320px] flex-col px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3 sm:flex-1 sm:justify-start sm:gap-5">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2"
            aria-label="ssposter home"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white">
              ss
            </span>
            <span className="truncate text-lg font-semibold">ssposter</span>
          </Link>

          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-zinc-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20 sm:hidden"
            aria-controls="dashboard-mobile-menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>

          <nav
            className="hidden min-w-0 items-center gap-1 text-sm font-medium sm:flex sm:shrink-0"
            aria-label="Dashboard navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex h-9 items-center rounded-lg px-3 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-muted dark:hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <SignOutButton />
        </div>

        {isMenuOpen ? (
          <div id="dashboard-mobile-menu" className="mt-3 space-y-3 sm:hidden">
            <nav
              className="grid gap-1 rounded-lg border border-emerald-100 bg-emerald-50/60 p-1 text-sm font-medium"
              aria-label="Dashboard navigation"
            >
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex h-10 items-center rounded-md px-3 text-zinc-700 transition-colors hover:bg-white hover:text-zinc-950"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center justify-between gap-2">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
