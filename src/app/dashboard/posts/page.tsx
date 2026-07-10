import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Send,
} from "lucide-react";

import { DashboardNavbar } from "@/components/dashboard-navbar";
import { RetryPostPublishButton } from "@/components/retry-post-publish-button";
import { db, schema } from "@/db";
import { getRequiredSession } from "@/lib/session";

const pageSize = 25;
const postStatuses = ["draft", "scheduled", "published", "partial", "failed"] as const;

type PostsPageProps = {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function getPostTitle(content: string) {
  const firstLine = content.trim().split("\n")[0] || "Untitled post";

  return firstLine.length > 100 ? `${firstLine.slice(0, 97)}...` : firstLine;
}

function statusClass(status: string) {
  if (status === "published") {
    return "border-emerald-100 bg-emerald-50 text-emerald-800";
  }

  if (status === "failed") {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (status === "partial") {
    return "border-amber-100 bg-amber-50 text-amber-800";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function accountLabel(target: {
  accountDisplayName: string | null;
  accountUsername: string | null;
  connectedAccount: { displayName: string | null; username: string | null } | null;
  platform: string;
}) {
  return (
    target.accountDisplayName ??
    target.connectedAccount?.displayName ??
    target.accountUsername ??
    target.connectedAccount?.username ??
    `${target.platform} account`
  );
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const session = await getRequiredSession();
  const { page: pageParam, status: statusParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const status = postStatuses.find((item) => item === statusParam);
  const where = status
    ? and(eq(schema.post.userId, session.user.id), eq(schema.post.status, status))
    : eq(schema.post.userId, session.user.id);
  const [posts, statusCounts] = await Promise.all([
    db.query.post.findMany({
      where,
      orderBy: (post, { desc: rowDesc }) => [rowDesc(post.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      with: {
        media: true,
        publishes: {
          with: {
            connectedAccount: true,
            attempts: true,
          },
        },
      },
    }),
    db
      .select({ status: schema.post.status, total: count() })
      .from(schema.post)
      .where(eq(schema.post.userId, session.user.id))
      .groupBy(schema.post.status),
  ]);
  const totals = Object.fromEntries(statusCounts.map((item) => [item.status, item.total]));
  const totalPosts = statusCounts.reduce((total, item) => total + item.total, 0);
  const queryFor = (nextStatus?: string, nextPage = 1) => {
    const params = new URLSearchParams();

    if (nextStatus) {
      params.set("status", nextStatus);
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }

    const query = params.toString();
    return query ? `/dashboard/posts?${query}` : "/dashboard/posts";
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <DashboardNavbar />
      <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 sm:p-6">
          <p className="text-sm font-semibold uppercase text-emerald-700">Publishing</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">All posts</h1>
              <p className="mt-2 text-sm text-zinc-600">
                Review every publishing target, its delivery attempts, and retry eligible failures.
              </p>
            </div>
            <Link
              href="/dashboard#compose"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Create post
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["All", undefined, totalPosts],
              ["Scheduled", "scheduled", totals.scheduled ?? 0],
              ["Published", "published", totals.published ?? 0],
              ["Partial", "partial", totals.partial ?? 0],
              ["Failed", "failed", totals.failed ?? 0],
            ].map(([label, value, total]) => (
              <Link
                key={label as string}
                href={queryFor(value as string | undefined)}
                className={`rounded-lg border px-4 py-3 transition-colors ${
                  status === value || (!status && !value)
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-emerald-100 hover:bg-zinc-50"
                }`}
              >
                <span className="block text-sm text-zinc-600">{label as string}</span>
                <span className="mt-1 block text-2xl font-semibold">{total as number}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {posts.map((post) => {
            const targets = [...post.publishes].sort(
              (left, right) => right.publishVersion - left.publishVersion,
            );
            const publishedTargets = targets.filter(
              (target) => target.status === "published",
            ).length;

            return (
              <article key={post.id} className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(post.status)}`}>
                        {post.status}
                      </span>
                      <span className="text-xs text-zinc-500">Created {formatDate(post.createdAt)}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold">{getPostTitle(post.content)}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{post.content}</p>
                  </div>
                  <dl className="grid shrink-0 gap-3 text-sm sm:grid-cols-3 lg:w-[390px]">
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <dt className="text-zinc-500">Schedule</dt>
                      <dd className="mt-1 font-medium">{formatDate(post.publishAt)}</dd>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <dt className="text-zinc-500">Published</dt>
                      <dd className="mt-1 font-medium">{formatDate(post.publishedAt)}</dd>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <dt className="text-zinc-500">Targets</dt>
                      <dd className="mt-1 font-medium">{publishedTargets}/{targets.length} published</dd>
                    </div>
                  </dl>
                </div>

                {post.lastPublishError ? (
                  <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {post.lastPublishError}
                  </p>
                ) : null}

                <div className="mt-5 border-t border-emerald-100 pt-5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Send className="size-4 text-emerald-700" aria-hidden="true" />
                    Publishing targets
                  </div>
                  {targets.length > 0 ? (
                    <div className="mt-3 divide-y divide-emerald-100 rounded-lg border border-emerald-100">
                      {targets.map((target) => {
                        const retryable =
                          target.status === "failed" &&
                          target.publishVersion === post.publishVersion &&
                          target.connectedAccount?.status === "active";
                        const attempts = [...target.attempts].sort(
                          (left, right) => right.attempt - left.attempt,
                        );

                        return (
                          <details key={target.id} className="group p-4">
                            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {target.status === "published" ? (
                                  <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
                                ) : (
                                  <Clock3 className="size-5 text-zinc-500" aria-hidden="true" />
                                )}
                                <div>
                                  <p className="font-medium">{accountLabel(target)}</p>
                                  <p className="mt-0.5 text-xs text-zinc-500">
                                    {target.platform} · version {target.publishVersion} · {target.attempts} attempts
                                  </p>
                                </div>
                              </div>
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(target.status)}`}>
                                {target.status}
                              </span>
                            </summary>
                            <div className="mt-4 grid gap-3 border-t border-emerald-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                              <p><span className="text-zinc-500">Queued:</span> {formatDate(target.queuedAt)}</p>
                              <p><span className="text-zinc-500">Last attempt:</span> {formatDate(target.lastAttemptAt)}</p>
                              <p><span className="text-zinc-500">Published:</span> {formatDate(target.publishedAt)}</p>
                              <p className="break-all"><span className="text-zinc-500">Provider ID:</span> {target.providerPostId ?? "Not available"}</p>
                            </div>
                            {target.error ? <p className="mt-3 text-sm text-red-700">{target.error}</p> : null}
                            {retryable ? <div className="mt-4"><RetryPostPublishButton postPublishId={target.id} /></div> : null}
                            {attempts.length > 0 ? (
                              <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm">
                                <p className="font-medium">Attempt history</p>
                                <div className="mt-2 space-y-2">
                                  {attempts.map((attempt) => (
                                    <p key={attempt.id} className="text-zinc-600">
                                      #{attempt.attempt} · {attempt.status} · {formatDate(attempt.startedAt)}
                                      {attempt.error ? ` · ${attempt.error}` : ""}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </details>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">No publishing targets were created for this draft.</p>
                  )}
                </div>
              </article>
            );
          })}
          {posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
              <FileText className="mx-auto size-8 text-emerald-700" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-semibold">No posts found</h2>
              <p className="mt-2 text-sm text-zinc-600">Create a post or choose another status filter.</p>
            </div>
          ) : null}
        </section>

        <nav className="mt-6 flex items-center justify-between" aria-label="Posts pagination">
          {page > 1 ? (
            <Link href={queryFor(status, page - 1)} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <ChevronLeft className="size-4" aria-hidden="true" /> Previous
            </Link>
          ) : <span />}
          {posts.length === pageSize ? (
            <Link href={queryFor(status, page + 1)} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              Next <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </nav>
      </div>
    </main>
  );
}
