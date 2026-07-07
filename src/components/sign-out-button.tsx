"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20 disabled:pointer-events-none disabled:opacity-60"
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
