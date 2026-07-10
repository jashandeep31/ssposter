import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { and, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db";
import { isSupportedPlatform } from "@/lib/media-guidelines";
import { queuePostPublishTarget } from "@/lib/qstash";
import { publishPostToPlatform } from "@/lib/social-publishers";
import { SocialPublishError } from "@/lib/social-publishers/types";

export const runtime = "nodejs";

const earlyDeliveryToleranceMs = 30 * 1000;

type PublishPayload = {
  postPublishId?: unknown;
  postId?: unknown;
  publishVersion?: unknown;
};

function getPublishUrl() {
  const baseUrl = process.env.BETTER_AUTH_URL;

  if (!baseUrl) {
    throw new Error("BETTER_AUTH_URL is required to verify publish callbacks.");
  }

  return `${baseUrl.replace(/\/$/, "")}/api/publish`;
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown publish error.";

  return message.replace(/\s+/g, " ").slice(0, 500);
}

function isRetryablePublishError(error: unknown) {
  return !(error instanceof SocialPublishError) || error.retryable;
}

async function refreshPostStatus(postId: string, publishVersion: number) {
  const rows = await db.query.postPublish.findMany({
    where: (item, { and: rowAnd, eq: rowEq }) =>
      rowAnd(rowEq(item.postId, postId), rowEq(item.publishVersion, publishVersion)),
  });

  if (rows.length === 0) {
    return;
  }

  const completed = rows.filter(
    (row) => row.status === "published" || row.status === "skipped",
  );
  const failed = rows.filter((row) => row.status === "failed");
  const hasInProgress = rows.some(
    (row) => row.status === "pending" || row.status === "publishing",
  );
  const nextStatus =
    completed.length === rows.length
      ? "published"
      : hasInProgress
        ? "scheduled"
        : completed.length > 0
          ? "partial"
          : "failed";
  const errors = failed
    .map((row) => row.error)
    .filter(Boolean)
    .join(" ");

  await db
    .update(schema.post)
    .set({
      status: nextStatus,
      publishedAt: nextStatus === "published" ? new Date() : null,
      lastPublishError: errors || null,
    })
    .where(and(eq(schema.post.id, postId), eq(schema.post.publishVersion, publishVersion)));
}

async function handler(request: Request) {
  const payload = (await request.json().catch(() => null)) as PublishPayload | null;

  if (
    !payload ||
    (typeof payload.postPublishId !== "string" && typeof payload.postId !== "string") ||
    typeof payload.publishVersion !== "number" ||
    !Number.isInteger(payload.publishVersion) ||
    payload.publishVersion < 1
  ) {
    return NextResponse.json({ error: "Invalid publish payload." }, { status: 400 });
  }

  if (typeof payload.postPublishId !== "string" && typeof payload.postId === "string") {
    const legacyTargets = await db.query.postPublish.findMany({
      where: (item, { and: rowAnd, eq: rowEq, inArray: rowInArray }) =>
        rowAnd(
          rowEq(item.postId, payload.postId as string),
          rowEq(item.publishVersion, payload.publishVersion as number),
          rowInArray(item.status, ["pending", "failed"]),
        ),
    });

    await Promise.all(
      legacyTargets.map(async (target) => {
        const { messageId } = await queuePostPublishTarget({
          postPublishId: target.id,
          publishVersion: target.publishVersion,
        });

        await db
          .update(schema.postPublish)
          .set({ queuedAt: new Date(), qstashMessageId: messageId })
          .where(eq(schema.postPublish.id, target.id));
      }),
    );

    return NextResponse.json({ ok: true, migrated: legacyTargets.length });
  }

  const publishRow = await db.query.postPublish.findFirst({
    where: (item, { eq: rowEq }) => rowEq(item.id, payload.postPublishId as string),
  });

  if (!publishRow || publishRow.publishVersion !== payload.publishVersion) {
    return NextResponse.json({ ok: true, skipped: "stale-target" });
  }

  const post = await db.query.post.findFirst({
    where: (item) => eq(item.id, publishRow.postId),
    with: {
      media: {
        with: {
          media: true,
        },
      },
    },
  });

  if (
    !post ||
    !["scheduled", "partial", "failed"].includes(post.status) ||
    post.publishVersion !== payload.publishVersion
  ) {
    return NextResponse.json({ ok: true, skipped: "not-current" });
  }

  if (post.publishAt && post.publishAt.getTime() > Date.now() + earlyDeliveryToleranceMs) {
    return NextResponse.json({ ok: true, skipped: "too-early" });
  }

  const attemptNumber = publishRow.attempts + 1;
  const [claimedRow] = await db
    .update(schema.postPublish)
    .set({
      status: "publishing",
      attempts: attemptNumber,
      lastAttemptAt: new Date(),
      processingStartedAt: new Date(),
      error: null,
    })
    .where(
      and(
        eq(schema.postPublish.id, publishRow.id),
        inArray(schema.postPublish.status, ["pending", "failed"]),
      ),
    )
    .returning();

  if (!claimedRow) {
    return NextResponse.json({ ok: true, skipped: "already-processing" });
  }

  const attemptId = crypto.randomUUID();
  await db.insert(schema.postPublishAttempt).values({
    id: attemptId,
    postPublishId: claimedRow.id,
    attempt: attemptNumber,
    status: "publishing",
    qstashMessageId: claimedRow.qstashMessageId,
  });

  if (!isSupportedPlatform(claimedRow.platform)) {
    const error = `${claimedRow.platform} publishing is not supported.`;
    await db.transaction(async (tx) => {
      await tx
        .update(schema.postPublish)
        .set({ status: "skipped", error, processingStartedAt: null })
        .where(eq(schema.postPublish.id, claimedRow.id));
      await tx
        .update(schema.postPublishAttempt)
        .set({ status: "skipped", error, completedAt: new Date() })
        .where(eq(schema.postPublishAttempt.id, attemptId));
    });
    await refreshPostStatus(post.id, payload.publishVersion);
    return NextResponse.json({ ok: true, skipped: "unsupported-platform" });
  }

  const account = claimedRow.connectedAccountId
    ? await db.query.connectedAccount.findFirst({
        where: (item) =>
          and(
            eq(item.id, claimedRow.connectedAccountId as string),
            eq(item.userId, post.userId),
            eq(item.platform, claimedRow.platform),
            eq(item.status, "active"),
          ),
      })
    : null;

  if (!account) {
    const error = "The selected publishing account is no longer active.";
    await db.transaction(async (tx) => {
      await tx
        .update(schema.postPublish)
        .set({ status: "failed", error, processingStartedAt: null })
        .where(eq(schema.postPublish.id, claimedRow.id));
      await tx
        .update(schema.postPublishAttempt)
        .set({ status: "failed", error, completedAt: new Date() })
        .where(eq(schema.postPublishAttempt.id, attemptId));
    });
    await refreshPostStatus(post.id, payload.publishVersion);
    return NextResponse.json({ ok: true, skipped: "inactive-account" });
  }

  try {
    const result = await publishPostToPlatform(claimedRow.platform, {
      postId: post.id,
      content: post.content,
      userId: post.userId,
      account,
      media: post.media.map((item) => ({
        id: item.media.id,
        objectKey: item.media.mediaUrl,
        displayName: item.media.displayName,
        contentType: item.media.contentType,
        sizeBytes: item.media.sizeBytes,
      })),
    });

    await db.transaction(async (tx) => {
      await tx
        .update(schema.postPublish)
        .set({
          status: "published",
          providerPostId: result.providerPostId,
          error: null,
          publishedAt: new Date(),
          processingStartedAt: null,
        })
        .where(eq(schema.postPublish.id, claimedRow.id));
      await tx
        .update(schema.postPublishAttempt)
        .set({
          status: "published",
          providerPostId: result.providerPostId,
          completedAt: new Date(),
        })
        .where(eq(schema.postPublishAttempt.id, attemptId));
    });
  } catch (error) {
    const errorMessage = sanitizeError(error);
    await db.transaction(async (tx) => {
      await tx
        .update(schema.postPublish)
        .set({ status: "failed", error: errorMessage, processingStartedAt: null })
        .where(eq(schema.postPublish.id, claimedRow.id));
      await tx
        .update(schema.postPublishAttempt)
        .set({ status: "failed", error: errorMessage, completedAt: new Date() })
        .where(eq(schema.postPublishAttempt.id, attemptId));
    });
    await refreshPostStatus(post.id, payload.publishVersion);

    if (isRetryablePublishError(error)) {
      throw error;
    }
  }

  await refreshPostStatus(post.id, payload.publishVersion);
  return NextResponse.json({ ok: true });
}

export const POST = verifySignatureAppRouter(handler, {
  url: getPublishUrl(),
});
