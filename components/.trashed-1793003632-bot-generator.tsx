"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, Download, Sparkles, Store } from "lucide-react";
import { Field, Sheet, Spinner, Badge } from "./ui";
import { ApiError, api, copyText, useApi } from "@/lib/client";
import { toast } from "./toast";

type Info = { free: boolean; freeUntil: string; cost: number; features: Array<{ key: string; label: string }>; aiEnabled: boolean };

export function BotGenerator({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const info = useApi<Info>(open ? "/api/bots/generate" : null);
  const [name, setName] = useState(""); const [prefix, setPrefix] = useState("."); const [desc, setDesc] = useState(""); const [idea, setIdea] = useState("");
  const [features, setFeatures] = useState<string[]>(["menu", "ping"]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ bot: { id: string; name: string }; filename: string; code: string } | null>(null);
  const [err, setErr] = useState("");

  const toggle = (k: string) => setFeatures((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));

  async function generate() {
    setBusy(true); setErr("");
    try { const r = await api<{ bot: { id: string; name: string }; filename: string; code: string }>("/api/bots/generate", { method: "POST", json: { name, prefix, description: desc || undefined, idea: idea || undefined, features } }); setResult(r); onDone(); }
    catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.code], { type: "text/javascript" }));
    const a = document.createElement("a"); a.href = url; a.download = result.filename; a.click(); URL.revokeObjectURL(url);
  }
  const close = () => { setResult(null); setErr(""); onClose(); };

  return (
    <Sheet open={open} onClose={close} title={result ? "Your bot is ready 🎉" : "Generate a bot with Scotty AI"}>
      {result ? (
        <div className="space-y-3">
          <p className="text-sm text-subtle"><b className="text-foreground">{result.bot.name}</b> was created and gets 7 days of free hosting. Download the file and follow the setup steps in its header.</p>
          <pre className="max-h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-[11.5px] leading-relaxed text-slate-100">{result.code.slice(0, 1400)}{result.code.length > 1400 ? "\n…" : ""}</pre>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={download} className="sw-btn"><Download size={17} /> Download</button>
            <button onClick={async () => { await copyText(result.code); toast("Code copied"); }} className="sw-btn-ghost"><Copy size={16} /> Copy</button>
          </div>
          <Link href={`/bots/${result.bot.id}`} className="sw-btn-ghost w-full">Open bot</Link>
          <Link href="/marketplace/sell" className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-600"><Store size={15} /> Sell this bot on the marketplace</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {info.data && (info.data.free
            ? <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">✨ Free for you right now.</p>
            : <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">The free window has ended — generating costs {info.data.cost} SC. Gold & Platinum members generate free.</p>)}
          {info.loading && <Spinner />}
          <div className="grid grid-cols-[1fr_84px] gap-3">
            <Field label="Bot name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="ScottyBot" className="sw-input" /></Field>
            <Field label="Prefix"><input value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={3} className="sw-input text-center" /></Field>
          </div>
          <Field label="What should it do?"><input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} placeholder="A group helper bot with fun commands" className="sw-input" /></Field>
          <div>
            <p className="mb-2 text-[13px] font-semibold">Features</p>
            <div className="grid gap-2">
              {(info.data?.features ?? []).map((f) => (
                <button key={f.key} onClick={() => toggle(f.key)} className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium ${features.includes(f.key) ? "border-brand-600 bg-brand-50 dark:bg-brand-500/10" : "border-border"}`}>{f.label}{features.includes(f.key) && <Check size={17} className="text-brand-600" />}</button>
              ))}
            </div>
          </div>
          {info.data?.aiEnabled && <Field label="Custom idea (Scotty AI adds commands)"><textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={2} maxLength={500} placeholder="e.g. a command that gives a random coding tip" className="sw-input" /></Field>}
          {err && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</p>}
          <button onClick={generate} disabled={busy || name.trim().length < 2} className="sw-btn w-full py-3.5">{busy ? <><Spinner size={17} /> Generating…</> : <><Sparkles size={17} /> Generate bot file</>}</button>
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-subtle"><Badge tone="slate">Tip</Badge> Use the bot only on accounts you own and follow WhatsApp&apos;s terms.</p>
        </div>
      )}
    </Sheet>
  );
}
