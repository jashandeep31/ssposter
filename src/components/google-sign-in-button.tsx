"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function GoogleSignInButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleSignIn() {
    setIsPending(true);

    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      errorCallbackURL: "/login?error=google",
    });

    setIsPending(false);
  }

  return (
    <button
      type="button"
      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-emerald-200 bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20 disabled:pointer-events-none disabled:opacity-60"
      onClick={handleSignIn}
      disabled={isPending}
    >
      {isPending ? "Opening Google..." : "Continue with Google"}
    </button>
  );
}
