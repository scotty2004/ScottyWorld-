import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-sent events: pushes live activity to the app every few seconds
 * (new posts, new comments/likes, unread messages + notifications).
 * The connection is recycled every ~55s; EventSource reconnects automatically.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const enc = new TextEncoder();
  let last = new Date();
  let timer: ReturnType<typeof setInterval> | undefined;
  let killer: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      const close = () => { clearInterval(timer); clearTimeout(killer); try { controller.close(); } catch {} };
      controller.enqueue(enc.encode("retry: 3000\n\n"));

      const tick = async () => {
        if (++n % 8 === 0) void touch();
        const since = last; last = new Date();
        try {
          const [posts, comments, likes, unreadDm, unreadNotif, dms] = await Promise.all([
            db.post.findMany({ where: { createdAt: { gt: since }, isStory: false, NOT: { authorId: user.id } }, select: { id: true }, take: 20 }),
            db.comment.findMany({ where: { createdAt: { gt: since }, NOT: { authorId: user.id } }, select: { postId: true }, take: 50 }),
            db.postLike.findMany({ where: { createdAt: { gt: since }, NOT: { userId: user.id } }, select: { postId: true }, take: 50 }),
            db.directMessage.count({ where: { toId: user.id, readAt: null } }),
            db.notification.count({ where: { userId: user.id, readAt: null } }),
            db.directMessage.findMany({ where: { toId: user.id, createdAt: { gt: since } }, select: { fromId: true }, take: 20 }),
          ]);
          send("tick", {
            newPosts: posts.length,
            commentPostIds: [...new Set(comments.map((c) => c.postId))],
            likePostIds: [...new Set(likes.map((l) => l.postId))],
            dmFrom: [...new Set(dms.map((d) => d.fromId))],
            unreadDm, unreadNotif,
          });
        } catch { /* transient DB error — next tick will retry */ }
      };

      let n = 0;
      const touch = () => db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => null);
      void touch();
      void tick();
      timer = setInterval(tick, 3000);
      killer = setTimeout(close, 55_000);
      req.signal.addEventListener("abort", close);
    },
    cancel() { clearInterval(timer); clearTimeout(killer); },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}
