import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createUploadUrl, s3Configured, MAX_UPLOAD_BYTES } from "@/lib/integrations/storage";
import { enforceRateLimit } from "@/lib/security/request";
import { db } from "@/lib/db";
import { getEntitlements } from "@/lib/pro/plans";

/**
 * Step 1 of every upload. Always succeeds when the user is signed in:
 *  - bucket connected  -> presigned URL for a direct upload (+ a server upload URL as automatic fallback)
 *  - no bucket         -> the server upload URL (files are kept in the database)
 * Either way the file ends up readable at `publicUrl`.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await enforceRateLimit(`upload:${user.id}`, 40, 60_000);
    const body = await req.json().catch(() => ({}));
    const filename = String(body.filename || "").trim();
    const contentType = String(body.contentType || "").trim() || "application/octet-stream";
    const size = Number(body.size);
    if (!filename || filename.length > 180 || !Number.isSafeInteger(size) || size <= 0) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }
    if (size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Files can be up to 100 MB." }, { status: 413 });

    if (body.purpose === "cloud") {
      const [used, ent] = await Promise.all([db.cloudFile.aggregate({ where: { userId: user.id }, _sum: { sizeBytes: true } }), getEntitlements(user.id)]);
      if ((used._sum.sizeBytes ?? 0) + size > ent.cloudMb * 1024 * 1024) {
        return NextResponse.json({ error: "Storage full. Delete files or upgrade to Pro for more space." }, { status: 413 });
      }
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "file";
    const key = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const serverUploadUrl = `/api/upload?key=${encodeURIComponent(key)}`;
    const publicUrl = `/api/files/${key}`;

    if (!s3Configured()) {
      return NextResponse.json({ mode: "server", uploadUrl: serverUploadUrl, serverUploadUrl, key, publicUrl });
    }

    try {
      const r = await createUploadUrl({ key, filename, contentType, size });
      return NextResponse.json({ mode: "direct", uploadUrl: r.uploadUrl, serverUploadUrl, key, publicUrl, expiresIn: r.expiresIn });
    } catch (e) {
      // presigning failed (bad keys/endpoint) — still let the server handle the upload
      console.error("UPLOAD_PRESIGN_FAILED", (e as Error).message);
      return NextResponse.json({ mode: "server", uploadUrl: serverUploadUrl, serverUploadUrl, key, publicUrl });
    }
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "RATE_LIMITED") return NextResponse.json({ error: "Too many uploads. Wait a minute and try again." }, { status: 429 });
    console.error("UPLOAD_URL_FAILED", msg);
    return NextResponse.json({ error: "Could not start the upload." }, { status: 500 });
  }
}
