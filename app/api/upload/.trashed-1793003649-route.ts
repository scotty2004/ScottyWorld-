import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { MAX_UPLOAD_BYTES, saveObject } from "@/lib/integrations/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_RE = /^[A-Za-z0-9_-]{8,64}\/[A-Za-z0-9._-]{1,260}$/;

/**
 * Server-side upload: the browser PUTs the raw file body here.
 * Used when no bucket is connected, and as the automatic fallback when a direct
 * upload to the bucket fails (CORS, blocked network, expired URL…).
 * This path is excluded from the middleware so large bodies aren't truncated.
 */
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const key = req.nextUrl.searchParams.get("key") || "";
  if (!KEY_RE.test(key) || key.includes("..") || !key.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid upload key." }, { status: 400 });
  }

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Files can be up to 100 MB." }, { status: 413 });
  if (!req.body) return NextResponse.json({ error: "No file received." }, { status: 400 });

  const contentType = (req.headers.get("content-type") || "application/octet-stream").slice(0, 150);
  try {
    const size = await saveObject(key, user.id, contentType, req.body);
    if (size === 0) return NextResponse.json({ error: "The file is empty." }, { status: 400 });
    return NextResponse.json({ ok: true, key, size });
  } catch (e: any) {
    if (e?.message === "TOO_LARGE") return NextResponse.json({ error: "Files can be up to 100 MB." }, { status: 413 });
    console.error("UPLOAD_FAILED", e?.name, e?.message);
    const code = e?.$metadata?.httpStatusCode;
    if (code === 403 || e?.name === "InvalidAccessKeyId" || e?.name === "SignatureDoesNotMatch") {
      return NextResponse.json({ error: "Cloud storage rejected the keys. The admin needs to check the S3/R2 settings." }, { status: 502 });
    }
    if (e?.name === "NoSuchBucket") return NextResponse.json({ error: "Cloud storage bucket was not found. The admin needs to check S3_BUCKET." }, { status: 502 });
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }
}
