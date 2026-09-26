"use client";

import Link from "next/link";
import { Award, Bot, Crown, GraduationCap, Medal, Rocket, Store, Trophy, Users, MessageCircle, Sparkles } from "lucide-react";
import { Avatar, Badge, ListSkeleton, Page, Section, SubHeader } from "@/components/ui";
import { compact, useApi } from "@/lib/client";

type D = { top: Array<{ rank: number; username: string; displayName: string; avatarUrl: string | null; score: number; posts: number; tasks: number; referrals: number; badge: { name: string; tone: string } | null; isMe: boolean }>; me: { score: number; rank: number | null }; platform: { users: number; posts: number; bots: number; products: number; courses: number }; comingSoon: Array<{ title: string; description: string }> };

const TONE: Record<string, string> = { gold: "from-amber-400 to-yellow-600", silver: "from-slate-300 to-slate-500", bronze: "from-orange-400 to-amber-700", blue: "from-brand-400 to-brand-700" };

export default function AnalyticsPage() {
  const { data, loading } = useApi<D>("/api/analytics");
  return (
    <Page>
      <SubHeader title="Analytics" backHref="/menu" />
      {loading || !data ? <ListSkeleton /> : (
        <>
          <div className="wallet-card rounded-3xl p-5 text-white shadow-float">
            <p className="flex items-center gap-2 text-sm font-semibold text-white/85"><Trophy size={17} /> Your week</p>
            <div className="mt-2 flex items-end gap-6"><div><p className="text-4xl font-extrabold">{data.me.score}</p><p className="text-xs text-white/75">points</p></div>
              <div><p className="text-4xl font-extrabold">{data.me.rank ? `#${data.me.rank}` : "—"}</p><p className="text-xs text-white/75">rank</p></div></div>
            <p className="mt-3 text-xs text-white/80">Points: post ×3 · comment ×1 · like received ×1 · approved task ×2 · referral ×5</p>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2 text-center">
            {[[Users, "Members", data.platform.users], [MessageCircle, "Posts", data.platform.posts], [Bot, "Bots", data.platform.bots], [Store, "Items", data.platform.products], [GraduationCap, "Courses", data.platform.courses]].map(([I, l, v]: any) => (
              <div key={l} className="sw-card px-1 py-3"><I size={17} className="mx-auto text-brand-600" /><p className="mt-1 text-base font-extrabold">{compact(v)}</p><p className="text-[10px] text-subtle">{l}</p></div>
            ))}
          </div>

          <Section title="Top users this week">
            {data.top.length === 0 ? <div className="sw-card p-8 text-center"><Crown className="mx-auto text-amber-500" size={30} /><p className="mt-2 font-bold">The leaderboard is open</p><p className="mt-1 text-sm text-subtle">Post, comment and complete tasks to claim the #1 spot.</p><Link href="/community/create" className="sw-btn mt-4">Create a post</Link></div> : (
              <div className="sw-card divide-y divide-border overflow-hidden">
                {data.top.map((u) => (
                  <Link key={u.username} href={`/u/${u.username}`} className={`flex items-center gap-3 px-4 py-3.5 ${u.isMe ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${u.rank <= 3 ? `bg-gradient-to-br text-white ${TONE[u.badge?.tone ?? "blue"]}` : "bg-soft text-subtle"}`}>{u.rank}</span>
                    <Avatar name={u.displayName} src={u.avatarUrl} size={40} />
                    <div className="min-w-0 flex-1"><p className="truncate font-bold">{u.displayName}{u.isMe && <span className="ml-1 text-xs font-medium text-brand-600">(you)</span>}</p><p className="text-xs text-subtle">{u.posts} posts · {u.tasks} tasks · {u.referrals} referrals</p></div>
                    <div className="text-right"><p className="font-extrabold">{u.score}</p>{u.badge && <span className={`mt-0.5 inline-flex items-center gap-1 rounded-md bg-gradient-to-br px-1.5 py-0.5 text-[10px] font-bold text-white ${TONE[u.badge.tone] ?? TONE.blue}`}>{u.rank === 1 ? <Crown size={10} /> : u.rank <= 3 ? <Medal size={10} /> : <Award size={10} />}{u.badge.name}</span>}</div>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section title="Coming soon">
            <div className="grid gap-3 sm:grid-cols-2">
              {data.comingSoon.map((c) => (
                <div key={c.title} className="sw-card flex gap-3 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15">{c.title.includes("Live") ? <Rocket size={19} /> : <Sparkles size={19} />}</span>
                  <div><p className="flex items-center gap-2 font-bold">{c.title}<Badge tone="purple">Soon</Badge></p><p className="mt-0.5 text-[13px] text-subtle">{c.description}</p></div></div>
              ))}
            </div>
          </Section>
        </>
      )}
    </Page>
  );
}
