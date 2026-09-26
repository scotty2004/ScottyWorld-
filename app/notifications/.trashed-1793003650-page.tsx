"use client";

import { useState } from "react";
import { Bell, Bot, Check, Coins, Crown, GraduationCap, Heart, ShieldAlert, Store, UserPlus, type LucideIcon } from "lucide-react";
import { Empty, ListSkeleton, Page, SubHeader, Tabs } from "@/components/ui";
import { api, timeAgo, useApi } from "@/lib/client";

type N = { id: string; type: string; title: string; body: string; readAt: string | null; createdAt: string };
const ICON: Record<string, [LucideIcon, string]> = {
  COMMUNITY: [Heart, "bg-red-50 text-red-500 dark:bg-red-500/15"], REFERRAL: [UserPlus, "bg-brand-50 text-brand-600 dark:bg-brand-500/15"], MARKETPLACE: [Store, "bg-violet-50 text-violet-600 dark:bg-violet-500/15"],
  PRO: [Crown, "bg-amber-50 text-amber-600 dark:bg-amber-500/15"], BOT: [Bot, "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15"], ACADEMY: [GraduationCap, "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15"],
  SECURITY: [ShieldAlert, "bg-red-50 text-red-600 dark:bg-red-500/15"], SYSTEM: [Coins, "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15"],
};
const FILTERS = [{ id: "all", label: "All" }, { id: "unread", label: "Unread" }, { id: "COMMUNITY", label: "Community" }, { id: "SYSTEM", label: "Wallet" }, { id: "MARKETPLACE", label: "Market" }] as const;

export default function NotificationsPage() {
  const { data, loading, reload, setData } = useApi<{ notifications: N[]; unread: number }>("/api/notifications");
  const [tab, setTab] = useState<(typeof FILTERS)[number]["id"]>("all");
  const list = (data?.notifications ?? []).filter((n) => tab === "all" || (tab === "unread" ? !n.readAt : n.type === tab));

  async function readAll() { await api("/api/notifications", { method: "PATCH", json: { all: true } }); await reload(); }
  async function readOne(n: N) {
    if (n.readAt) return;
    setData((d) => d && { ...d, unread: Math.max(0, d.unread - 1), notifications: d.notifications.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) } as any);
    await api("/api/notifications", { method: "PATCH", json: { id: n.id } }).catch(() => null);
  }

  const groups = [["Today", (n: N) => Date.now() - new Date(n.createdAt).getTime() < 86_400_000], ["Earlier", (n: N) => Date.now() - new Date(n.createdAt).getTime() >= 86_400_000]] as const;

  return (
    <Page>
      <SubHeader title="Notifications" backHref="/menu" right={(data?.unread ?? 0) > 0 && <button onClick={readAll} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-brand-600 hover:bg-soft"><Check size={16} /> Read all</button>} />
      <Tabs items={FILTERS.map((f) => ({ id: f.id, label: f.label, badge: f.id === "unread" ? data?.unread : undefined }))} value={tab} onChange={setTab} />
      <div className="mt-2">
        {loading ? <ListSkeleton /> : list.length === 0 ? <div className="mt-4"><Empty icon={<Bell size={26} />} title="You're all caught up" text="New likes, replies, coins and updates will appear here." /></div> : groups.map(([label, test]) => {
          const items = list.filter(test); if (!items.length) return null;
          return (
            <section key={label} className="mt-4"><h2 className="mb-2 text-[15px] font-bold">{label}</h2>
              <div className="sw-card divide-y divide-border overflow-hidden">
                {items.map((n) => { const [I, c] = ICON[n.type] ?? ICON.SYSTEM; return (
                  <button key={n.id} onClick={() => readOne(n)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${n.readAt ? "" : "bg-brand-50/60 dark:bg-brand-500/5"}`}>
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${c}`}><I size={19} /></span>
                    <div className="min-w-0 flex-1"><p className="text-[14.5px] font-semibold">{n.title}</p><p className="line-clamp-2 text-[13px] text-subtle">{n.body}</p><p className="mt-0.5 text-xs text-subtle">{timeAgo(n.createdAt)} ago</p></div>
                    {!n.readAt && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />}
                  </button>); })}
              </div></section>);
        })}
      </div>
    </Page>
  );
}
