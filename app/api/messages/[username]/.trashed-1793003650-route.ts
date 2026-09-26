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

  const clear = await db.conversationClear.findUnique({ where: { userId_peerId: { userId: user.id, peerId: r.t.id } }, select: { clearedAt: true } });

  const [messages, myPrefs] = await Promise.all([
    db.directMessage.findMany({
      where: { OR: [{ fromId: user.id, toId: r.t.id }, { fromId: r.t.id, toId: user.id }], ...(clear ? { createdAt: { gt: clear.clearedAt } } : {}) },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { replyTo: { select: { id: true, content: true, fromId: true, deletedAt: true } } },
    }),
    db.userPreference.findUnique({ where: { userId: user.id }, select: { readReceipts: true } }),
  ]);

  // mark incoming as read (only records a receipt if the reader allows read receipts)
  if (myPrefs?.readReceipts !== false) await db.directMessage.updateMany({ where: { fromId: r.t.id, toId: user.id, readAt: null }, data: { readAt: new Date() } });

  const showReceipts = r.t.preference?.readReceipts !== false;
  const online = r.t.preference?.showOnlineStatus !== false && r.t.lastSeenAt ? Date.now() - r.t.lastSeenAt.getTime() < 2 * 60_000 : false;
  return NextResponse.json({
    peer: { username: r.t.username, displayName: r.t.displayName, avatarUrl: r.t.profile?.avatarUrl ?? null, online },
    messages: messages.map((m) => ({
      id: m.id,
      content: m.deletedAt ? null : m.content,
      deleted: Boolean(m.deletedAt),
      createdAt: m.createdAt,
      mine: m.fromId === user.id,
      read: m.fromId === user.id && showReceipts ? Boolean(m.readAt) : null,
      replyTo: m.replyTo ? { id: m.replyTo.id, content: m.replyTo.deletedAt ? null : m.replyTo.content, mine: m.replyTo.fromId === user.id } : null,
    })),
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

  const { content, replyToId } = await req.json().catch(() => ({}) as any);
  const text = typeof content === "string" ? content.trim() : "";
  if (!text || text.length > 2000) return bad("Message must be 1–2000 characters.");

  let validReplyToId: string | undefined;
  if (typeof replyToId === "string" && replyToId) {
    const parent = await db.directMessage.findFirst({ where: { id: replyToId, OR: [{ fromId: user.id, toId: r.t.id }, { fromId: r.t.id, toId: user.id }] }, select: { id: true } });
    if (parent) validReplyToId = parent.id;
  }

  const message = await db.directMessage.create({
    data: { fromId: user.id, toId: r.t.id, content: text, replyToId: validReplyToId },
    include: { replyTo: { select: { id: true, content: true, fromId: true, deletedAt: true } } },
  });
  return NextResponse.json({
    message: {
      id: message.id, content: message.content, deleted: false, createdAt: message.createdAt, mine: true, read: false,
      replyTo: message.replyTo ? { id: message.replyTo.id, content: message.replyTo.deletedAt ? null : message.replyTo.content, mine: message.replyTo.fromId === user.id } : null,
    },
  }, { status: 201 });
}

/** "Delete chat" — clears this conversation on the caller's side only (like WhatsApp's Delete chat). */
export async function DELETE(_: Request, ctx: { params: Promise<{ username: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { username } = await ctx.params;
  const r = await target(username, user.id);
  if (!r) return bad("User not found.", 404);

  await db.conversationClear.upsert({
    where: { userId_peerId: { userId: user.id, peerId: r.t.id } },
    update: { clearedAt: new Date() },
    create: { userId: user.id, peerId: r.t.id },
  });
  return NextResponse.json({ cleared: true });
}
