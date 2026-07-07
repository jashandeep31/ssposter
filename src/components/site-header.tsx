"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Platforms", href: "#platforms" },
  { label: "FAQ", href: "#faq" },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6 lg:px-8">
        <a
          href="#"
          className="flex min-w-0 items-center gap-2"
          aria-label="ssposter home"
          onClick={closeMenu}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white">
            ss
          </span>
          <span className="truncate text-base font-semibold">ssposter</span>
        </a>

        <nav
          className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-emerald-700">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="#waitlist"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30"
          >
            Start scheduling
          </a>
        </div>

        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-900 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20 md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`border-t border-emerald-100 bg-white px-3 pb-4 pt-2 shadow-lg shadow-emerald-950/5 md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <nav className="mx-auto grid max-w-6xl gap-1" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#waitlist"
            className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30"
            onClick={closeMenu}
          >
            Start scheduling
          </a>
        </nav>
      </div>
    </header>
  );
}
