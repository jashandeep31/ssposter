"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { queuePostPublishTarget } from "@/lib/qstash";
import { getRequiredSession } from "@/lib/session";

type RetryResult = { ok: true } | { ok: false; error: string };

export async function retryPostPublish(postPublishId: string): Promise<RetryResult> {
  const session = await getRequiredSession();
  const publish = await db.query.postPublish.findFirst({
    where: (item, { eq: rowEq }) => rowEq(item.id, postPublishId),
    with: {
      post: true,
    },
  });

  if (
    !publish ||
    publish.post.userId !== session.user.id ||
    publish.status !== "failed" ||
    publish.publishVersion !== publish.post.publishVersion ||
    !publish.connectedAccountId
  ) {
    return { ok: false, error: "This publishing target cannot be retried." };
  }

  const account = await db.query.connectedAccount.findFirst({
    where: (item) =>
      and(
        eq(item.id, publish.connectedAccountId as string),
        eq(item.userId, session.user.id),
        eq(item.status, "active"),
      ),
  });

  if (!account) {
    return { ok: false, error: "Reconnect this account before retrying." };
  }

  const [queuedTarget] = await db
    .update(schema.postPublish)
    .set({
      status: "pending",
      error: null,
      queuedAt: null,
      qstashMessageId: null,
      processingStartedAt: null,
    })
    .where(
      and(
        eq(schema.postPublish.id, publish.id),
        eq(schema.postPublish.status, "failed"),
      ),
    )
    .returning();

  if (!queuedTarget) {
    return { ok: false, error: "This publishing target is already being retried." };
  }

  await db
    .update(schema.post)
    .set({ status: "scheduled", lastPublishError: null })
    .where(eq(schema.post.id, publish.postId));

  try {
    const { messageId } = await queuePostPublishTarget({
      postPublishId: queuedTarget.id,
      publishVersion: queuedTarget.publishVersion,
      deduplicationId: `retry:${queuedTarget.id}:${crypto.randomUUID()}`,
    });

    await db
      .update(schema.postPublish)
      .set({ queuedAt: new Date(), qstashMessageId: messageId })
      .where(eq(schema.postPublish.id, queuedTarget.id));
  } catch (error) {
    console.error("Failed to queue publish retry", error);
    await db
      .update(schema.postPublish)
      .set({ status: "failed", error: "Could not queue the retry." })
      .where(eq(schema.postPublish.id, queuedTarget.id));
    await db
      .update(schema.post)
      .set({ status: "failed", lastPublishError: "Could not queue the retry." })
      .where(eq(schema.post.id, publish.postId));
    return { ok: false, error: "Could not queue the retry." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/posts");
  return { ok: true };
}
