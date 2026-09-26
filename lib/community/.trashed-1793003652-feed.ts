import { db } from "@/lib/db";

/** ids the viewer should never see (blocked either way) */
export async function blockedIds(userId: string) {
  const rows = await db.userBlock.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] }, select: { blockerId: true, blockedId: true } });
  return rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId));
}

export const authorSelect = { id: true, username: true, displayName: true, role: true, profile: { select: { avatarUrl: true, public: true } } } as const;

export function shapePost(p: any, viewerId: string, liked: Set<string>, saved: Set<string>) {
  return {
    id: p.id, type: p.type, title: p.title, content: p.content, tags: p.tags ?? [], mediaUrl: p.mediaUrl, mediaType: p.mediaType,
    createdAt: p.createdAt, isMine: p.authorId === viewerId,
    author: { username: p.author.username, displayName: p.author.displayName, avatarUrl: p.author.profile?.avatarUrl ?? null, staff: p.author.role !== "USER" },
    counts: { likes: p._count?.likes ?? 0, comments: p._count?.comments ?? 0, shares: p.shareCount ?? 0 },
    liked: liked.has(p.id), saved: saved.has(p.id),
    shared: p.sharedPost ? {
      id: p.sharedPost.id, content: p.sharedPost.content, mediaUrl: p.sharedPost.mediaUrl, mediaType: p.sharedPost.mediaType,
      author: { username: p.sharedPost.author.username, displayName: p.sharedPost.author.displayName },
    } : null,
  };
}
