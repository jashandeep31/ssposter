"use client";

import { useState, useTransition } from "react";
import { RotateCw } from "lucide-react";

import { retryPostPublish } from "@/app/dashboard/posts/actions";

type RetryPostPublishButtonProps = {
  postPublishId: string;
};

export function RetryPostPublishButton({ postPublishId }: RetryPostPublishButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await retryPostPublish(postPublishId);

            if (!result.ok) {
              setError(result.error);
            }
          });
        }}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RotateCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} aria-hidden="true" />
        {isPending ? "Queuing" : "Retry"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
