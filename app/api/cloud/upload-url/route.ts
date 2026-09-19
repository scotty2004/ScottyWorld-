import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createUploadUrl } from "@/lib/integrations/storage";
import { enforceRateLimit } from "@/lib/security/request";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await enforceRateLimit(`upload:${user.id}`, 20, 60_000);
    const body = await req.json();
    const filename = String(body.filename || "").trim();
    const contentType = String(body.contentType || "").trim();
    const size = Number(body.size);
    if (!filename || filename.length > 180 || !contentType || !Number.isSafeInteger(size) || size <= 0 || size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }
    const key = `${user.id}/${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const result = await createUploadUrl({ key, filename, contentType, size });
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "RATE_LIMITED") return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    if (msg.includes("NOT_CONFIGURED")) return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });
    return NextResponse.json({ error: "Could not create upload URL" }, { status: 502 });
  }
}
