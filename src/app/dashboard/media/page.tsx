import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

      <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
        <MediaLibrary
          media={mediaItems}
          maxUploadBytes={getMaxUploadBytes()}
          searchQuery={searchQuery}
        />
      </div>
    </main>
  );
}
