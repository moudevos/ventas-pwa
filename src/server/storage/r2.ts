import "server-only";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const UPLOAD_SCOPES = new Set(["PRODUCT_IMAGE", "ORDER_IMAGE", "INVENTORY_IMAGE", "EVIDENCE_IMAGE"]);

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function getR2Client() {
  const accountId = requiredEnv("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function validateUploadInput(input: { contentType: string; scope: string; size: number }) {
  if (!UPLOAD_SCOPES.has(input.scope)) throw new Error("Invalid upload scope");
  if (!ALLOWED_IMAGE_TYPES.has(input.contentType)) throw new Error("Invalid image type");
  if (!Number.isInteger(input.size) || input.size <= 0 || input.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be 3 MB or smaller");
  }
}

function extensionFor(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  return "webp";
}

export function getPublicUrl(fileKey: string) {
  return `${requiredEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "")}/${fileKey}`;
}

export async function createUploadUrl(input: { contentType: string; scope: string; size: number }) {
  validateUploadInput(input);
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const fileKey = `${input.scope}/${yyyy}/${mm}/${crypto.randomUUID()}.${extensionFor(input.contentType)}`;
  const signedUrl = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: requiredEnv("R2_BUCKET"),
      Key: fileKey,
      ContentType: input.contentType,
    }),
    { expiresIn: Number(process.env.R2_SIGNED_URL_TTL_SECONDS ?? 3600) },
  );
  return { fileKey, publicUrl: getPublicUrl(fileKey), signedUrl };
}

export async function deleteObject(fileKey: string) {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: requiredEnv("R2_BUCKET"), Key: fileKey }));
}

export const uploadLimits = {
  allowedTypes: [...ALLOWED_IMAGE_TYPES],
  maxSize: MAX_IMAGE_SIZE,
};
