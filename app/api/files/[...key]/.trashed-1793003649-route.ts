import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { openObject } from "@/lib/integrations/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only these are shown inline in the browser. Anything else (html, svg, js…) is forced to download
// so a user can never upload a page that runs on our domain.
const INLINE = /^(image\/(png|jpe?g|gif|webp|avif|bmp)|video\/[a-z0-9.+-]+|audio\/[a-z0-9.+-]+|application\/pdf)$/i;

export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { key: parts } = await ctx.params;
  const key = (parts ?? []).map((p) => decodeURIComponent(p)).join("/");
  if (!/^[A-Za-z0-9_-]{8,64}\/[A-Za-z0-9._-]{1,260}$/.test(key) || key.includes("..")) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Scotty Cloud files are private to their owner unless shared. Post media has no Cloud row and is readable by signed-in users.
  const cloud = await db.cloudFile.findFirst({ where: { key }, select: { userId: true, visibility: true, name: true } });
  if (cloud && cloud.userId !== user.id && cloud.visibility !== "SHARED") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const obj = await openObject(key, req.headers.get("range"));
    const inline = INLINE.test(obj.contentType) && req.nextUrl.searchParams.get("download") !== "1";
    const filename = (cloud?.name || key.split("/").pop() || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
    const headers = new Headers({
      "Content-Type": inline ? obj.contentType : "application/octet-stream",
      "Content-Length": String(obj.length),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
    });
    if (obj.contentRange) headers.set("Content-Range", obj.contentRange);
    return new Response(obj.body, { status: obj.status, headers });
  } catch (e: any) {
    if (e?.message === "NOT_FOUND") return NextResponse.json({ error: "File not found." }, { status: 404 });
    if (e?.message === "BAD_RANGE") return new Response(null, { status: 416 });
    console.error("FILE_READ_FAILED", e?.name, e?.message);
    return NextResponse.json({ error: "Could not read the file." }, { status: 502 });
  }
}
