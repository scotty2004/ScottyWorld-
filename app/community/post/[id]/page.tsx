"use client";

import { use, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CornerDownRight, Send } from "lucide-react";
import { Avatar, ListSkeleton, ErrorNote } from "@/components/ui";
import { PostCard, type FeedPost } from "@/components/post-card";
import { api, timeAgo, useApi } from "@/lib/client";
import { useRealtime, type Tick } from "@/components/realtime";
import { toast } from "@/components/toast";

type C = { id: string; parentId: string | null; content: string; createdAt: string; isMine: boolean; author: { username: string; displayName: string; avatarUrl: string | null } };

function Thread({ items, parent, depth, onReply }: { items: C[]; parent: string | null; depth: number; onReply: (c: C) => void }) {
  const list = items.filter((c) => c.parentId === parent);
  if (!list.length) return null;
  return (
    <div className={depth > 0 ? "ml-5 border-l-2 border-border pl-3" : ""}>
      {list.map((c) => (
        <div key={c.id} className="py-2.5">
          <div className="flex gap-2.5">
            <Avatar name={c.author.displayName} src={c.author.avatarUrl} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px]"><b>{c.author.displayName}</b> <span className="text-subtle">@{c.author.username} · {timeAgo(c.createdAt)}</span></p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px]">{c.content}</p>
              {depth < 4 && <button onClick={() => onReply(c)} className="mt-1 flex items-center gap-1 text-xs font-semibold text-subtle hover:text-brand-600"><CornerDownRight size={13} /> Reply</button>}
            </div>
          </div>
          <Thread items={items} parent={c.id} depth={depth + 1} onReply={onReply} />
        </div>
      ))}
    </div>
  );
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, loading, error, reload } = useApi<{ post: FeedPost; comments: C[] }>(`/api/community/posts/${id}`);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<C | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // real-time: refresh when someone comments or likes this post
  const onTick = useCallback((t: Tick) => { if (t.commentPostIds.includes(id) || t.likePostIds.includes(id)) void reload(); }, [id, reload]);
  useRealtime(onTick);

  const comments = useMemo(() => data?.comments ?? [], [data]);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try { await api(`/api/community/posts/${id}/comments`, { method: "POST", json: { content: text, parentId: replyTo?.id } }); setText(""); setReplyTo(null); await reload(); }
    catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-xl">
        <button onClick={() => router.back()} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><ArrowLeft size={22} /></button>
        <h1 className="text-lg font-bold">Post</h1>
      </header>
      <div className="flex-1 space-y-3 px-4 py-4">
        {loading ? <ListSkeleton rows={2} /> : error || !data ? <ErrorNote message={error || "Post not found."} /> : (
          <>
            <PostCard post={data.post} detail onDeleted={() => router.push("/community")} />
            <h2 className="pt-2 text-[15px] font-bold">{comments.length} {comments.length === 1 ? "reply" : "replies"}</h2>
            {comments.length === 0 ? <p className="py-6 text-center text-sm text-subtle">No replies yet — start the conversation.</p> : <div className="sw-card divide-y-0 px-4 py-1"><Thread items={comments} parent={null} depth={0} onReply={(c) => { setReplyTo(c); input.current?.focus(); }} /></div>}
          </>
        )}
      </div>
      <div className="safe-bottom sticky bottom-0 border-t border-border bg-card px-3 py-2.5">
        {replyTo && <p className="mb-1.5 flex items-center justify-between px-1 text-xs text-subtle">Replying to @{replyTo.author.username}<button onClick={() => setReplyTo(null)} className="font-bold text-brand-600">Cancel</button></p>}
        <div className="flex items-center gap-2">
          <input ref={input} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} maxLength={3000} placeholder="Write a reply…" className="sw-input !rounded-full !py-2.5" />
          <button onClick={send} disabled={busy || !text.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white disabled:opacity-40"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
