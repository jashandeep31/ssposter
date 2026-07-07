import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarClock,
  Send,
  Upload,
} from "lucide-react";

import { createPost } from "@/app/dashboard/actions";
import { SignOutButton } from "@/components/sign-out-button";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getMediaFileName } from "@/lib/r2";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Media", href: "/dashboard/media" },
];

function formatPublishTime(value: Date | null) {
  if (!value) {
    return "Draft";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function getPostTitle(content: string) {
  const firstLine = content.trim().split("\n")[0];

  if (firstLine.length <= 64) {
    return firstLine;
  }

  return `${firstLine.slice(0, 61)}...`;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const displayName =
    session.user.name || session.user.email || "there";
  const email = session.user.email;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [allPosts, media] = await Promise.all([
    db.query.post.findMany({
      where: (post, { eq }) => eq(post.userId, session.user.id),
      orderBy: (post, { desc }) => [desc(post.createdAt)],
    }),
    db.query.userMedia.findMany({
      where: (userMedia, { eq }) => eq(userMedia.userId, session.user.id),
      orderBy: (userMedia, { desc }) => [desc(userMedia.createdAt)],
    }),
  ]);
  const posts = allPosts.slice(0, 5);
  const draftCount = allPosts.filter((post) => post.status === "draft").length;
  const scheduledCount = allPosts.filter(
    (post) => post.status === "scheduled",
  ).length;
  const recentMedia = media.slice(0, 3).map((item) => ({
    id: item.id,
    displayName: item.displayName,
    fileName: getMediaFileName(item.mediaUrl),
    createdAt: new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(item.createdAt),
  }));
  const mediaOptions = media.map((item) => ({
    id: item.id,
    displayName: item.displayName,
    fileName: getMediaFileName(item.mediaUrl),
  }));

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:gap-5">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2"
              aria-label="ssposter home"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white">
                ss
              </span>
              <span className="truncate text-lg font-semibold">ssposter</span>
            </Link>

            <nav
              className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm font-medium sm:shrink-0"
              aria-label="Dashboard navigation"
            >
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex h-9 items-center rounded-lg px-3 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <SignOutButton />
        </div>
      </header>

        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-semibold text-emerald-800">
                {initials || "SS"}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">{displayName}</h1>
                {email ? (
                  <p className="truncate text-sm text-zinc-500">{email}</p>
                ) : null}
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-zinc-50 p-3">
                <dt className="text-zinc-500">Drafts</dt>
                <dd className="mt-1 text-xl font-semibold">{draftCount}</dd>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <dt className="text-zinc-500">Scheduled</dt>
                <dd className="mt-1 text-xl font-semibold">{scheduledCount}</dd>
              </div>
            </dl>
          </section>

        </aside>

        <div className="min-w-0 space-y-6">
          <section id="compose" className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-700">
                  Compose
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Add a new post
                </h2>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                <CalendarClock className="size-4" aria-hidden="true" />
                Schedule-ready
              </span>
            </div>

            <form action={createPost} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="post-content"
                  className="text-sm font-medium text-zinc-800"
                >
                  Post content
                </label>
                <textarea
                  id="post-content"
                  name="content"
                  rows={9}
                  maxLength={2800}
                  required
                  placeholder="Write the post you want to publish..."
                  className="mt-2 min-h-48 w-full resize-y rounded-lg border border-emerald-100 bg-white px-3 py-3 text-sm leading-6 text-zinc-950 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-600/20"
                />
                <div className="mt-2 flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                  <p>Use line breaks for LinkedIn. Keep X posts concise.</p>
                  <p>2,800 character limit</p>
                </div>
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-zinc-800">
                  Platforms
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-emerald-100 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-800">
                    <input
                      type="checkbox"
                      name="platforms"
                      value="x"
                      defaultChecked
                      className="size-4 accent-emerald-600"
                    />
                    <Send className="size-4 text-emerald-700" aria-hidden="true" />
                    X
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-emerald-100 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-800">
                    <input
                      type="checkbox"
                      name="platforms"
                      value="linkedin"
                      className="size-4 accent-emerald-600"
                    />
                    <BriefcaseBusiness
                      className="size-4 text-emerald-700"
                      aria-hidden="true"
                    />
                    LinkedIn
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-zinc-800">
                  Media
                </legend>
                {mediaOptions.length > 0 ? (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {mediaOptions.map((item) => (
                      <label
                        key={item.id}
                        className="flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border border-emerald-100 bg-zinc-50 px-3 py-3 text-sm text-zinc-800"
                      >
                        <input
                          type="checkbox"
                          name="mediaIds"
                          value={item.id}
                          className="mt-0.5 size-4 shrink-0 accent-emerald-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {item.displayName}
                          </span>
                          <span className="mt-1 block truncate text-xs text-zinc-500">
                            {item.fileName}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-lg bg-zinc-50 px-4 py-5 text-sm text-zinc-600">
                    Upload media from the{" "}
                    <Link
                      href="/dashboard/media"
                      className="font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      media library
                    </Link>{" "}
                    before attaching it to a post.
                  </p>
                )}
                {mediaOptions.length > 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Select any number of uploaded media files to attach to this
                    post.
                  </p>
                ) : null}
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="publish-date"
                    className="text-sm font-medium text-zinc-800"
                  >
                    Publish date
                  </label>
                  <input
                    id="publish-date"
                    name="publishDate"
                    type="date"
                    className="mt-2 h-11 w-full rounded-lg border border-emerald-100 bg-white px-3 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-3 focus:ring-emerald-600/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="publish-time"
                    className="text-sm font-medium text-zinc-800"
                  >
                    Publish time
                  </label>
                  <input
                    id="publish-time"
                    name="publishTime"
                    type="time"
                    className="mt-2 h-11 w-full rounded-lg border border-emerald-100 bg-white px-3 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-3 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-emerald-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="submit"
                  name="intent"
                  value="draft"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20 sm:w-auto"
                >
                  Save draft
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="schedule"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30 sm:w-auto"
                >
                  <CalendarClock className="size-4" aria-hidden="true" />
                  Schedule post
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-700">
                  Media
                </p>
                <h2 className="mt-2 text-xl font-semibold">Private library</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {media.length} uploaded {media.length === 1 ? "file" : "files"}
                </p>
              </div>
              <Link
                href="/dashboard/media"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30"
              >
                <Upload className="size-4" aria-hidden="true" />
                Open library
              </Link>
            </div>
            {recentMedia.length > 0 ? (
              <div className="mt-5 divide-y divide-emerald-100">
                {recentMedia.map((item) => (
                  <article
                    key={item.id}
                    className="py-3 first:pt-0 last:pb-0"
                  >
                    <h3 className="truncate text-sm font-semibold">
                      {item.displayName}
                    </h3>
                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {item.fileName} · {item.createdAt}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-lg bg-zinc-50 px-4 py-5 text-sm text-zinc-600">
                Uploads will appear here after you add them to the media
                library.
              </p>
            )}
          </section>

          <section id="queue" className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-700">
                  Queue
                </p>
                <h2 className="mt-2 text-xl font-semibold">Upcoming posts</h2>
              </div>
              <Link
                href="/"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Home
              </Link>
            </div>
            {posts.length > 0 ? (
              <div className="mt-5 divide-y divide-emerald-100">
                {posts.map((post) => (
                <article
                  key={post.id}
                  className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-sm font-semibold">
                      {getPostTitle(post.content)}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {post.platforms
                        .split(",")
                        .map((platform) =>
                          platform === "x" ? "X" : "LinkedIn",
                        )
                        .join(" and ")}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-zinc-700">
                    {formatPublishTime(post.publishAt)}
                  </p>
                </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-lg bg-zinc-50 px-4 py-5 text-sm text-zinc-600">
                New drafts and scheduled posts will appear here after you add
                them from the composer.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
