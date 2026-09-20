"use client";

import Link from "next/link";
import { Bell, Coins, Heart, ImageIcon, MessageCircle, Pencil, Sparkles, UserPlus, Video, Store, Bot } from "lucide-react";
import { Avatar, Empty, ListSkeleton, Page, Section } from "@/components/ui";
import { PostCard, type FeedPost } from "@/components/post-card";
import { PeopleYouMayKnow } from "@/components/people-strip";
import { timeAgo, useApi } from "@/lib/client";

type Account = { account: { displayName: string; avatarUrl: string | null } };
type Notif = { notifications: Array<{ id: string; type: string; title: string; body: string; createdAt: string; readAt: string | null }> };

const ICON: Record<string, { i: typeof Bell; c: string }> = {
  COMMUNITY: { i: Heart, c: "bg-red-50 text-red-500 dark:bg-red-500/15" },
  REFERRAL: { i: UserPlus, c: "bg-brand-50 text-brand-600 dark:bg-brand-500/15" },
  MARKETPLACE: { i: Store, c: "bg-violet-50 text-violet-600 dark:bg-violet-500/15" },
  PRO: { i: Sparkles, c: "bg-amber-50 text-amber-600 dark:bg-amber-500/15" },
  BOT: { i: Bot, c: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15" },
  SYSTEM: { i: Coins, c: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15" },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const acc = useApi<Account>("/api/account");
  const feed = useApi<{ posts: FeedPost[] }>("/api/community/posts?feed=for-you");
  const notifs = useApi<Notif>("/api/notifications");
  const name = acc.data?.account.displayName ?? "";
  const first = name.split(" ")[0];

  return (
    <Page>
      {/* welcome */}
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold">{greeting()}{first ? `, ${first}` : ""} <span>👋</span></h1>
        <p className="mt-0.5 text-sm text-subtle">Ready to learn, build and grow today?</p>
      </div>

      {/* what's on your mind */}
      <div className="sw-card p-3.5">
        <Link href="/community/create" className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-subtle">
          <Avatar name={name || "You"} src={acc.data?.account.avatarUrl} size={34} /><span className="text-[15px]">What&apos;s on your mind?</span>
        </Link>
        <div className="mt-2.5 grid grid-cols-3 gap-1 text-[13px] font-semibold text-subtle">
          {[[ImageIcon, "Photo", "photo"], [Video, "Video", "video"], [Pencil, "Write", "write"]].map(([I, l, k]: any) => (
            <Link key={k} href={`/community/create?kind=${k}`} className="flex items-center justify-center gap-2 rounded-lg py-2 hover:bg-soft"><I size={18} className="text-brand-600" />{l}</Link>
          ))}
        </div>
      </div>

      {/* recent activity */}
      <Section title="Recent activity" href="/notifications">
        {notifs.loading ? <ListSkeleton rows={2} /> : !notifs.data?.notifications.length ? (
          <Empty icon={<Bell size={26} />} title="Nothing yet" text="Likes, replies, coin rewards and updates will show up here." />
        ) : (
          <div className="sw-card divide-y divide-border overflow-hidden">
            {notifs.data.notifications.slice(0, 4).map((n) => {
              const m = ICON[n.type] ?? ICON.SYSTEM; const I = m.i;
              return (
                <div key={n.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${m.c}`}><I size={18} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{n.title}</p><p className="truncate text-[13px] text-subtle">{n.body}</p></div>
                  <span className="text-xs text-subtle">{timeAgo(n.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* for you */}
      <Section title="For you" href="/community" action="Following">
        {feed.loading ? <ListSkeleton rows={2} /> : !feed.data?.posts.length ? (
          <Empty icon={<MessageCircle size={26} />} title="The feed is waiting for you" text="Be the first to share something with the community." action={<Link href="/community/create" className="sw-btn">Create a post</Link>} />
        ) : (
          <div className="space-y-3">{feed.data.posts.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
            <Link href="/community" className="sw-btn-ghost w-full">See more in Community</Link></div>
        )}
      </Section>

      {/* people you may know */}
      <Section title="People you may know"><PeopleYouMayKnow /></Section>
    </Page>
  );
}
