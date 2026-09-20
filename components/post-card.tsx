"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, BadgeCheck, Flag, Heart, MessageCircle, MoreHorizontal, Repeat2, Share2, Trash2, Ban, Link2 } from "lucide-react";
import { Avatar, Sheet } from "./ui";
import { api, compact, copyText, timeAgo } from "@/lib/client";
import { toast } from "./toast";

export type FeedPost = {
  id: string; type: string; title: string | null; content: string; tags: string[]; mediaUrl: string | null; mediaType: string | null; createdAt: string; isMine: boolean;
  author: { username: string; displayName: string; avatarUrl: string | null; staff: boolean };
  counts: { likes: number; comments: number; shares: number }; liked: boolean; saved: boolean;
  shared: null | { id: string; content: string; mediaUrl: string | null; mediaType: string | null; author: { username: string; displayName: string } };
};

export function Media({ url, type, className = "" }: { url: string; type: string | null; className?: string }) {
  if (type === "VIDEO") return <video src={url} controls playsInline preload="metadata" className={`w-full rounded-xl bg-black ${className}`} />;
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={url} alt="" loading="lazy" className={`w-full rounded-xl object-cover ${className}`} />;
}

const TAG_STYLE: Record<string, string> = { QUESTION: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", PROJECT: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" };

export function PostCard({ post: initial, onDeleted, detail = false }: { post: FeedPost; onDeleted?: (id: string) => void; detail?: boolean }) {
  const [p, setP] = useState(initial);
  const [menu, setMenu] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const href = `/community/post/${p.id}`;

  async function like() {
    const prev = p;
    setP({ ...p, liked: !p.liked, counts: { ...p.counts, likes: p.counts.likes + (p.liked ? -1 : 1) } });
    try { const r = await api<{ liked: boolean; likes: number }>(`/api/community/posts/${p.id}/like`, { method: "POST" }); setP((c) => ({ ...c, liked: r.liked, counts: { ...c.counts, likes: r.likes } })); }
    catch (e) { setP(prev); toast((e as Error).message, "err"); }
  }
  async function save() {
    try { const r = await api<{ saved: boolean }>(`/api/community/posts/${p.id}/bookmark`, { method: "POST" }); setP({ ...p, saved: r.saved }); toast(r.saved ? "Saved" : "Removed from saved"); } catch (e) { toast((e as Error).message, "err"); }
  }
  async function repost() {
    try { await api("/api/community/posts", { method: "POST", json: { type: "POST", content: "", sharedPostId: p.id } }); setP({ ...p, counts: { ...p.counts, shares: p.counts.shares + 1 } }); setShareOpen(false); toast("Shared to your feed"); } catch (e) { toast((e as Error).message, "err"); }
  }
  async function copyLink() {
    const url = `${window.location.origin}${href}`;
    if (navigator.share) { try { await navigator.share({ title: "ScottyWorld", url }); setShareOpen(false); return; } catch { /* cancelled */ } }
    toast((await copyText(url)) ? "Link copied" : "Couldn't copy", "ok"); setShareOpen(false);
  }
  async function del() {
    if (!confirm("Delete this post?")) return;
    try { await api(`/api/community/posts/${p.id}`, { method: "DELETE" }); onDeleted?.(p.id); toast("Post deleted"); } catch (e) { toast((e as Error).message, "err"); }
    setMenu(false);
  }
  async function report() {
    try { await api(`/api/community/posts/${p.id}/report`, { method: "POST", json: { reason: "SPAM", details: "" } }); toast("Reported. Thanks for keeping ScottyWorld safe."); } catch (e) { toast((e as Error).message, "err"); }
    setMenu(false);
  }
  async function block() {
    if (!confirm(`Block @${p.author.username}? You won't see each other's posts.`)) return;
    try { await api("/api/account/blocks", { method: "POST", json: { username: p.author.username } }); onDeleted?.(p.id); toast("User blocked"); } catch (e) { toast((e as Error).message, "err"); }
    setMenu(false);
  }

  return (
    <article className="sw-card p-4">
      <header className="flex items-start gap-3">
        <Link href={`/u/${p.author.username}`}><Avatar name={p.author.displayName} src={p.author.avatarUrl} size={42} /></Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${p.author.username}`} className="flex items-center gap-1 text-[15px] font-bold leading-tight">
            <span className="truncate">{p.author.displayName}</span>{p.author.staff && <BadgeCheck size={15} className="shrink-0 text-brand-600" />}
          </Link>
          <p className="truncate text-[13px] text-subtle">@{p.author.username} · {timeAgo(p.createdAt)}</p>
        </div>
        {p.type !== "POST" && <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${TAG_STYLE[p.type]}`}>{p.type === "QUESTION" ? "Question" : "Project"}</span>}
        <button onClick={() => setMenu(true)} aria-label="More" className="-mr-2 grid h-9 w-9 place-items-center rounded-full text-subtle hover:bg-soft"><MoreHorizontal size={20} /></button>
      </header>

      <Link href={detail ? "#" : href} className="mt-3 block" onClick={(e) => detail && e.preventDefault()}>
        {p.title && <h3 className="mb-1 text-base font-bold">{p.title}</h3>}
        {p.content && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{p.content}</p>}
      </Link>
      {p.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="text-[13px] font-medium text-brand-600">#{t}</span>)}</div>}
      {p.mediaUrl && <div className="mt-3"><Media url={p.mediaUrl} type={p.mediaType} className="max-h-[420px]" /></div>}

      {p.shared && (
        <Link href={`/community/post/${p.shared.id}`} className="mt-3 block rounded-xl border border-border bg-soft/60 p-3">
          <p className="text-[13px] font-bold">{p.shared.author.displayName} <span className="font-normal text-subtle">@{p.shared.author.username}</span></p>
          {p.shared.content && <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm">{p.shared.content}</p>}
          {p.shared.mediaUrl && <div className="mt-2"><Media url={p.shared.mediaUrl} type={p.shared.mediaType} className="max-h-56" /></div>}
        </Link>
      )}

      <footer className="-mb-1 mt-3 flex items-center gap-1 text-subtle">
        <button onClick={like} className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold transition hover:bg-soft ${p.liked ? "text-red-500" : ""}`} aria-pressed={p.liked}>
          <Heart size={20} className={p.liked ? "fill-red-500" : ""} />{compact(p.counts.likes)}
        </button>
        <Link href={href} className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold hover:bg-soft"><MessageCircle size={20} />{compact(p.counts.comments)}</Link>
        <button onClick={() => setShareOpen(true)} className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold hover:bg-soft"><Share2 size={19} />{p.counts.shares > 0 ? compact(p.counts.shares) : "Share"}</button>
        <button onClick={save} aria-label="Save" className={`ml-auto rounded-full p-2 hover:bg-soft ${p.saved ? "text-brand-600" : ""}`}><Bookmark size={20} className={p.saved ? "fill-brand-600" : ""} /></button>
      </footer>

      <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title="Share post">
        <div className="space-y-1">
          <button onClick={repost} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left font-semibold hover:bg-soft"><Repeat2 size={20} className="text-brand-600" /> Repost to community</button>
          <button onClick={copyLink} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left font-semibold hover:bg-soft"><Link2 size={20} className="text-brand-600" /> Copy link / share…</button>
        </div>
      </Sheet>
      <Sheet open={menu} onClose={() => setMenu(false)}>
        <div className="space-y-1">
          {p.isMine ? (
            <button onClick={del} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left font-semibold text-red-600 hover:bg-soft"><Trash2 size={20} /> Delete post</button>
          ) : (
            <>
              <button onClick={report} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left font-semibold hover:bg-soft"><Flag size={20} /> Report</button>
              <button onClick={block} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left font-semibold text-red-600 hover:bg-soft"><Ban size={20} /> Block @{p.author.username}</button>
            </>
          )}
        </div>
      </Sheet>
    </article>
  );
}
