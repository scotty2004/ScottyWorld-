"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Copy, ArrowDownLeft, ArrowUpRight, Camera, CheckCircle2, Clock, ExternalLink, Facebook, Gift, MessageCircle, Music2, Plus, Send, Youtube, XCircle, Wallet as WalletIcon, type LucideIcon } from "lucide-react";
import { Badge, Empty, Field, ListSkeleton, Page, Sheet, Tabs } from "@/components/ui";
import { WalletCard } from "@/components/wallet-card";
import { ApiError, api, compressImage, copyText, timeAgo, useApi } from "@/lib/client";
import { usdToCoins } from "@/lib/economy";
import { toast } from "@/components/toast";

type Wallet = { balance: number; usd: number; accountNumber: string; holder: string; totalEarned: number; totalSpent: number; transactions: Array<{ id: string; amount: number; type: string; reason: string; createdAt: string }> };
type Task = { id: string; title: string; description: string | null; platform: string; kind: string; url: string; rewardCoins: number; mine: { status: string; aiVerdict: string | null } | null };
type Dep = { deposits: Array<{ id: string; usdCents: number; coins: number; status: string; createdAt: string }>; packages: Array<{ usd: number; coins: number }> };

const PLAT: Record<string, { i: LucideIcon; c: string }> = {
  YOUTUBE: { i: Youtube, c: "bg-red-50 text-red-600 dark:bg-red-500/15" }, FACEBOOK: { i: Facebook, c: "bg-blue-50 text-blue-600 dark:bg-blue-500/15" },
  TIKTOK: { i: Music2, c: "bg-slate-100 text-slate-900 dark:bg-slate-500/20 dark:text-white" }, WHATSAPP: { i: MessageCircle, c: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15" },
  TELEGRAM: { i: Send, c: "bg-sky-50 text-sky-600 dark:bg-sky-500/15" }, OTHER: { i: Gift, c: "bg-brand-50 text-brand-600 dark:bg-brand-500/15" },
};
const VERB: Record<string, string> = { WATCH: "Watch", FOLLOW: "Follow", JOIN: "Join", SUBSCRIBE: "Subscribe" };

function SendSheet({ open, onClose, onDone, balance }: { open: boolean; onClose: () => void; onDone: () => void; balance: number }) {
  const [acct, setAcct] = useState(""); const [amount, setAmount] = useState(""); const [note, setNote] = useState("");
  const [who, setWho] = useState<{ displayName: string; username: string } | null>(null); const [whoErr, setWhoErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setWho(null); setWhoErr("");
    if (!/^\d{6}$/.test(acct)) return;
    let live = true;
    api<{ displayName: string; username: string }>(`/api/coins/lookup?account=${acct}`).then((r) => live && setWho(r)).catch((e) => live && setWhoErr(e.message));
    return () => { live = false; };
  }, [acct]);

  const amt = parseInt(amount || "0", 10) || 0;
  async function send() {
    setBusy(true);
    try { await api("/api/coins/transfer", { method: "POST", json: { accountNumber: acct, amount: amt, note: note || undefined } }); toast(`Sent ${amt} SC to ${who?.displayName}`); setAcct(""); setAmount(""); setNote(""); onDone(); onClose(); }
    catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  }
  return (
    <Sheet open={open} onClose={onClose} title="Send Scotty Coins">
      <div className="space-y-4">
        <Field label="Recipient account number"><input value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="6-digit number" className="sw-input font-mono text-lg tracking-widest" /></Field>
        {who && <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={16} /> {who.displayName} <span className="font-normal opacity-70">@{who.username}</span></p>}
        {whoErr && <p className="text-sm text-red-600">{whoErr}</p>}
        <Field label="Amount (SC)" hint={`You have ${balance} SC`}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="0" className="sw-input text-lg font-bold" /></Field>
        <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} className="sw-input" /></Field>
        <button onClick={send} disabled={busy || !who || amt < 1 || amt > balance} className="sw-btn w-full py-3.5"><Send size={17} /> {busy ? "Sending…" : `Send ${amt || ""} SC`}</button>
      </div>
    </Sheet>
  );
}

function DepositSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const info = useApi<Dep>(open ? "/api/coins/deposit" : null);
  const [usd, setUsd] = useState(5); const [custom, setCustom] = useState("");
  const [res, setRes] = useState<{ instructions: string; deposit: { id: string } } | null>(null); const [busy, setBusy] = useState(false);
  const amount = custom ? parseFloat(custom) || 0 : usd;

  async function create() {
    setBusy(true);
    try { setRes(await api("/api/coins/deposit", { method: "POST", json: { usd: amount } })); await info.reload(); } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  }
  return (
    <Sheet open={open} onClose={() => { setRes(null); onClose(); }} title="Deposit coins">
      {res ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-brand-50 p-4 text-sm dark:bg-brand-500/10">{res.instructions}</p>
          <p className="text-center font-mono text-xl font-bold tracking-widest">{res.deposit.id.slice(-8).toUpperCase()}</p>
          <button onClick={() => copyText(res.deposit.id.slice(-8).toUpperCase()).then(() => toast("Reference copied"))} className="sw-btn-ghost w-full"><Copy size={16} /> Copy reference</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">{(info.data?.packages ?? [1, 2, 5, 10, 25].map((u) => ({ usd: u, coins: usdToCoins(u) }))).map((p) => (
            <button key={p.usd} onClick={() => { setUsd(p.usd); setCustom(""); }} className={`rounded-xl border p-3 text-center ${!custom && usd === p.usd ? "border-brand-600 bg-brand-50 dark:bg-brand-500/10" : "border-border"}`}><p className="font-extrabold">${p.usd}</p><p className="text-xs text-subtle">{p.coins} SC</p></button>
          ))}</div>
          <Field label="Or enter an amount (USD)" hint="20 coins = $0.50"><input value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="e.g. 7.50" className="sw-input" /></Field>
          <p className="text-center text-sm">You get <b className="text-amber-600">{usdToCoins(amount)} SC</b> for ${amount.toFixed(2)}</p>
          <button onClick={create} disabled={busy || amount < 1} className="sw-btn w-full py-3.5">{busy ? "Creating…" : "Continue"}</button>
          {(info.data?.deposits.length ?? 0) > 0 && (
            <div className="border-t border-border pt-3"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">Recent deposits</p>
              {info.data!.deposits.slice(0, 5).map((d) => <div key={d.id} className="flex items-center justify-between py-1.5 text-sm"><span>${(d.usdCents / 100).toFixed(2)} → {d.coins} SC</span><Badge tone={d.status === "PAID" ? "green" : d.status === "REJECTED" ? "red" : "amber"}>{d.status.toLowerCase()}</Badge></div>)}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function ProofSheet({ task, onClose, onDone }: { task: Task | null; onClose: () => void; onDone: () => void }) {
  const [img, setImg] = useState<string | null>(null); const [busy, setBusy] = useState(false); const ref = useRef<HTMLInputElement>(null);
  if (!task) return null;
  async function submit() {
    setBusy(true);
    try { const r = await api<{ message: string }>(`/api/tasks/${task!.id}/submit`, { method: "POST", json: { screenshot: img } }); toast(r.message); setImg(null); onDone(); onClose(); }
    catch (e) { toast((e as ApiError).message, "err"); } finally { setBusy(false); }
  }
  return (
    <Sheet open onClose={onClose} title="Submit proof">
      <p className="text-sm text-subtle">{VERB[task.kind]} <b className="text-foreground">{task.title}</b>, then upload a clear screenshot showing it. Edited or reused screenshots are detected and can lead to a ban.</p>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(await compressImage(f, 1100, 0.7)); }} />
      <button onClick={() => ref.current?.click()} className="mt-4 grid w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border py-8 text-subtle">
        {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="Screenshot preview" className="max-h-64 rounded-xl" /> : <span className="text-center text-sm"><Camera className="mx-auto mb-2" size={28} />Tap to choose screenshot</span>}
      </button>
      <button onClick={submit} disabled={!img || busy} className="sw-btn mt-4 w-full py-3.5">{busy ? "Uploading & checking…" : `Submit for +${task.rewardCoins} SC`}</button>
    </Sheet>
  );
}

export default function CoinsPage() {
  const wallet = useApi<Wallet>("/api/coins");
  const tasks = useApi<{ tasks: Task[]; bonusPct: number }>("/api/tasks");
  const [tab, setTab] = useState<"tasks" | "activity">("tasks");
  const [send, setSend] = useState(false); const [dep, setDep] = useState(false); const [proof, setProof] = useState<Task | null>(null);
  const w = wallet.data;

  const statusBadge = (t: Task) => {
    const s = t.mine?.status;
    if (!s) return null;
    if (s === "APPROVED") return <Badge tone="green"><CheckCircle2 size={11} /> Completed</Badge>;
    if (s === "REJECTED") return <Badge tone="red"><XCircle size={11} /> Rejected</Badge>;
    return <Badge tone="amber"><Clock size={11} /> In review</Badge>;
  };

  return (
    <Page>
      <h1 className="mb-3 text-2xl font-extrabold lg:hidden">Scotty Coins</h1>
      <WalletCard balance={w?.balance ?? null} usd={w?.usd ?? null} accountNumber={w?.accountNumber ?? null} holder={w?.holder ?? ""} />
      <p className="mt-2 text-center text-xs text-subtle">20 SC = $0.50 · share your account number to receive coins</p>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-semibold">
        {[[Send, "Send", () => setSend(true)], [Plus, "Deposit", () => setDep(true)], [Gift, "Earn", () => setTab("tasks")], [ArrowDownLeft, "Receive", async () => { if (w) { await copyText(w.accountNumber); toast("Account number copied — share it to receive coins"); } }]].map(([I, l, fn]: any) => (
          <button key={l} onClick={fn} className="sw-card flex flex-col items-center gap-1.5 py-3.5 active:scale-95"><span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15"><I size={19} /></span>{l}</button>
        ))}
      </div>

      <div className="mt-5"><Tabs items={[{ id: "tasks", label: "Earn coins" }, { id: "activity", label: "Activity" }]} value={tab} onChange={setTab} /></div>

      {tab === "tasks" ? (
        <div className="mt-4 space-y-3">
          <Link href="/referrals" className="sw-card flex items-center gap-3 border-brand-500/30 bg-gradient-to-r from-brand-50 to-transparent p-4 dark:from-brand-500/10"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white"><Gift size={20} /></span><div className="flex-1"><p className="font-bold">Refer friends</p><p className="text-[13px] text-subtle">+6 SC per signup · +2 SC per link click</p></div><ArrowUpRight size={18} className="text-brand-600" /></Link>
          {(tasks.data?.bonusPct ?? 0) > 0 && <p className="text-center text-xs font-semibold text-emerald-600">Your Pro plan adds +{tasks.data!.bonusPct}% to every task reward</p>}
          {tasks.loading ? <ListSkeleton rows={3} /> : !tasks.data?.tasks.length ? <Empty icon={<Gift size={26} />} title="No tasks right now" text="New tasks are added regularly — check back soon." /> : tasks.data.tasks.map((t) => {
            const P = PLAT[t.platform] ?? PLAT.OTHER; const I = P.i; const done = t.mine && t.mine.status !== "REJECTED";
            return (
              <div key={t.id} className="sw-card p-4">
                <div className="flex items-start gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${P.c}`}><I size={21} /></span>
                  <div className="min-w-0 flex-1"><p className="font-bold leading-snug">{t.title}</p>{t.description && <p className="mt-0.5 text-[13px] text-subtle">{t.description}</p>}</div>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-sm font-extrabold text-amber-700 dark:text-amber-300">+{t.rewardCoins}</span></div>
                <div className="mt-3 flex items-center gap-2">
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="sw-btn-ghost flex-1 !py-2.5 text-[13px]"><ExternalLink size={15} /> {VERB[t.kind]}</a>
                  {done ? <div className="flex flex-1 justify-center">{statusBadge(t)}</div> : <button onClick={() => setProof(t)} className="sw-btn flex-1 !py-2.5 text-[13px]"><Camera size={15} /> {t.mine ? "Resubmit" : "Submit proof"}</button>}
                </div>
                {t.mine?.status === "REJECTED" && <p className="mt-2 text-xs text-red-600">Your last screenshot couldn&apos;t be verified. Try a clearer one.</p>}
              </div>);
          })}
        </div>
      ) : (
        <div className="mt-4">
          {wallet.loading ? <ListSkeleton /> : !w?.transactions.length ? <Empty icon={<WalletIcon size={26} />} title="No transactions yet" text="Complete a task or invite a friend to earn your first coins." /> : (
            <div className="sw-card divide-y divide-border overflow-hidden">
              {w.transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${t.amount > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>{t.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{t.reason}</p><p className="text-xs text-subtle">{timeAgo(t.createdAt)} ago</p></div>
                  <span className={`font-extrabold tabular-nums ${t.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SendSheet open={send} onClose={() => setSend(false)} onDone={wallet.reload} balance={w?.balance ?? 0} />
      <DepositSheet open={dep} onClose={() => setDep(false)} />
      <ProofSheet key={proof?.id} task={proof} onClose={() => setProof(null)} onDone={tasks.reload} />
    </Page>
  );
}
