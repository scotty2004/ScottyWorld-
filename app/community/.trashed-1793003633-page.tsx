"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Plus, Users } from "lucide-react";
import { Avatar, Empty, ListSkeleton, Page, Tabs, Chips, Sheet } from "@/components/ui";
import { PostCard, Media, type FeedPost } from "@/components/post-card";
import { api, timeAgo, useApi } from "@/lib/client";
import { useNewPostsPill } from "@/lib/use-live-feed";
import { toast } from "@/components/toast";

type Group = { userId: string; username: string; displayName: string; avatarUrl: string | null; mine: boolean; stories: Array<{ id: string; content: string; mediaUrl: string | null; mediaType: string | null; createdAt: string }> };

function Stories() {
  const { data } = useApi<{ groups: Group[] }>("/api/community/stories");
  const [open, setOpen] = useState<Group | null>(null);
  const [idx, setIdx] = useState(0);
  const groups = data?.groups ?? [];
  const mine = groups.find((g) => g.mine);
  const others = groups.filter((g) => !g.mine);

  const view = (g: Group) => { setIdx(0); setOpen(g); };
  const story = open?.stories[open.stories.length - 1 - idx];

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1">
        <Link href="/community/create?kind=story" className="flex w-16 shrink-0 flex-col items-center gap-1.5">
          <span className="relative grid h-[62px] w-[62px] place-items-center rounded-full border-2 border-dashed border-brand-400 text-brand-600"><Plus size={24} /></span>
          <span className="text-[11px] font-medium text-subtle">Your story</span>
        </Link>
        {[...(mine ? [mine] : []), ...others].map((g) => (
          <button key={g.userId} onClick={() => view(g)} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <Avatar name={g.displayName} src={g.avatarUrl} size={62} ring />
            <span className="w-full truncate text-[11px] font-medium">{g.mine ? "You" : g.displayName.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      {open && story && (
        <div className="fixed inset-0 z-[95] flex flex-col bg-black text-white" role="dialog">
          <div className="flex gap-1 px-3 pt-3 safe-top">{open.stories.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-white" : "bg-white/30"}`} />)}</div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar name={open.displayName} src={open.avatarUrl} size={36} />
            <div className="flex-1"><p className="text-sm font-bold">{open.displayName}</p><p className="text-xs text-white/60">{timeAgo(story.createdAt)}</p></div>
            <button onClick={() => setOpen(null)} className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-white/10">Close</button>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4" onClick={() => (idx + 1 < open.stories.length ? setIdx(idx + 1) : setOpen(null))}>
            {story.mediaUrl ? <Media url={story.mediaUrl} type={story.mediaType} className="max-h-full !rounded-2xl !object-contain" /> : (
              <div className="grid h-full max-h-[70dvh] w-full max-w-sm place-items-center rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-800 p-8 text-center text-2xl font-bold">{story.content}</div>
            )}
          </div>
          {story.mediaUrl && story.content && <p className="px-6 pb-8 text-center text-base">{story.content}</p>}
        </div>
      )}
    </>
  );
}

const TABS = [{ id: "for-you", label: "For You" }, { id: "following", label: "Following" }, { id: "trending", label: "Trending" }] as const;
const TYPES = [{ id: "", label: "All" }, { id: "POST", label: "Posts" }, { id: "QUESTION", label: "Questions" }, { id: "PROJECT", label: "Projects" }];

export default function CommunityPage() {
  const [feed, setFeed] = useState<(typeof TABS)[number]["id"]>("for-you");
  const [type, setType] = useState("");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const pill = useNewPostsPill();
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async (reset: boolean, from: string | null = null) => {
    if (reset) setLoading(true); else setMore(true);
    try {
      const qs = new URLSearchParams({ feed, ...(type ? { type } : {}), ...(from ? { cursor: from } : {}) });
      const r = await api<{ posts: FeedPost[]; nextCursor: string | null }>(`/api/community/posts?${qs}`);
      setPosts((p) => (reset ? r.posts : [...p, ...r.posts])); setCursor(r.nextCursor); setError("");
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); setMore(false); }
  }, [feed, type]);

  useEffect(() => { void load(true); pill.clear(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [load]);

  // infinite scroll
  useEffect(() => {
    const el = sentinel.current; if (!el || !cursor) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && !more) void load(false, cursor); }, { rootMargin: "400px" });
    io.observe(el); return () => io.disconnect();
  }, [cursor, more, load]);

  return (
    <Page>
      <Tabs items={TABS.map((t) => ({ id: t.id, label: t.label }))} value={feed} onChange={setFeed} />
      <div className="mt-3"><Stories /></div>
      <div className="mt-3"><Chips items={TYPES} value={type} onChange={setType} /></div>

      {pill.count > 0 && (
        <button onClick={() => { pill.clear(); window.scrollTo({ top: 0, behavior: "smooth" }); void load(true); }} className="fixed left-1/2 top-20 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-float">
          <ArrowUp size={16} /> {pill.count} new post{pill.count > 1 ? "s" : ""}
        </button>
      )}

      <div className="mt-3 space-y-3">
        {loading ? <ListSkeleton rows={3} /> : error ? (
          <Empty title="Couldn't load the feed" text={error} action={<button className="sw-btn" onClick={() => load(true)}>Try again</button>} />
        ) : posts.length === 0 ? (
          <Empty icon={<Users size={26} />} title={feed === "following" ? "Nobody to show yet" : "No posts yet"} text={feed === "following" ? "Follow people to see their posts here." : "Start the conversation — share a photo, video or idea."} action={<Link href="/community/create" className="sw-btn">Create a post</Link>} />
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} onDeleted={(id) => setPosts((x) => x.filter((y) => y.id !== id))} />)
        )}
        {cursor && <div ref={sentinel} className="py-4 text-center text-sm text-subtle">{more ? "Loading…" : ""}</div>}
      </div>

      <Link href="/community/create" aria-label="Create post" className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-float lg:bottom-8 lg:right-8"><Plus size={28} /></Link>
    </Page>
  );
}
