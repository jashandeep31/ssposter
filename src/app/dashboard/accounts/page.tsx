import Link from "next/link";
import { AlertCircle, CheckCircle2, Link2, Plus, UserRound } from "lucide-react";

import { DashboardNavbar } from "@/components/dashboard-navbar";
import { DeleteConnectedAccountButton } from "@/components/delete-connected-account-button";
import { db } from "@/db";
import { connectedAccountPlatforms } from "@/lib/connected-accounts";
import { getRequiredSession } from "@/lib/session";
import { socialProviders } from "@/lib/social-providers";

type AccountsPageProps = {
  searchParams: Promise<{
    connected?: string;
    error?: string;
  }>;
};

function formatExpiry(value: Date | null) {
  if (!value) {
    return "No expiry reported";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  const messages: Record<string, string> = {
    "connect-failed": "Could not connect that account. Check provider credentials and try again.",
    "invalid-oauth-state": "The connection session expired. Start the connection again.",
    "unsupported-platform": "That publishing platform is not supported yet.",
  };

  return messages[error] ?? "Could not complete that account action.";
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const session = await getRequiredSession();
  const { connected, error } = await searchParams;
  const accounts = await db.query.connectedAccount.findMany({
    where: (connectedAccount, { eq }) =>
      eq(connectedAccount.userId, session.user.id),
    orderBy: (connectedAccount, { asc }) => [
      asc(connectedAccount.platform),
      asc(connectedAccount.createdAt),
    ],
  });
  const errorMessage = getErrorMessage(error);
  const connectedProvider = connectedAccountPlatforms.find(
    (platform) => platform === connected,
  );

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <DashboardNavbar />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase text-emerald-700">
                Accounts
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Publishing accounts
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Connect the X and LinkedIn accounts that ssposter can publish to.
                Tokens are stored encrypted and scoped to your user account.
              </p>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap lg:justify-end">
              {connectedAccountPlatforms.map((platform) => (
                <Link
                  key={platform}
                  href={`/api/accounts/${platform}/connect`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Connect {socialProviders[platform].label}
                </Link>
              ))}
            </div>
          </div>

          {connectedProvider ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Connected {socialProviders[connectedProvider].label}.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <AlertCircle className="size-4" aria-hidden="true" />
              {errorMessage}
            </p>
          ) : null}
        </section>

        {accounts.length > 0 ? (
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {accounts.map((account) => {
              const platform = connectedAccountPlatforms.find(
                (item) => item === account.platform,
              );
              const platformLabel = platform
                ? socialProviders[platform].label
                : account.platform;
              const accountLabel =
                account.displayName || account.username || platformLabel;
              return (
                <article
                  key={account.id}
                  className="min-w-0 rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-semibold text-emerald-800">
                        {platform === "x" ? "X" : "in"}
                      </div>
                      <div className="min-w-0">
                        <h2 className="break-all text-base font-semibold text-zinc-950 sm:truncate">
                          {accountLabel}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                          {platformLabel}
                          {account.username ? ` · @${account.username}` : ""}
                        </p>
                      </div>
                    </div>
                    {account.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Provider avatars are remote OAuth profile URLs.
                      <img
                        src={account.avatarUrl}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserRound className="size-5 shrink-0 text-zinc-400" aria-hidden="true" />
                    )}
                  </div>

                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <dt className="text-zinc-500">Status</dt>
                      <dd className="mt-1 font-medium capitalize text-zinc-950">
                        {account.status}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <dt className="text-zinc-500">Token expiry</dt>
                      <dd className="mt-1 font-medium text-zinc-950">
                        {formatExpiry(account.accessTokenExpiresAt)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-3 sm:col-span-2">
                      <dt className="text-zinc-500">Provider account ID</dt>
                      <dd className="mt-1 break-all font-mono text-xs text-zinc-700">
                        {account.providerAccountId}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 border-t border-emerald-100 pt-4">
                    <DeleteConnectedAccountButton
                      accountId={account.id}
                      accountLabel={accountLabel}
                    />
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="mt-6 rounded-lg border border-dashed border-emerald-200 bg-white p-8 text-center shadow-sm shadow-emerald-950/5">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Link2 className="size-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No accounts connected</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
              Connect X or LinkedIn before scheduling posts for automatic
              publishing.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
