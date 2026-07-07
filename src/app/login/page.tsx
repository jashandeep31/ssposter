import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { auth } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50/70 px-4 py-12 text-zinc-950">
      <section className="w-full max-w-md rounded-lg border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/10 sm:p-8">
        <Link href="/" className="flex items-center gap-2" aria-label="ssposter home">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white">
            ss
          </span>
          <span className="text-lg font-semibold">ssposter</span>
        </Link>

        <div className="mt-8">
          <h1 className="text-3xl font-semibold">Sign in with Google</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Sign in to schedule X and LinkedIn posts.
          </p>
        </div>

        {error === "google" ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Google sign-in could not be completed. Try again.
          </p>
        ) : null}

        <div className="mt-6">
          <GoogleSignInButton />
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          Back to homepage
        </Link>
      </section>
    </main>
  );
}
