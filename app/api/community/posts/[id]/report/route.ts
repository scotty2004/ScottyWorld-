import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const limit = rateLimit(`community-report:${user.id}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many reports." }, { status: 429 });

  const { id } = await context.params;
  const post = await db.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 100) : "";
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 1000) : null;
  if (!reason) return NextResponse.json({ error: "Report reason is required." }, { status: 400 });

  const report = await db.report.create({ data: { reporterId: user.id, postId: id, reason, details } });
  return NextResponse.json({ report }, { status: 201 });
}
