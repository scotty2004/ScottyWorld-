"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Coins, LogOut } from "lucide-react";
import { Avatar, Page } from "@/components/ui";
import { MENU_GROUPS } from "@/lib/navigation";
import { useRealtimeState } from "@/components/realtime";
import { api, useApi } from "@/lib/client";

export default function MenuPage() {
  const router = useRouter();
  const live = useRealtimeState();
  const acc = useApi<{ account: { displayName: string; username: string; avatarUrl: string | null; plan: string | null; planName: string | null } }>("/api/account");
  const coins = useApi<{ balance: number }>("/api/coins");
  const a = acc.data?.account;

  async function logout() { await api("/api/auth/logout", { method: "POST" }).catch(() => null); router.push("/login"); router.refresh(); }

  return (
    <Page>
      <Link href="/profile" className="sw-card flex items-center gap-3.5 p-4">
        <Avatar name={a?.displayName ?? "You"} src={a?.avatarUrl} size={56} />
        <div className="min-w-0 flex-1"><p className="truncate text-lg font-extrabold">{a?.displayName ?? "…"}</p><p className="truncate text-sm text-subtle">@{a?.username}</p>
          {a?.planName && <span className="mt-1 inline-block rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">{a.planName}</span>}</div>
        <ChevronRight size={20} className="text-subtle" />
      </Link>
      <Link href="/coins" className="wallet-card mt-3 flex items-center justify-between rounded-2xl p-4 text-white shadow-float"><span className="flex items-center gap-2 text-sm font-semibold"><Coins size={19} /> Scotty Coins</span><span className="text-xl font-extrabold">{coins.data?.balance ?? "…"} SC</span></Link>

      {MENU_GROUPS.map((g) => (
        <section key={g.title} className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-subtle">{g.title}</h2>
          <div className="sw-card divide-y divide-border overflow-hidden">
            {g.items.map((it) => { const I = it.icon; const badge = it.href === "/messages" ? live.unreadDm : it.href === "/notifications" ? live.unreadNotif : 0; return (
              <Link key={it.href} href={it.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-soft">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15"><I size={20} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{it.label}</span>{it.desc && <span className="block truncate text-[13px] text-subtle">{it.desc}</span>}</span>
                {badge > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{badge}</span>}
                <ChevronRight size={18} className="text-subtle" />
              </Link>); })}
          </div>
        </section>
      ))}
      <button onClick={logout} className="sw-card mt-6 flex w-full items-center gap-3 px-4 py-3.5 text-left font-semibold text-red-600"><span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 dark:bg-red-500/15"><LogOut size={20} /></span>Log out</button>
    </Page>
  );
}
