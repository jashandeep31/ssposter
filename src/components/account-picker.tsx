"use client";

import Link from "next/link";
import { BriefcaseBusiness, Send, UserRound } from "lucide-react";

export type AccountPickerItem = {
  id: string;
  platform: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

type AccountPickerProps = {
  accounts: AccountPickerItem[];
  initialSelectedIds?: string[];
};

function getAccountLabel(account: AccountPickerItem) {
  if (account.displayName) {
    return account.displayName;
  }

  if (account.username) {
    return `@${account.username}`;
  }

  return account.platform === "x" ? "X account" : "LinkedIn account";
}

export function AccountPicker({
  accounts,
  initialSelectedIds = [],
}: AccountPickerProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-zinc-800">
        Publishing accounts
      </legend>
      {accounts.length > 0 ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {accounts.map((account) => {
            const label = getAccountLabel(account);
            const PlatformIcon = account.platform === "x" ? Send : BriefcaseBusiness;

            return (
              <label
                key={account.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-emerald-100 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-800"
              >
                <input
                  type="checkbox"
                  name="accountIds"
                  value={account.id}
                  defaultChecked={initialSelectedIds.includes(account.id)}
                  className="size-4 shrink-0 accent-emerald-600"
                />
                {account.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Provider avatars are remote OAuth profile URLs.
                  <img
                    src={account.avatarUrl}
                    alt=""
                    className="size-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <UserRound className="size-4" aria-hidden="true" />
                  </div>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{label}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-zinc-500">
                    <PlatformIcon className="size-3.5" aria-hidden="true" />
                    {account.platform === "x" ? "X" : "LinkedIn"}
                    {account.username ? ` · @${account.username}` : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 rounded-lg bg-zinc-50 px-4 py-5 text-sm text-zinc-600">
          Connect a publishing account from the{" "}
          <Link
            href="/dashboard/accounts"
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            accounts page
          </Link>{" "}
          before scheduling a post.
        </p>
      )}
    </fieldset>
  );
}
