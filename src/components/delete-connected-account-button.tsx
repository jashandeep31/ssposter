"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteConnectedAccount } from "@/app/dashboard/accounts/actions";

type DeleteConnectedAccountButtonProps = {
  accountId: string;
  accountLabel: string;
};

export function DeleteConnectedAccountButton({
  accountId,
  accountLabel,
}: DeleteConnectedAccountButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setMessage(null);

    startTransition(async () => {
      const result = await deleteConnectedAccount(accountId);

      if (!result.ok) {
        setMessage(result.error);
        setIsConfirming(false);
      }
    });
  }

  if (isConfirming) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">
          Remove {accountLabel} from publishing accounts?
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-600/30 disabled:pointer-events-none disabled:opacity-60"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {isPending ? "Removing..." : "Remove"}
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20"
            onClick={() => setIsConfirming(false)}
            disabled={isPending}
          >
            Cancel
          </button>
        </div>
        {message ? <p className="text-xs text-red-700">{message}</p> : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-600/20"
      onClick={() => setIsConfirming(true)}
    >
      <Trash2 className="size-4" aria-hidden="true" />
      Delete
    </button>
  );
}
