import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { rateLimit } from "@/lib/security/rate-limit";

async function target(username: string, viewerId: string) {
  const t = await db.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true, username: true, displayName: true, lastSeenAt: true, profile: { select: { avatarUrl: true } }, preference: { select: { showOnlineStatus: true, readReceipts: true } } } });
  if (!t) return null;
  const block = await db.userBlock.findFirst({ where: { OR: [{ blockerId: viewerId, blockedId: t.id }, { blockerId: t.id, blockedId: viewerId }] }, select: { id: true } });
  return { t, blocked: Boolean(block) };
}

export async function GET(_: Request, ctx: { params: Promise<{ username: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { username } = await ctx.params;
  const r = await target(username, user.id);
  if (!r) return bad("User not found.", 404);
  if (r.blocked) return bad("You can't message this user.", 403);

  const [messages, myPrefs] = await Promise.all([
    db.directMessage.findMany({ where: { OR: [{ fromId: user.id, toId: r.t.id }, { fromId: r.t.id, toId: user.id }] }, orderBy: { createdAt: "asc" }, take: 200 }),
    db.userPreference.findUnique({ where: { userId: user.id }, select: { readReceipts: true } }),
  ]);

  // mark incoming as read (only records a receipt if the reader allows read receipts)
  if (myPrefs?.readReceipts !== false) await db.directMessage.updateMany({ where: { fromId: r.t.id, toId: user.id, readAt: null }, data: { readAt: new Date() } });

  const showReceipts = r.t.preference?.readReceipts !== false;
  const online = r.t.preference?.showOnlineStatus !== false && r.t.lastSeenAt ? Date.now() - r.t.lastSeenAt.getTime() < 2 * 60_000 : false;
  return NextResponse.json({
    peer: { username: r.t.username, displayName: r.t.displayName, avatarUrl: r.t.profile?.avatarUrl ?? null, online },
    messages: messages.map((m) => ({ id: m.id, content: m.content, createdAt: m.createdAt, mine: m.fromId === user.id, read: m.fromId === user.id && showReceipts ? Boolean(m.readAt) : null })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const user = await me();
  if (!user) return unauth();
  if (!rateLimit(`dm:${user.id}`, 30, 60_000).allowed) return bad("You're sending messages too fast.", 429);
  const { username } = await ctx.params;
  const r = await target(username, user.id);
  if (!r) return bad("User not found.", 404);
  if (r.t.id === user.id) return bad("You can't message yourself.");
  if (r.blocked) return bad("You can't message this user.", 403);

  const { content } = await req.json().catch(() => ({}));
  const text = typeof content === "string" ? content.trim() : "";
  if (!text || text.length > 2000) return bad("Message must be 1–2000 characters.");

  const message = await db.directMessage.create({ data: { fromId: user.id, toId: r.t.id, content: text } });
  return NextResponse.json({ message: { id: message.id, content: message.content, createdAt: message.createdAt, mine: true, read: false } }, { status: 201 });
}
