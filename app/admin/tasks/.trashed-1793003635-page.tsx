"use client";

import { useState } from "react";
import { Check, ExternalLink, Plus, ShieldAlert, X } from "lucide-react";
import { Avatar, Badge, Empty, Field, ListSkeleton, Sheet, Tabs } from "@/components/ui";
import { api, timeAgo, useApi } from "@/lib/client";
import { DEFAULT_TASKS } from "@/lib/defaults";
import { toast } from "@/components/toast";

type Task = { id: string; title: string; platform: string; kind: string; url: string; rewardCoins: number; active: boolean; _count: { submissions: number } };
type Sub = { id: string; screenshotData: string; aiScore: number | null; aiVerdict: string | null; aiReasons: string[] | null; status: string; createdAt: string; user: { username: string; displayName: string; createdAt: string }; task: { title: string; platform: string; rewardCoins: number } };

export default function AdminTasks() {
  const { data, loading, reload } = useApi<{ tasks: Task[]; queue: Sub[] }>("/api/admin/tasks");
  const [tab, setTab] = useState<"queue" | "tasks">("queue");
  const [add, setAdd] = useState(false); const [zoom, setZoom] = useState<string | null>(null);
  const [f, setF] = useState({ title: "", description: "", platform: "TIKTOK", kind: "FOLLOW", url: "", rewardCoins: "5" });

  async function decide(id: string, decision: "APPROVE" | "REJECT") {
    try { const r = await api<{ reward?: number }>("/api/admin/tasks", { method: "PATCH", json: { submissionId: id, decision } }); toast(decision === "APPROVE" ? `Approved · +${r.reward} SC paid` : "Rejected"); await reload(); } catch (e) { toast((e as Error).message, "err"); }
  }
  async function create() {
    try { await api("/api/admin/tasks", { method: "POST", json: { ...f, description: f.description || undefined, rewardCoins: parseInt(f.rewardCoins, 10) || 5 } }); setAdd(false); toast("Task created"); await reload(); } catch (e) { toast((e as Error).message, "err"); }
  }
  async function starter() {
    let n = 0;
    for (const t of DEFAULT_TASKS) { if (data?.tasks.some((x) => x.url === t.url)) continue; try { await api("/api/admin/tasks", { method: "POST", json: t }); n++; } catch { /* skip */ } }
    toast(n ? `Added ${n} starter tasks` : "Starter tasks already exist"); await reload();
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });
  const tone = (v: string | null) => (v === "LIKELY_VALID" ? "green" : v === "SUSPICIOUS" ? "red" : "amber");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-2xl font-extrabold">Task reviews</h1><p className="text-sm text-subtle">Verify screenshots, then approve to pay coins.</p></div>
        <div className="flex gap-2"><button onClick={starter} className="sw-btn-ghost text-xs">Add starter tasks</button><button onClick={() => setAdd(true)} className="sw-btn text-xs"><Plus size={15} /> New task</button></div></div>
      <Tabs items={[{ id: "queue", label: "Review queue", badge: data?.queue.length }, { id: "tasks", label: "All tasks" }]} value={tab} onChange={setTab} />

      {loading ? <ListSkeleton /> : tab === "queue" ? (
        !data?.queue.length ? <Empty title="Queue is clear" text="New submissions will appear here." /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.queue.map((s) => (
              <div key={s.id} className={`sw-card p-4 ${s.status === "FLAGGED" ? "!border-red-500/50" : ""}`}>
                <div className="flex items-center gap-3"><Avatar name={s.user.displayName} size={38} /><div className="min-w-0 flex-1"><p className="truncate font-bold">{s.task.title}</p><p className="text-xs text-subtle">@{s.user.username} · account {timeAgo(s.user.createdAt)} old · submitted {timeAgo(s.createdAt)} ago</p></div><span className="font-extrabold text-amber-600">+{s.task.rewardCoins}</span></div>
                <button onClick={() => setZoom(s.screenshotData)} className="mt-3 block w-full overflow-hidden rounded-xl bg-soft">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.screenshotData} alt="Proof" className="mx-auto max-h-64 object-contain" /></button>
                <div className="mt-3 flex flex-wrap items-center gap-2"><Badge tone={tone(s.aiVerdict)}>{s.status === "FLAGGED" && <ShieldAlert size={11} />} AI: {(s.aiVerdict ?? "n/a").replace("_", " ").toLowerCase()} {s.aiScore !== null && `(${s.aiScore})`}</Badge></div>
                {s.aiReasons && s.aiReasons.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-subtle">{s.aiReasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
                <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => decide(s.id, "REJECT")} className="sw-btn-ghost !text-red-600"><X size={16} /> Reject</button><button onClick={() => decide(s.id, "APPROVE")} className="sw-btn"><Check size={16} /> Approve</button></div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="sw-card divide-y divide-border overflow-hidden">
          {(data?.tasks ?? []).map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3.5"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{t.title}</p><p className="text-xs text-subtle">{t.platform} · {t.kind} · +{t.rewardCoins} SC · {t._count.submissions} submissions</p></div>
              <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-subtle"><ExternalLink size={16} /></a>
              <button onClick={async () => { await api("/api/admin/tasks", { method: "PATCH", json: { taskId: t.id, active: !t.active } }); await reload(); }} className={t.active ? "sw-btn-ghost !px-3 !py-1.5 text-xs" : "sw-btn !px-3 !py-1.5 text-xs"}>{t.active ? "Pause" : "Activate"}</button></div>
          ))}
          {!data?.tasks.length && <p className="p-6 text-center text-sm text-subtle">No tasks yet — tap “Add starter tasks” to create tasks for your channels.</p>}
        </div>
      )}

      <Sheet open={add} onClose={() => setAdd(false)} title="New task">
        <div className="space-y-3">
          <Field label="Title"><input value={f.title} onChange={set("title")} placeholder="Watch my latest TikTok video" className="sw-input" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Platform"><select value={f.platform} onChange={set("platform")} className="sw-input">{["TIKTOK", "YOUTUBE", "FACEBOOK", "WHATSAPP", "TELEGRAM", "OTHER"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Action"><select value={f.kind} onChange={set("kind")} className="sw-input">{["WATCH", "FOLLOW", "JOIN", "SUBSCRIBE"].map((x) => <option key={x}>{x}</option>)}</select></Field></div>
          <Field label="Link"><input value={f.url} onChange={set("url")} type="url" placeholder="https://" className="sw-input" /></Field>
          <Field label="Reward (SC)"><input value={f.rewardCoins} onChange={set("rewardCoins")} inputMode="numeric" className="sw-input" /></Field>
          <Field label="What must the screenshot show?"><textarea value={f.description} onChange={set("description")} rows={2} className="sw-input" /></Field>
          <button onClick={create} disabled={f.title.length < 3 || !f.url} className="sw-btn w-full py-3">Create task</button>
        </div>
      </Sheet>
      {zoom && <button onClick={() => setZoom(null)} className="fixed inset-0 z-[99] grid place-items-center bg-black/85 p-4">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={zoom} alt="Proof" className="max-h-full max-w-full object-contain" /></button>}
    </div>
  );
}
