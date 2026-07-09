import { Client } from "@upstash/qstash";

type QueuePostPublishInput = {
  postId: string;
  publishAt: Date;
  publishVersion: number;
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

export async function queuePostPublish({
  postId,
  publishAt,
  publishVersion,
}: QueuePostPublishInput) {
  const client = getQstashClient();
  const url = `${getAppUrl()}/api/publish`;

  await client.publishJSON({
    url,
    body: { postId, publishVersion },
    deduplicationId: `post:${postId}:v${publishVersion}`,
    notBefore: Math.floor(publishAt.getTime() / 1000),
    retries: 3,
  });
}
