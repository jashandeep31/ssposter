"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import {
  isAllowedMediaContentType,
  isSupportedPlatform,
  validateMediaSelection,
} from "@/lib/media-guidelines";
import {
  createMediaObjectKey,
  createReadUrl,
  createUploadUrl,
  deleteMediaObject,
  getMaxUploadBytes,
  getUserMediaPrefix,
} from "@/lib/r2";
import { queuePostPublishTarget } from "@/lib/qstash";

type MediaActionResult<T> =
  | ({ ok: true } & T)
  | {
      ok: false;
      error: string;
    };

function sanitizeDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ");
}

async function getRequiredSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return session;
}

async function getSelectedAccounts(accountIds: string[], userId: string) {
  const uniqueAccountIds = Array.from(
    new Set(accountIds.map((accountId) => accountId.trim()).filter(Boolean)),
  );

  if (uniqueAccountIds.length === 0) {
    return null;
  }

  const accounts = await db.query.connectedAccount.findMany({
    where: (connectedAccount) =>
      and(
        inArray(connectedAccount.id, uniqueAccountIds),
        eq(connectedAccount.userId, userId),
        eq(connectedAccount.status, "active"),
      ),
  });

  if (
    accounts.length !== uniqueAccountIds.length ||
    !accounts.every((account) => isSupportedPlatform(account.platform))
  ) {
    return null;
  }

  return accounts;
}

async function queuePostPublishTargets({
  postId,
  publishVersion,
  publishAt,
  targetIds,
}: {
  postId: string;
  publishVersion: number;
  publishAt: Date;
  targetIds: string[];
}) {
  const results = await Promise.allSettled(
    targetIds.map(async (postPublishId) => {
      const { messageId } = await queuePostPublishTarget({
        postPublishId,
        publishVersion,
        publishAt,
      });

      await db
        .update(schema.postPublish)
        .set({ queuedAt: new Date(), qstashMessageId: messageId })
        .where(eq(schema.postPublish.id, postPublishId));
    }),
  );
  const failedResult = results.find((result) => result.status === "rejected");

  if (failedResult?.status === "rejected") {
    throw failedResult.reason;
  }

  await db
    .update(schema.post)
    .set({ queuedAt: new Date(), lastPublishError: null })
    .where(and(eq(schema.post.id, postId), eq(schema.post.publishVersion, publishVersion)));
}

export async function createPost(formData: FormData) {
  const session = await getRequiredSession();
  const content = String(formData.get("content") ?? "").trim();
  const selectedAccounts = await getSelectedAccounts(
    formData.getAll("accountIds").map(String),
    session.user.id,
  );
  const platforms = Array.from(
    new Set(selectedAccounts?.map((account) => account.platform).filter(isSupportedPlatform)),
  );
  const publishDate = String(formData.get("publishDate") ?? "");
  const publishTime = String(formData.get("publishTime") ?? "");
  const mediaIds = Array.from(
    new Set(
      formData
        .getAll("mediaIds")
        .map(String)
        .map((mediaId) => mediaId.trim())
        .filter(Boolean),
    ),
  );
  const intent = String(formData.get("intent") ?? "schedule");
  const publishAt =
    intent === "schedule" && publishDate && publishTime
      ? new Date(`${publishDate}T${publishTime}:00`)
      : null;
  const validPublishAt =
    publishAt && Number.isNaN(publishAt.getTime()) ? null : publishAt;
  const canSchedule = validPublishAt;

  if (!selectedAccounts || !content || content.length > 2800 || platforms.length === 0) {
    return;
  }

  if (intent === "schedule" && !canSchedule) {
    return;
  }

  const selectedMedia = mediaIds.length
    ? await db.query.userMedia.findMany({
        where: (userMedia) =>
          and(
            inArray(userMedia.id, mediaIds),
            eq(userMedia.userId, session.user.id),
          ),
      })
    : [];
  const mediaValidation = validateMediaSelection({
    platforms,
    media: selectedMedia.map((media) => ({
      id: media.id,
      contentType: media.contentType,
    })),
  });

  if (!mediaValidation.ok || selectedMedia.length !== mediaIds.length) {
    return;
  }

  const postId = crypto.randomUUID();
  const publishVersion = 1;
  const publishTargets =
    intent === "schedule"
      ? selectedAccounts.map((account) => ({ id: crypto.randomUUID(), account }))
      : [];

  await db.transaction(async (tx) => {
    await tx.insert(schema.post).values({
      id: postId,
      userId: session.user.id,
      content,
      platforms: platforms.join(","),
      publishAt: intent === "schedule" ? validPublishAt : null,
      publishVersion,
      status: intent === "schedule" ? "scheduled" : "draft",
    });

    if (selectedMedia.length > 0) {
      await tx.insert(schema.postMedia).values(
        selectedMedia.map((media) => ({
          postId,
          mediaId: media.id,
        })),
      );
    }

    if (intent === "schedule") {
      await tx.insert(schema.postPublish).values(
        publishTargets.map(({ id, account }) => ({
          id,
          postId,
          platform: account.platform,
          connectedAccountId: account.id,
          accountDisplayName: account.displayName,
          accountUsername: account.username,
          accountAvatarUrl: account.avatarUrl,
          publishVersion,
          status: "pending",
        })),
      );
    }
  });

  if (intent === "schedule") {
    try {
      await queuePostPublishTargets({
        postId,
        publishAt: validPublishAt as Date,
        publishVersion,
        targetIds: publishTargets.map((target) => target.id),
      });
    } catch (error) {
      console.error("Failed to queue scheduled post", error);
      await db
        .update(schema.postPublish)
        .set({
          status: "failed",
          error: "Could not queue scheduled publish job.",
        })
        .where(
          and(
            eq(schema.postPublish.postId, postId),
            eq(schema.postPublish.publishVersion, publishVersion),
            eq(schema.postPublish.status, "pending"),
          ),
        );
      await db
        .update(schema.post)
        .set({
          status: "failed",
          lastPublishError: "Could not queue scheduled publish job.",
        })
        .where(and(eq(schema.post.id, postId), eq(schema.post.userId, session.user.id)));
    }
  }

  revalidatePath("/dashboard");
}

export async function updatePost(postId: string, formData: FormData) {
  const session = await getRequiredSession();
  const post = await db.query.post.findFirst({
    where: (item) => and(eq(item.id, postId), eq(item.userId, session.user.id)),
  });

  if (!post || (post.status !== "draft" && post.status !== "scheduled")) {
    return;
  }

  const content = String(formData.get("content") ?? "").trim();
  const selectedAccounts = await getSelectedAccounts(
    formData.getAll("accountIds").map(String),
    session.user.id,
  );
  const platforms = Array.from(
    new Set(selectedAccounts?.map((account) => account.platform).filter(isSupportedPlatform)),
  );
  const publishDate = String(formData.get("publishDate") ?? "");
  const publishTime = String(formData.get("publishTime") ?? "");
  const mediaIds = Array.from(
    new Set(
      formData
        .getAll("mediaIds")
        .map(String)
        .map((mediaId) => mediaId.trim())
        .filter(Boolean),
    ),
  );
  const intent = String(formData.get("intent") ?? "schedule");
  const publishAt =
    intent === "schedule" && publishDate && publishTime
      ? new Date(`${publishDate}T${publishTime}:00`)
      : null;
  const validPublishAt =
    publishAt && Number.isNaN(publishAt.getTime()) ? null : publishAt;
  const canSchedule = validPublishAt;

  if (!selectedAccounts || !content || content.length > 2800 || platforms.length === 0) {
    return;
  }

  if (intent === "schedule" && !canSchedule) {
    return;
  }

  const selectedMedia = mediaIds.length
    ? await db.query.userMedia.findMany({
        where: (userMedia) =>
          and(
            inArray(userMedia.id, mediaIds),
            eq(userMedia.userId, session.user.id),
          ),
      })
    : [];
  const mediaValidation = validateMediaSelection({
    platforms,
    media: selectedMedia.map((media) => ({
      id: media.id,
      contentType: media.contentType,
    })),
  });

  if (!mediaValidation.ok || selectedMedia.length !== mediaIds.length) {
    return;
  }

  const nextPublishVersion =
    intent === "schedule" ? post.publishVersion + 1 : post.publishVersion;
  const publishTargets =
    intent === "schedule"
      ? selectedAccounts.map((account) => ({ id: crypto.randomUUID(), account }))
      : [];

  await db.transaction(async (tx) => {
    await tx
      .update(schema.post)
      .set({
        content,
        platforms: platforms.join(","),
        publishAt: intent === "schedule" ? validPublishAt : null,
        publishVersion: nextPublishVersion,
        queuedAt: null,
        publishedAt: null,
        lastPublishError: null,
        status: intent === "schedule" ? "scheduled" : "draft",
      })
      .where(and(eq(schema.post.id, postId), eq(schema.post.userId, session.user.id)));

    await tx
      .delete(schema.postMedia)
      .where(eq(schema.postMedia.postId, postId));

    if (selectedMedia.length > 0) {
      await tx.insert(schema.postMedia).values(
        selectedMedia.map((media) => ({
          postId,
          mediaId: media.id,
        })),
      );
    }

    if (intent === "schedule") {
      await tx.insert(schema.postPublish).values(
        publishTargets.map(({ id, account }) => ({
          id,
          postId,
          platform: account.platform,
          connectedAccountId: account.id,
          accountDisplayName: account.displayName,
          accountUsername: account.username,
          accountAvatarUrl: account.avatarUrl,
          publishVersion: nextPublishVersion,
          status: "pending",
        })),
      );
    }
  });

  if (intent === "schedule") {
    try {
      await queuePostPublishTargets({
        postId,
        publishAt: validPublishAt as Date,
        publishVersion: nextPublishVersion,
        targetIds: publishTargets.map((target) => target.id),
      });
    } catch (error) {
      console.error("Failed to queue scheduled post update", error);
      await db
        .update(schema.postPublish)
        .set({
          status: "failed",
          error: "Could not queue scheduled publish job.",
        })
        .where(
          and(
            eq(schema.postPublish.postId, postId),
            eq(schema.postPublish.publishVersion, nextPublishVersion),
            eq(schema.postPublish.status, "pending"),
          ),
        );
      await db
        .update(schema.post)
        .set({
          status: "failed",
          lastPublishError: "Could not queue scheduled publish job.",
        })
        .where(and(eq(schema.post.id, postId), eq(schema.post.userId, session.user.id)));
    }
  }

  revalidatePath("/dashboard");
}

type CreateMediaUploadInput = {
  fileName: string;
  contentType: string;
  size: number;
};

export async function createMediaUpload({
  fileName,
  contentType,
  size,
}: CreateMediaUploadInput): Promise<
  MediaActionResult<{
    uploadUrl: string;
    objectKey: string;
    expiresIn: number;
  }>
> {
  const session = await getRequiredSession();
  const cleanFileName = fileName.trim();

  if (!cleanFileName) {
    return { ok: false, error: "Choose a file to upload." };
  }

  if (!isAllowedMediaContentType(contentType)) {
    return { ok: false, error: "Use a JPG, PNG, or GIF image." };
  }

  if (!Number.isFinite(size) || size <= 0 || size > getMaxUploadBytes()) {
    return { ok: false, error: "The selected file is too large." };
  }

  try {
    const objectKey = createMediaObjectKey(session.user.id, cleanFileName);
    const { uploadUrl, expiresIn } = await createUploadUrl({
      objectKey,
      contentType,
    });

    return {
      ok: true,
      uploadUrl,
      objectKey,
      expiresIn,
    };
  } catch (error) {
    console.error("Failed to create R2 upload URL", error);
    return { ok: false, error: "Media upload is not configured yet." };
  }
}

type RegisterUploadedMediaInput = {
  objectKey: string;
  fileName: string;
  contentType: string;
  size: number;
};

export async function registerUploadedMedia({
  objectKey,
  fileName,
  contentType,
  size,
}: RegisterUploadedMediaInput): Promise<MediaActionResult<{ mediaId?: string }>> {
  const session = await getRequiredSession();

  if (!objectKey.startsWith(getUserMediaPrefix(session.user.id))) {
    return { ok: false, error: "That media object does not belong to you." };
  }

  if (!isAllowedMediaContentType(contentType)) {
    return { ok: false, error: "Use a JPG, PNG, or GIF image." };
  }

  if (!Number.isFinite(size) || size <= 0 || size > getMaxUploadBytes()) {
    return { ok: false, error: "The selected file is too large." };
  }

  const displayName = sanitizeDisplayName(fileName).slice(0, 120);

  if (!displayName) {
    return { ok: false, error: "Choose a file to upload." };
  }

  const mediaId = crypto.randomUUID();

  await db
    .insert(schema.userMedia)
    .values({
      id: mediaId,
      userId: session.user.id,
      mediaUrl: objectKey,
      displayName,
      contentType,
      sizeBytes: size,
    })
    .onConflictDoNothing({
      target: schema.userMedia.mediaUrl,
    });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");

  return { ok: true, mediaId };
}

export async function renameMedia(
  mediaId: string,
  displayName: string,
): Promise<MediaActionResult<Record<string, unknown>>> {
  const session = await getRequiredSession();
  const nextDisplayName = sanitizeDisplayName(displayName);

  if (!nextDisplayName) {
    return { ok: false, error: "Media name cannot be blank." };
  }

  if (nextDisplayName.length > 120) {
    return { ok: false, error: "Media name must be 120 characters or less." };
  }

  await db
    .update(schema.userMedia)
    .set({ displayName: nextDisplayName })
    .where(
      and(
        eq(schema.userMedia.id, mediaId),
        eq(schema.userMedia.userId, session.user.id),
      ),
    );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");

  return { ok: true };
}

export async function deleteMedia(
  mediaId: string,
): Promise<MediaActionResult<Record<string, unknown>>> {
  const session = await getRequiredSession();
  const media = await db.query.userMedia.findFirst({
    where: (userMedia) =>
      and(eq(userMedia.id, mediaId), eq(userMedia.userId, session.user.id)),
  });

  if (!media) {
    return { ok: false, error: "Media was not found." };
  }

  try {
    await deleteMediaObject(media.mediaUrl);
  } catch (error) {
    console.error("Failed to delete R2 object", error);
    return { ok: false, error: "Could not delete media from R2." };
  }

  await db
    .delete(schema.userMedia)
    .where(
      and(
        eq(schema.userMedia.id, media.id),
        eq(schema.userMedia.userId, session.user.id),
      ),
    );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");

  return { ok: true };
}

export async function getSignedMediaReadUrl(
  mediaId: string,
): Promise<MediaActionResult<{ readUrl: string; expiresIn: number }>> {
  const session = await getRequiredSession();
  const media = await db.query.userMedia.findFirst({
    where: (userMedia) =>
      and(eq(userMedia.id, mediaId), eq(userMedia.userId, session.user.id)),
  });

  if (!media) {
    return { ok: false, error: "Media was not found." };
  }

  try {
    const { readUrl, expiresIn } = await createReadUrl(media.mediaUrl);

    return { ok: true, readUrl, expiresIn };
  } catch (error) {
    console.error("Failed to create R2 read URL", error);
    return { ok: false, error: "Media access is not configured yet." };
  }
}
