import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const displayName =
    session.user.name || session.user.email || "there";

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-4 border-b border-emerald-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="ssposter home">
            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white">
              ss
            </span>
            <span className="text-lg font-semibold">ssposter</span>
          </Link>
          <SignOutButton />
        </header>

        <section className="py-12">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Welcome, {displayName}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            Your scheduled posts will appear here.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30"
          >
            Back to homepage
          </Link>
        </section>
      </div>
    </main>
  );
}
