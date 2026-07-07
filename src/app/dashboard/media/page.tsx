import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";
import { and, desc, eq, ilike } from "drizzle-orm";

import { DashboardNavbar } from "@/components/dashboard-navbar";
import { MediaLibrary } from "@/components/media-library";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import { getMaxUploadBytes, getMediaFileName } from "@/lib/r2";

type MediaPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { q } = await searchParams;
  const searchQuery = (q ?? "").trim();
  const media = await db
    .select()
    .from(schema.userMedia)
    .where(
      searchQuery
        ? and(
            eq(schema.userMedia.userId, session.user.id),
            ilike(schema.userMedia.displayName, `%${searchQuery}%`),
          )
        : eq(schema.userMedia.userId, session.user.id),
    )
    .orderBy(desc(schema.userMedia.createdAt));
  const mediaItems = media.map((item) => ({
    id: item.id,
    displayName: item.displayName,
    fileName: getMediaFileName(item.mediaUrl),
    contentType: item.contentType,
    sizeBytes: item.sizeBytes,
    createdAt: new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(item.createdAt),
  }));

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <DashboardNavbar />

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="space-y-4">
          <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-semibold text-emerald-800">
                {(session.user.name || session.user.email || "SS")
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">
                  {session.user.name || session.user.email || "Media"}
                </h1>
                {session.user.email ? (
                  <p className="truncate text-sm text-zinc-500">
                    {session.user.email}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-zinc-50 p-3 text-sm">
              <p className="font-semibold text-zinc-950">{media.length}</p>
              <p className="mt-1 text-zinc-500">
                {searchQuery ? "Matching uploads" : "Private uploads"}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BriefcaseBusiness className="size-4 text-emerald-700" />
              Private by default
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              This library stores private object keys only. Viewing media
              creates a short-lived signed R2 link.
            </p>
          </section>
        </aside>

        <MediaLibrary
          media={mediaItems}
          maxUploadBytes={getMaxUploadBytes()}
          searchQuery={searchQuery}
        />
      </div>
    </main>
  );
}
