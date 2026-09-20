"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Calendar, Crown, Lock, MessageCircle, MoreHorizontal, Settings, Ban, Flag } from "lucide-react";
import { Avatar, Empty, ErrorNote, ListSkeleton, Sheet, Tabs } from "./ui";
import { PostCard, type FeedPost } from "./post-card";
import { api, compact, useApi } from "@/lib/client";
import { toast } from "./toast";

type P = { username: string; displayName: string; bio: string; avatarUrl: string | null; joined: string; verified: boolean; staff: boolean; plan: string | null; private: boolean; counts: { posts: number; followers: number; following: number }; isMe: boolean; following: boolean };

function Cover() {
  return (
    <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" className="h-32 w-full sm:h-40" aria-hidden="true">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4f7dff" /><stop offset="1" stopColor="#a9c1ff" /></linearGradient></defs>
      <rect width="400" height="130" fill="url(#sky)" />
      <path d="M0 95 L60 45 L110 80 L170 25 L240 85 L300 40 L360 75 L400 55 V130 H0Z" fill="#3a5fd0" opacity=".85" />
      <path d="M0 110 L70 70 L130 100 L200 60 L270 105 L340 72 L400 98 V130 H0Z" fill="#1e3a8a" />
    </svg>
  );
}

export function ProfileView({ username }: { username: string }) {
  const router = useRouter();
  const prof = useApi<{ profile: P }>(`/api/profile/${username}`);
  const [tab, setTab] = useState<"posts" | "media">("posts");
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [menu, setMenu] = useState(false);
  const [following, setFollowing] = useState<boolean | null>(null);
  const p = prof.data?.profile;

  useEffect(() => { api<{ posts: FeedPost[] }>(`/api/community/posts?author=${username}`).then((r) => setPosts(r.posts)).catch(() => setPosts([])); }, [username]);
  useEffect(() => { if (p) setFollowing(p.following); }, [p]);

  async function follow() {
    if (!p) return; const prev = following; setFollowing(!prev);
    try { const r = await api<{ following: boolean }>(`/api/community/follow/${p.username}`, { method: "POST" }); setFollowing(r.following); prof.reload(); } catch (e) { setFollowing(prev); toast((e as Error).message, "err"); }
  }
  async function block() {
    if (!p || !confirm(`Block @${p.username}?`)) return;
    try { await api("/api/account/blocks", { method: "POST", json: { username: p.username } }); toast("User blocked"); router.push("/community"); } catch (e) { toast((e as Error).message, "err"); }
  }

  if (prof.loading) return <div className="p-4"><ListSkeleton rows={3} /></div>;
  if (prof.error || !p) return <div className="mx-auto max-w-2xl p-4"><ErrorNote message={prof.error || "Profile not found."} /></div>;

  const shown = (posts ?? []).filter((x) => tab === "posts" || x.mediaUrl);
  const locked = p.private && !p.isMe && !following;

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <div className="relative"><Cover />
        <div className="absolute inset-x-3 top-3 flex justify-between">
          <button onClick={() => router.back()} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur">←</button>
          {p.isMe ? <Link href="/settings" aria-label="Settings" className="grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur"><Settings size={18} /></Link> : <button onClick={() => setMenu(true)} aria-label="More" className="grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur"><MoreHorizontal size={18} /></button>}
        </div>
      </div>
      <div className="px-4">
        <div className="-mt-12 flex items-end justify-between">
          <span className="rounded-full bg-background p-1"><Avatar name={p.displayName} src={p.avatarUrl} size={92} /></span>
          <div className="flex gap-2 pb-1">
            {p.isMe ? <Link href="/settings/account" className="sw-btn-ghost !rounded-full !px-5 !py-2">Edit Profile</Link> : (
              <>
                <Link href={`/messages/${p.username}`} aria-label="Message" className="sw-btn-ghost !rounded-full !px-3.5 !py-2"><MessageCircle size={18} /></Link>
                <button onClick={follow} className={`!rounded-full !px-5 !py-2 ${following ? "sw-btn-ghost" : "sw-btn"}`}>{following ? "Following" : "Follow"}</button>
              </>
            )}
          </div>
        </div>
        <h1 className="mt-3 flex items-center gap-1.5 text-2xl font-extrabold">{p.displayName}{(p.verified || p.staff) && <BadgeCheck size={21} className="text-brand-600" />}</h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-2"><span className="text-[15px] text-subtle">@{p.username}</span>
          {p.staff && <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">Team</span>}
          {p.plan && <span className="flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold capitalize text-amber-700 dark:text-amber-300"><Crown size={11} />{p.plan}</span>}</div>
        {p.bio && <p className="mt-3 whitespace-pre-wrap text-[15px]">{p.bio}</p>}
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-subtle"><Calendar size={14} /> Joined {new Date(p.joined).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>

        <div className="mt-4 grid grid-cols-3 border-y border-border py-3 text-center">
          {[["Posts", p.counts.posts], ["Followers", p.counts.followers], ["Following", p.counts.following]].map(([l, v]) => <div key={l as string}><p className="text-xl font-extrabold">{compact(v as number)}</p><p className="text-xs text-subtle">{l}</p></div>)}
        </div>

        <div className="mt-1"><Tabs items={[{ id: "posts", label: "Posts" }, { id: "media", label: "Media" }]} value={tab} onChange={setTab} /></div>
        <div className="mt-3 space-y-3">
          {locked ? <Empty icon={<Lock size={26} />} title="This account is private" text="Follow this account to see their posts." />
            : posts === null ? <ListSkeleton rows={2} /> : shown.length === 0 ? <Empty title={tab === "media" ? "No photos or videos yet" : "No posts yet"} /> : shown.map((x) => <PostCard key={x.id} post={x} onDeleted={(id) => setPosts((c) => (c ?? []).filter((y) => y.id !== id))} />)}
        </div>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)}>
        <button onClick={block} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left font-semibold text-red-600 hover:bg-soft"><Ban size={20} /> Block @{p.username}</button>
        <button onClick={() => { setMenu(false); toast("Report the user's posts from the post menu."); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left font-semibold hover:bg-soft"><Flag size={20} /> Report</button>
      </Sheet>
    </div>
  );
}
