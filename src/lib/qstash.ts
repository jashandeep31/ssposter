import { Client } from "@upstash/qstash";

type QueuePostPublishTargetInput = {
  postPublishId: string;
  publishVersion: number;
  publishAt?: Date;
  deduplicationId?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to queue scheduled posts.`);
  }

  return value;
}

function getAppUrl() {
  return getRequiredEnv("BETTER_AUTH_URL").replace(/\/$/, "");
}

function getQstashClient() {
  return new Client({
    baseUrl: getRequiredEnv("QSTASH_URL"),
    token: getRequiredEnv("QSTASH_TOKEN"),
  });
}

export async function queuePostPublishTarget({
  postPublishId,
  publishVersion,
  publishAt,
  deduplicationId,
}: QueuePostPublishTargetInput) {
  const client = getQstashClient();
  const url = `${getAppUrl()}/api/publish`;

  return client.publishJSON({
    url,
    body: { postPublishId, publishVersion },
    deduplicationId: deduplicationId ?? `publish:${postPublishId}:v${publishVersion}`,
    ...(publishAt ? { notBefore: Math.floor(publishAt.getTime() / 1000) } : {}),
    retries: 3,
  });
}
