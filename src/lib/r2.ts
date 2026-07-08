import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { type AllowedMediaContentType } from "@/lib/media-guidelines";

let r2Client: S3Client | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for Cloudflare R2 media uploads.`);
  }

  return value;
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

export function getR2Client() {
  if (!r2Client) {
    const accountId = getRequiredEnv("R2_ACCOUNT_ID");

    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }

  return r2Client;
}

export function getR2BucketName() {
  return getRequiredEnv("R2_BUCKET_NAME");
}

export function getMediaUploadTtlSeconds() {
  return getPositiveIntegerEnv("R2_PRESIGNED_UPLOAD_TTL_SECONDS", 300);
}

export function getMediaReadTtlSeconds() {
  return getPositiveIntegerEnv("R2_PRESIGNED_READ_TTL_SECONDS", 300);
}

export function getMaxUploadBytes() {
  return getPositiveIntegerEnv("R2_MAX_UPLOAD_BYTES", 5 * 1024 * 1024);
}

function sanitizeFileName(fileName: string) {
  const safeFileName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

  return safeFileName || "upload";
}

export function createMediaObjectKey(userId: string, fileName: string) {
  return `users/${userId}/media/${crypto.randomUUID()}-${sanitizeFileName(
    fileName,
  )}`;
}

export function getUserMediaPrefix(userId: string) {
  return `users/${userId}/media/`;
}

export function getMediaFileName(objectKey: string) {
  return objectKey.split("/").at(-1) || objectKey;
}

type CreateUploadUrlParams = {
  objectKey: string;
  contentType: AllowedMediaContentType;
};

export async function createUploadUrl({
  objectKey,
  contentType,
}: CreateUploadUrlParams) {
  const expiresIn = getMediaUploadTtlSeconds();
  const uploadUrl = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
      ContentType: contentType,
    }),
    { expiresIn },
  );

  return { uploadUrl, expiresIn };
}

export async function createReadUrl(objectKey: string) {
  const expiresIn = getMediaReadTtlSeconds();
  const readUrl = await getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
    }),
    { expiresIn },
  );

  return { readUrl, expiresIn };
}

export async function deleteMediaObject(objectKey: string) {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey,
    }),
  );
}
