"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Clock, Download, Play, RefreshCw, Square, Terminal, Trash2, Plus } from "lucide-react";
import { Badge, ErrorNote, Field, ListSkeleton, Page, Section, Sheet, SubHeader } from "@/components/ui";
import { api, timeAgo, useApi } from "@/lib/client";
import { ECONOMY } from "@/lib/economy";
import { toast } from "@/components/toast";

type Bot = { id: string; name: string; description: string | null; provider: string | null; status: string; commandPrefix: string; hostedUntil: string | null; source: string; generatedFile: string | null; generatedFileName: string | null; commands: Array<{ id: string; name: string; description: string | null; enabled: boolean }>; events: Array<{ id: string; type: string; message: string; createdAt: string }> };

export default function BotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, loading, error, reload } = useApi<{ bot: Bot }>(`/api/bots/${id}`);
  const [busy, setBusy] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false); const [cmd, setCmd] = useState(""); const [cmdDesc, setCmdDesc] = useState("");
  const b = data?.bot;

  const msLeft = b?.hostedUntil ? new Date(b.hostedUntil).getTime() - Date.now() : 0;
  const days = Math.max(0, Math.ceil(msLeft / 86_400_000));
  const expired = msLeft <= 0;

  async function act(action: string) {
    setBusy(action);
    try { const r = await api<{ message: string }>(`/api/bots/${id}/action`, { method: "POST", json: { action } }); toast(r.message); await reload(); }
    catch (e) { toast((e as Error).message, "err"); } finally { setBusy(""); }
  }
  async function renew() {
    setBusy("renew");
    try { await api(`/api/bots/${id}/renew`, { method: "POST" }); toast("Hosting extended"); await reload(); } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(""); }
  }
  async function addCmd() {
    try { await api(`/api/bots/${id}/commands`, { method: "POST", json: { name: cmd, description: cmdDesc || undefined } }); setCmdOpen(false); setCmd(""); setCmdDesc(""); await reload(); } catch (e) { toast((e as Error).message, "err"); }
  }
  async function del() {
    if (!confirm(`Delete ${b?.name}? This can't be undone.`)) return;
    try { await api(`/api/bots/${id}`, { method: "DELETE" }); router.push("/bots"); } catch (e) { toast((e as Error).message, "err"); }
  }

  return (
    <Page>
      <SubHeader title={b?.name ?? "Bot"} backHref="/bots" right={b && <button onClick={del} aria-label="Delete bot" className="grid h-10 w-10 place-items-center rounded-full text-red-500 hover:bg-red-500/10"><Trash2 size={19} /></button>} />
      {loading ? <ListSkeleton /> : error || !b ? <ErrorNote message={error || "Bot not found."} /> : (
        <>
          <div className="sw-card p-4">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15"><Bot size={24} /></span>
              <div className="flex-1"><p className="font-bold">{b.name}</p><p className="text-[13px] text-subtle">{b.provider || "Custom"} · prefix <code>{b.commandPrefix}</code></p></div><Badge tone={b.status === "RUNNING" ? "green" : b.status === "ERROR" ? "red" : "slate"}>{b.status.toLowerCase()}</Badge></div>
            {b.description && <p className="mt-3 text-sm">{b.description}</p>}
          </div>

          <div className={`mt-3 rounded-2xl border p-4 ${expired ? "border-red-500/30 bg-red-500/10" : days <= 2 ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}>
            <p className="flex items-center gap-2 text-sm font-bold"><Clock size={16} />{expired ? "Hosting has ended" : `Hosted for ${days} more day${days === 1 ? "" : "s"}`}</p>
            <p className="mt-1 text-[13px] text-subtle">{expired ? "Renew to bring your bot back online." : `Ends ${new Date(b.hostedUntil!).toLocaleString()}`}</p>
            <button onClick={renew} disabled={busy === "renew"} className="sw-btn mt-3 w-full"><RefreshCw size={16} className={busy === "renew" ? "animate-spin" : ""} /> Renew {ECONOMY.BOT_RENEW_DAYS} days · {ECONOMY.BOT_RENEW_COINS} SC</button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={() => act("start")} disabled={!!busy || expired} className="sw-btn"><Play size={16} /> Start</button>
            <button onClick={() => act("stop")} disabled={!!busy} className="sw-btn-ghost"><Square size={15} /> Stop</button>
          </div>
          {b.generatedFile && <a href={`/api/bots/${b.id}/file`} className="sw-btn-ghost mt-3 w-full"><Download size={17} /> Download {b.generatedFileName || "bot file"}</a>}

          <Section title="Commands">
            <div className="sw-card divide-y divide-border overflow-hidden">
              {b.commands.length === 0 && <p className="p-5 text-center text-sm text-subtle">No commands registered yet.</p>}
              {b.commands.map((c) => <div key={c.id} className="flex items-center gap-3 px-4 py-3"><Terminal size={16} className="text-brand-600" /><div className="min-w-0 flex-1"><p className="font-mono text-sm font-semibold">{b.commandPrefix}{c.name}</p>{c.description && <p className="truncate text-xs text-subtle">{c.description}</p>}</div></div>)}
              <button onClick={() => setCmdOpen(true)} className="flex w-full items-center justify-center gap-2 py-3 text-sm font-bold text-brand-600 hover:bg-soft"><Plus size={16} /> Add command</button>
            </div>
          </Section>

          <Section title="Activity">
            <div className="sw-card divide-y divide-border overflow-hidden">
              {b.events.length === 0 ? <p className="p-5 text-center text-sm text-subtle">No activity yet.</p> : b.events.slice(0, 12).map((e) => <div key={e.id} className="flex items-center gap-3 px-4 py-3"><Badge tone="slate">{e.type.toLowerCase()}</Badge><p className="min-w-0 flex-1 truncate text-sm">{e.message}</p><span className="text-xs text-subtle">{timeAgo(e.createdAt)}</span></div>)}
            </div>
          </Section>

          <Sheet open={cmdOpen} onClose={() => setCmdOpen(false)} title="Add command">
            <div className="space-y-4"><Field label="Command name" hint="Letters, numbers, - and _ only"><input value={cmd} onChange={(e) => setCmd(e.target.value)} maxLength={40} placeholder="menu" className="sw-input" /></Field>
              <Field label="Description"><input value={cmdDesc} onChange={(e) => setCmdDesc(e.target.value)} maxLength={200} className="sw-input" /></Field>
              <button onClick={addCmd} disabled={!/^[a-zA-Z0-9_-]+$/.test(cmd)} className="sw-btn w-full py-3.5">Add</button></div>
          </Sheet>
        </>
      )}
    </Page>
  );
}
