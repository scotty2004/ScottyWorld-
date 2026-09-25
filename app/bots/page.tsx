"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { Bot, Check, Clock, Coins, Copy, Plus, RefreshCw, Smartphone, Sparkles, Zap } from "lucide-react";
import { Badge, Empty, ErrorNote, Field, ListSkeleton, Page, Sheet } from "@/components/ui";
import { api, useApi, useCountdown } from "@/lib/client";
import { ECONOMY } from "@/lib/economy";
import { toast } from "@/components/toast";

type B = { id: string; name: string; status: string; provider: string | null; hostedUntil: string | null; hasFile: boolean; source: string; hosting: { state: "ACTIVE" | "EXPIRING" | "EXPIRED"; daysLeft: number } };

/** Live "5d:12h:4m:2s" countdown to a bot's hostedUntil, ticking every second. */
function HostingCountdown({ until, expired }: { until: string | null; expired: boolean }) {
  const cd = useCountdown(until);
  if (expired || !cd || cd.expired) return <>Hosting ended — renew to bring it back</>;
  return <>{cd.text} left</>;
}

function Bots() {
  const { data, loading, error, reload } = useApi<{ bots: B[]; limit: number; tier: string }>("/api/bots");
  const coins = useApi<{ balance: number }>("/api/coins");
  const [renewing, setRenewing] = useState<string | null>(null);
  const [connect, setConnect] = useState(false);
  const [phone, setPhone] = useState("");
  const [pairing, setPairing] = useState(false);
  const [pairResult, setPairResult] = useState<{ code: string; copied: boolean } | null>(null);

  async function connectScottyC() {
    setPairing(true); setPairResult(null);
    try {
      const r = await api<{ pairingCode?: string; alreadyConnected?: boolean }>("/api/bots/connect", { method: "POST", json: { phone } });
      if (r.alreadyConnected) { toast("That number is already connected."); setConnect(false); await reload(); }
      else if (r.pairingCode) setPairResult({ code: r.pairingCode, copied: false });
    } catch (e) { toast((e as Error).message, "err"); } finally { setPairing(false); }
  }
  function closeConnect() { setConnect(false); setPhone(""); setPairResult(null); void reload(); }

  async function renew(id: string) {
    setRenewing(id);
    try { await api(`/api/bots/${id}/renew`, { method: "POST" }); toast(`Hosting extended by ${ECONOMY.BOT_RENEW_DAYS} days`); await Promise.all([reload(), coins.reload()]); }
    catch (e: any) { toast(e.message, "err"); } finally { setRenewing(null); }
  }

  const bots = data?.bots ?? [];
  const tone = { ACTIVE: "green", EXPIRING: "amber", EXPIRED: "red" } as const;

  return (
    <Page>
      <div className="mb-3 flex items-center justify-between"><h1 className="text-2xl font-extrabold">Bots</h1>
        <Link href="/coins" className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-sm font-bold text-amber-700 dark:text-amber-300"><Coins size={15} />{coins.data?.balance ?? "…"} SC</Link></div>

      <div className="sw-card overflow-hidden">
        <div className="wallet-card p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-bold"><Zap size={16} /> Bot hosting</p>
          <p className="mt-1 text-[13px] text-white/85">Every bot is hosted <b>free for {ECONOMY.BOT_FREE_DAYS} days</b>. Keep it online by renewing for <b>{ECONOMY.BOT_RENEW_COINS} SC</b> per {ECONOMY.BOT_RENEW_DAYS} days — earn coins from tasks. Max <b>{ECONOMY.BOT_DEVICE_LIMIT} devices</b> paired per account.</p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border">
          <button onClick={() => setConnect(true)} className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-brand-600 hover:bg-soft"><Smartphone size={17} /> Connect Scotty_C with just your number</button>
          <div className="grid grid-cols-2 divide-x divide-border">
            <button disabled title="Coming soon" className="flex flex-col items-center justify-center gap-1 py-3.5 text-sm font-bold text-subtle opacity-60"><span className="flex items-center gap-2"><Sparkles size={17} /> Generate with AI</span><span className="text-[10px] font-semibold uppercase tracking-wide">Coming soon</span></button>
            <button disabled title="Coming soon" className="flex flex-col items-center justify-center gap-1 py-3.5 text-sm font-bold text-subtle opacity-60"><span className="flex items-center gap-2"><Plus size={17} /> Add my bot</span><span className="text-[10px] font-semibold uppercase tracking-wide">Coming soon</span></button>
          </div>
        </div>
      </div>

      <div className="mb-2 mt-6 flex items-center justify-between"><h2 className="text-[15px] font-bold">My bots</h2>{data && <span className="text-xs text-subtle">{bots.length}/{data.limit === -1 ? "∞" : data.limit} · {data.tier === "FREE" ? <Link href="/pro" className="font-semibold text-brand-600">Get more</Link> : data.tier}</span>}</div>
      {error && <ErrorNote message={error} onRetry={reload} />}
      {loading ? <ListSkeleton rows={2} /> : bots.length === 0 ? (
        <Empty icon={<Bot size={28} />} title="No bots yet" text="Pair a WhatsApp number onto Scotty_C in under a minute — no file needed." action={<button onClick={() => setConnect(true)} className="sw-btn"><Smartphone size={17} /> Connect Scotty_C</button>} />
      ) : (
        <div className="space-y-3">
          {bots.map((b) => (
            <div key={b.id} className="sw-card p-4">
              <Link href={`/bots/${b.id}`} className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15"><Bot size={22} /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{b.name}</p><p className="text-[13px] text-subtle">{b.source === "generated" ? "Generated by Scotty AI" : b.provider || "Custom bot"} · {b.status.toLowerCase()}</p></div>
                <Badge tone={tone[b.hosting.state]}>{b.hosting.state === "EXPIRED" ? "Expired" : b.hosting.state === "EXPIRING" ? "Expiring" : "Hosted"}</Badge>
              </Link>
              <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                <p className="flex flex-1 items-center gap-1.5 text-[13px] text-subtle"><Clock size={14} /><HostingCountdown until={b.hostedUntil} expired={b.hosting.state === "EXPIRED"} /></p>
                <button onClick={() => renew(b.id)} disabled={renewing === b.id} className="sw-btn !px-3.5 !py-2 text-xs"><RefreshCw size={14} className={renewing === b.id ? "animate-spin" : ""} /> Renew · {ECONOMY.BOT_RENEW_COINS} SC</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Sheet open={connect} onClose={closeConnect} title="Connect Scotty_C">
        {pairResult ? (
          <div className="rounded-xl bg-soft p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Your pairing code</p>
            <p className="my-1.5 font-mono text-3xl font-extrabold tracking-[0.2em]">{pairResult.code}</p>
            <button onClick={async () => { await navigator.clipboard.writeText(pairResult.code); setPairResult((p) => p && { ...p, copied: true }); }} className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-brand-600">
              {pairResult.copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy code</>}
            </button>
            <p className="mt-2 text-[12px] text-subtle">In WhatsApp on {phone}: Settings → Linked devices → Link with phone number → enter this code within 5 minutes.</p>
            <button onClick={closeConnect} className="sw-btn mt-4 w-full">Done</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-subtle">Enter the WhatsApp number to connect — no file to generate, pairs straight onto Scotty_C.</p>
            <Field label="WhatsApp number"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="263771234567" inputMode="tel" className="sw-input" /></Field>
            <button onClick={connectScottyC} disabled={pairing || !phone.trim()} className="sw-btn w-full py-3.5">{pairing ? "Pairing…" : "Get pairing code"}</button>
          </div>
        )}
      </Sheet>
    </Page>
  );
}

export default function BotsPage() { return <Suspense><Bots /></Suspense>; }
