import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UploadDescriptor = {
  key: string;
  filename: string;
  contentType: string;
  size: number;
};

let cachedClient: S3Client | null = null;

function getClient() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || "auto";

  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error("STORAGE_NOT_CONFIGURED");

  if (!cachedClient) {
    cachedClient = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      // R2 and most S3-compatible providers expect path-style addressing.
      forcePathStyle: true,
    });
  }

  return cachedClient;
}

/**
 * Returns a short-lived presigned PUT URL. The client uploads the file
 * bytes directly to R2/S3 with this URL — the file never passes through
 * the app server.
 */
export async function createUploadUrl(input: UploadDescriptor) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("STORAGE_NOT_CONFIGURED");

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
  });

  const expiresIn = 300;
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const publicUrl = base ? `${base}/${input.key}` : undefined;

  return { uploadUrl, key: input.key, publicUrl, expiresIn };
}


/** Short-lived presigned GET so users can download their own files. */
export async function createDownloadUrl(key: string, filename: string) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("STORAGE_NOT_CONFIGURED");
  const command = new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"` });
  return getSignedUrl(getClient(), command, { expiresIn: 120 });
}
