import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/lib/db";

export type UploadDescriptor = {
  key: string;
  filename: string;
  contentType: string;
  size: number;
};

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const CHUNK = 4 * 1024 * 1024;

/** True when an S3-compatible bucket (R2, S3, Backblaze, MinIO) is configured. */
export function s3Configured() {
  return Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

let cachedClient: S3Client | null = null;

function getClient() {
  let endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || "auto";

  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error("STORAGE_NOT_CONFIGURED");

  // People often paste "https://<account>.r2.cloudflarestorage.com/<bucket>" — with path-style
  // addressing the bucket would then be added twice and every request fails. Keep only the origin.
  try { endpoint = new URL(endpoint.trim()).origin; } catch { endpoint = endpoint.trim().replace(/\/+$/, ""); }

  if (!cachedClient) {
    cachedClient = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() },
      // R2 and most S3-compatible providers expect path-style addressing.
      forcePathStyle: true,
      // Newer AWS SDK versions add CRC32 checksum params to presigned URLs by default.
      // Cloudflare R2 and other S3-compatible stores reject those, so only send them when required.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
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

  const expiresIn = 900;
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  return { uploadUrl, key: input.key, expiresIn };
}

/** Short-lived presigned GET so users can download their own files. */
export async function createDownloadUrl(key: string, filename: string) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("STORAGE_NOT_CONFIGURED");
  const command = new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"` });
  return getSignedUrl(getClient(), command, { expiresIn: 120 });
}

/* ------------------------------------------------------------------ */
/* Server-side upload / read / delete (works with or without a bucket) */
/* ------------------------------------------------------------------ */

async function readCapped(stream: ReadableStream<any>, max: number) {
  const reader = stream.getReader();
  const parts: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) { await reader.cancel().catch(() => null); throw new Error("TOO_LARGE"); }
    parts.push(Buffer.from(value));
  }
  return Buffer.concat(parts, total);
}

async function dbRemove(key: string) {
  await db.storedFile.deleteMany({ where: { key } });
}

async function dbPut(key: string, ownerId: string, contentType: string, stream: ReadableStream<any>, max: number) {
  await dbRemove(key);
  const file = await db.storedFile.create({ data: { key, ownerId, contentType }, select: { id: true } });
  const reader = stream.getReader();
  let parts: Buffer[] = [];
  let pending = 0;
  let total = 0;
  let index = 0;

  const store = async (data: Buffer) => {
    await db.storedChunk.create({ data: { fileId: file.id, index: index++, data: new Uint8Array(data) as any } });
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > max) throw new Error("TOO_LARGE");
      parts.push(Buffer.from(value));
      pending += value.length;
      if (pending >= CHUNK) {
        const all = Buffer.concat(parts, pending);
        let off = 0;
        while (all.length - off >= CHUNK) { await store(all.subarray(off, off + CHUNK)); off += CHUNK; }
        const rest = all.subarray(off);
        parts = rest.length ? [rest] : [];
        pending = rest.length;
      }
    }
    if (pending) await store(Buffer.concat(parts, pending));
    await db.storedFile.update({ where: { id: file.id }, data: { sizeBytes: total } });
    return total;
  } catch (e) {
    await reader.cancel().catch(() => null);
    await db.storedFile.delete({ where: { id: file.id } }).catch(() => null);
    throw e;
  }
}

/** Saves an uploaded body under `key`: into the bucket when connected, otherwise into the database. */
export async function saveObject(key: string, ownerId: string, contentType: string, stream: ReadableStream<any>, max = MAX_UPLOAD_BYTES) {
  if (s3Configured()) {
    const body = await readCapped(stream, max);
    await getClient().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Body: body, ContentType: contentType, ContentLength: body.length }));
    return body.length;
  }
  return dbPut(key, ownerId, contentType, stream, max);
}

export type OpenedObject = {
  status: 200 | 206;
  contentType: string;
  length: number;
  contentRange?: string;
  body: ReadableStream<any>;
};

/** Parses an HTTP Range header. undefined = no range, null = unsatisfiable. */
function parseRange(header: string | null, size: number): { start: number; end: number } | null | undefined {
  if (!header) return undefined;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return undefined;
  let start: number; let end: number;
  if (m[1] === "") { const n = Number(m[2]); start = Math.max(0, size - n); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return null;
  return { start, end };
}

async function dbOpen(key: string, rangeHeader: string | null): Promise<OpenedObject> {
  const file = await db.storedFile.findUnique({ where: { key }, select: { id: true, sizeBytes: true, contentType: true } });
  if (!file) throw new Error("NOT_FOUND");
  const size = file.sizeBytes;
  const range = parseRange(rangeHeader, size);
  if (range === null) throw new Error("BAD_RANGE");
  const start = range?.start ?? 0;
  const end = range?.end ?? Math.max(0, size - 1);
  let idx = Math.floor(start / CHUNK);
  const last = Math.floor(end / CHUNK);

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (size === 0 || idx > last) { controller.close(); return; }
      const c = await db.storedChunk.findUnique({ where: { fileId_index: { fileId: file.id, index: idx } }, select: { data: true } });
      if (!c) { controller.error(new Error("MISSING_CHUNK")); return; }
      const buf = Buffer.from(c.data as Uint8Array);
      const chunkStart = idx * CHUNK;
      const from = Math.max(start, chunkStart) - chunkStart;
      const to = Math.min(end, chunkStart + buf.length - 1) - chunkStart;
      controller.enqueue(new Uint8Array(buf.subarray(from, to + 1)));
      idx += 1;
    },
  });

  return {
    status: range ? 206 : 200,
    contentType: file.contentType,
    length: size === 0 ? 0 : end - start + 1,
    contentRange: range ? `bytes ${start}-${end}/${size}` : undefined,
    body,
  };
}

/** Opens a stored object (bucket first, then the database fallback) for streaming to the browser. */
export async function openObject(key: string, rangeHeader: string | null): Promise<OpenedObject> {
  if (s3Configured()) {
    try {
      const out = await getClient().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Range: rangeHeader ?? undefined }));
      const body = (out.Body as any).transformToWebStream() as ReadableStream<Uint8Array>;
      return {
        status: out.ContentRange ? 206 : 200,
        contentType: out.ContentType || "application/octet-stream",
        length: Number(out.ContentLength ?? 0),
        contentRange: out.ContentRange,
        body,
      };
    } catch (e: any) {
      const code = e?.$metadata?.httpStatusCode;
      if (code === 416) throw new Error("BAD_RANGE");
      if (!(e?.name === "NoSuchKey" || code === 404)) throw e;
      // not in the bucket — it may have been stored before the bucket was connected
    }
  }
  return dbOpen(key, rangeHeader);
}

/** Best-effort removal of the stored bytes (used when a Cloud file is deleted). */
export async function removeObject(key: string) {
  if (s3Configured()) {
    await getClient().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })).catch(() => null);
  }
  await dbRemove(key).catch(() => null);
}
