"use client";

import { useState } from "react";
import { Check, Coins, Crown, Sparkles } from "lucide-react";
import { Badge, ListSkeleton, Page, Sheet, SubHeader } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";
import Link from "next/link";

type Plan = { id: string; slug: string; name: string; description: string | null; priceCents: number; priceCoins: number; features: string[] };
type Me = { entitlements: { tier: string }; subscription: null | { plan: { slug: string; name: string }; renewsAt: string | null } };

const STYLE: Record<string, { bar: string; ring: string; tag?: string }> = {
  silver: { bar: "tier-silver", ring: "" }, bronze: { bar: "tier-bronze", ring: "" },
  gold: { bar: "tier-gold", ring: "ring-2 ring-amber-400/60", tag: "Most popular" }, platinum: { bar: "tier-platinum", ring: "ring-2 ring-brand-500/60", tag: "Full access" },
};

export default function ProPage() {
  const plans = useApi<{ plans: Plan[] }>("/api/pro/plans");
  const me = useApi<Me>("/api/pro/me");
  const coins = useApi<{ balance: number }>("/api/coins");
  const [pick, setPick] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const current = me.data?.subscription?.plan.slug;

  async function buy() {
    if (!pick) return; setBusy(true);
    try { const r = await api<{ message: string }>("/api/pro/subscribe", { method: "POST", json: { planId: pick.id } }); toast(r.message); setPick(null); await Promise.all([me.reload(), coins.reload()]); }
    catch (e: any) { toast(e.message, "err"); } finally { setBusy(false); }
  }

  return (
    <Page width="lg">
      <SubHeader title="ScottyWorld Pro" backHref="/menu" />
      <div className="wallet-card rounded-3xl p-5 text-white shadow-float">
        <Crown size={26} /><h2 className="mt-2 text-2xl font-extrabold">Unlock more of ScottyWorld</h2>
        <p className="mt-1 text-sm text-white/85">More AI messages, bots, cloud space and marketplace listings — plus bonus coins on every task.</p>
        {current && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold"><Sparkles size={14} /> You&apos;re on {me.data!.subscription!.plan.name}{me.data!.subscription!.renewsAt ? ` · until ${new Date(me.data!.subscription!.renewsAt).toLocaleDateString()}` : ""}</p>}
      </div>

      <div className="sw-card mt-3 flex items-center justify-between px-4 py-3 text-sm"><span className="text-subtle">Your balance</span><Link href="/coins" className="flex items-center gap-1.5 font-extrabold text-amber-600"><Coins size={16} />{coins.data?.balance ?? "…"} SC</Link></div>

      {plans.loading ? <div className="mt-4"><ListSkeleton /></div> : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {plans.data?.plans.map((p) => { const st = STYLE[p.slug] ?? STYLE.silver; const mine = current === p.slug; return (
            <div key={p.id} className={`sw-card overflow-hidden ${st.ring}`}>
              <div className={`${st.bar} flex items-center justify-between px-5 py-4 text-white`}>
                <div><p className="text-lg font-extrabold drop-shadow">{p.name}</p><p className="text-xs opacity-90">per month</p></div>
                <div className="text-right"><p className="text-3xl font-black drop-shadow">${(p.priceCents / 100).toFixed(0)}</p><p className="text-xs font-semibold opacity-90">{p.priceCoins} SC</p></div>
              </div>
              <div className="p-5">
                {st.tag && <Badge tone={p.slug === "gold" ? "amber" : "blue"}>{st.tag}</Badge>}
                <p className="mt-2 text-sm text-subtle">{p.description}</p>
                <ul className="mt-3 space-y-2">{p.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />{f}</li>)}</ul>
                <button onClick={() => setPick(p)} disabled={mine} className="sw-btn mt-5 w-full py-3">{mine ? "Current plan" : current ? "Switch to " + p.name : `Get ${p.name}`}</button>
              </div>
            </div>); })}
        </div>
      )}
      <p className="mt-4 text-center text-xs text-subtle">Pro lasts 30 days per purchase. Pay with Scotty Coins (40 SC = $1). Free plan: 20 AI messages/day, 1 bot, 100 MB cloud, 3 listings.</p>

      <Sheet open={!!pick} onClose={() => setPick(null)} title={`Get ${pick?.name}`}>
        {pick && <>
          <p className="text-[15px]">Activate <b>{pick.name}</b> for 30 days for <b>{pick.priceCoins} SC</b> (${(pick.priceCents / 100).toFixed(2)}).</p>
          <p className="mt-2 text-sm text-subtle">Your balance: {coins.data?.balance ?? 0} SC{(coins.data?.balance ?? 0) < pick.priceCoins ? " — you need more coins." : ""}</p>
          <button onClick={buy} disabled={busy} className="sw-btn mt-5 w-full py-3.5">{busy ? "Activating…" : `Pay ${pick.priceCoins} SC`}</button>
          {(coins.data?.balance ?? 0) < pick.priceCoins && <Link href="/coins" className="mt-3 block text-center text-sm font-semibold text-brand-600">Deposit or earn coins</Link>}
        </>}
      </Sheet>
    </Page>
  );
}
