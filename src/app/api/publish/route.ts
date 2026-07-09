import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { and, asc, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { isSupportedPlatform } from "@/lib/media-guidelines";
import { publishPostToPlatform } from "@/lib/social-publishers";
import { SocialPublishError } from "@/lib/social-publishers/types";

export const runtime = "nodejs";

const earlyDeliveryToleranceMs = 30 * 1000;

type PublishPayload = {
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
  if (error instanceof SocialPublishError) {
    return error.retryable;
  }

  return true;
}

async function markPostFailed(postId: string, error: string) {
  await db
    .update(schema.post)
    .set({
      status: "failed",
      lastPublishError: error,
    })
    .where(eq(schema.post.id, postId));
}

async function handler(request: Request) {
  const payload = (await request.json().catch(() => null)) as PublishPayload | null;

  if (
    !payload ||
    typeof payload.postId !== "string" ||
    typeof payload.publishVersion !== "number" ||
    !Number.isInteger(payload.publishVersion) ||
    payload.publishVersion < 1
  ) {
    return NextResponse.json({ error: "Invalid publish payload." }, { status: 400 });
  }

  const post = await db.query.post.findFirst({
    where: (item) => eq(item.id, payload.postId as string),
    with: {
      media: {
        with: {
          media: true,
        },
      },
    },
  });

  if (!post || post.status !== "scheduled") {
    return NextResponse.json({ ok: true, skipped: "not-scheduled" });
  }

  if (post.publishVersion !== payload.publishVersion) {
    return NextResponse.json({ ok: true, skipped: "stale-version" });
  }

  if (
    post.publishAt &&
    post.publishAt.getTime() > Date.now() + earlyDeliveryToleranceMs
  ) {
    return NextResponse.json({ ok: true, skipped: "too-early" });
  }

  const publishRows = await db.query.postPublish.findMany({
    where: (item, { eq: rowEq, and: rowAnd }) =>
      rowAnd(
        rowEq(item.postId, post.id),
        rowEq(item.publishVersion, payload.publishVersion as number),
      ),
    orderBy: (item, { asc: rowAsc }) => [rowAsc(item.createdAt)],
  });

  if (publishRows.length === 0) {
    await markPostFailed(post.id, "No supported publishing platforms were queued.");
    return NextResponse.json({ ok: true, skipped: "no-publish-rows" });
  }

  for (const publishRow of publishRows) {
    if (
      publishRow.status !== "pending" &&
      publishRow.status !== "failed" &&
      publishRow.status !== "publishing"
    ) {
      continue;
    }

    if (!isSupportedPlatform(publishRow.platform)) {
      await db
        .update(schema.postPublish)
        .set({
          status: "skipped",
          error: `${publishRow.platform} publishing is not supported.`,
        })
        .where(eq(schema.postPublish.id, publishRow.id));
      continue;
    }

    const account = await db.query.connectedAccount.findFirst({
      where: (item) =>
        and(
          eq(item.userId, post.userId),
          eq(item.platform, publishRow.platform),
          eq(item.status, "active"),
        ),
      orderBy: (item) => [asc(item.createdAt)],
    });

    if (!account) {
      await db
        .update(schema.postPublish)
        .set({
          status: "failed",
          error: `No active ${publishRow.platform} account is connected.`,
          lastAttemptAt: new Date(),
        })
        .where(eq(schema.postPublish.id, publishRow.id));
      continue;
    }

    const attemptStartedAt = new Date();

    await db
      .update(schema.postPublish)
      .set({
        status: "publishing",
        connectedAccountId: account.id,
        attempts: publishRow.attempts + 1,
        lastAttemptAt: attemptStartedAt,
        error: null,
      })
      .where(eq(schema.postPublish.id, publishRow.id));

    try {
      const result = await publishPostToPlatform(publishRow.platform, {
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

      await db
        .update(schema.postPublish)
        .set({
          status: "published",
          providerPostId: result.providerPostId,
          error: null,
          publishedAt: new Date(),
        })
        .where(eq(schema.postPublish.id, publishRow.id));
    } catch (error) {
      const errorMessage = sanitizeError(error);

      await db
        .update(schema.postPublish)
        .set({
          status: "failed",
          error: errorMessage,
        })
        .where(eq(schema.postPublish.id, publishRow.id));

      if (isRetryablePublishError(error)) {
        await db
          .update(schema.post)
          .set({ lastPublishError: errorMessage })
          .where(eq(schema.post.id, post.id));

        throw error;
      }
    }
  }

  const finalRows = await db.query.postPublish.findMany({
    where: (item, { eq: rowEq, and: rowAnd }) =>
      rowAnd(
        rowEq(item.postId, post.id),
        rowEq(item.publishVersion, payload.publishVersion as number),
      ),
  });
  const completedRows = finalRows.filter(
    (row) => row.status === "published" || row.status === "skipped",
  );
  const failedRows = finalRows.filter((row) => row.status === "failed");

  if (completedRows.length === finalRows.length) {
    await db
      .update(schema.post)
      .set({
        status: "published",
        publishedAt: new Date(),
        lastPublishError: null,
      })
      .where(eq(schema.post.id, post.id));
  } else if (failedRows.length > 0) {
    await markPostFailed(
      post.id,
      failedRows
        .map((row) => row.error)
        .filter(Boolean)
        .join(" "),
    );
  }

  return NextResponse.json({ ok: true });
}

export const POST = verifySignatureAppRouter(handler, {
  url: getPublishUrl(),
});
