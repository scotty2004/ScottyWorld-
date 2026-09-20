import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";
import { blockedIds } from "@/lib/community/feed";

/** Conversation list: latest message per person + unread count. */
export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const blocked = new Set(await blockedIds(user.id));

  const msgs = await db.directMessage.findMany({
    where: { OR: [{ fromId: user.id }, { toId: user.id }] },
    orderBy: { createdAt: "desc" }, take: 300,
    include: { from: { select: { id: true, username: true, displayName: true, lastSeenAt: true, profile: { select: { avatarUrl: true } }, preference: { select: { showOnlineStatus: true } } } }, to: { select: { id: true, username: true, displayName: true, lastSeenAt: true, profile: { select: { avatarUrl: true } }, preference: { select: { showOnlineStatus: true } } } } },
  });

  const convos = new Map<string, any>();
  for (const m of msgs) {
    const other = m.fromId === user.id ? m.to : m.from;
    if (blocked.has(other.id)) continue;
    const c = convos.get(other.id) ?? {
      username: other.username, displayName: other.displayName, avatarUrl: other.profile?.avatarUrl ?? null,
      online: other.preference?.showOnlineStatus !== false && other.lastSeenAt ? Date.now() - other.lastSeenAt.getTime() < 2 * 60_000 : false,
      last: { content: m.content, createdAt: m.createdAt, mine: m.fromId === user.id }, unread: 0,
    };
    if (m.toId === user.id && !m.readAt) c.unread += 1;
    convos.set(other.id, c);
  }
  return NextResponse.json({ conversations: [...convos.values()] });
}
