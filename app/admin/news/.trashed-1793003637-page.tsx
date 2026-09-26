"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge, Empty, ErrorNote, Field, ListSkeleton, Sheet } from "@/components/ui";
import { api, compressImage, timeAgo, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type A = { id: string; title: string; category: string; status: string; createdAt: string };
const CATS = ["AI", "Tech", "Developers", "Security", "Startups", "Gadgets", "ScottyWorld"];

export default function AdminNews() {
  const { data, loading, reload } = useApi<{ articles: A[] }>("/api/admin/news");
  const [open, setOpen] = useState(false); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ title: "", category: "AI", excerpt: "", content: "", sourceName: "", sourceUrl: "", imageUrl: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });

  async function post() {
    setBusy(true); setErr("");
    try { await api("/api/admin/news", { method: "POST", json: { ...f, publish: true } }); setOpen(false); setF({ title: "", category: "AI", excerpt: "", content: "", sourceName: "", sourceUrl: "", imageUrl: "" }); toast("Published"); await reload(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  async function del(id: string) { if (!confirm("Delete this article?")) return; await api("/api/admin/news", { method: "DELETE", json: { id } }); await reload(); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-extrabold">Tech News</h1><p className="text-sm text-subtle">Only admins can post news.</p></div><button onClick={() => setOpen(true)} className="sw-btn text-xs"><Plus size={15} /> New article</button></div>
      {loading ? <ListSkeleton /> : !data?.articles.length ? <Empty title="No articles yet" /> : (
        <div className="sw-card divide-y divide-border overflow-hidden">{data.articles.map((a) => <div key={a.id} className="flex items-center gap-3 px-4 py-3.5"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{a.title}</p><p className="text-xs text-subtle">{a.category} · {timeAgo(a.createdAt)} ago</p></div><Badge tone={a.status === "PUBLISHED" ? "green" : "slate"}>{a.status.toLowerCase()}</Badge><button onClick={() => del(a.id)} aria-label="Delete" className="text-subtle hover:text-red-600"><Trash2 size={17} /></button></div>)}</div>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="New article">
        <div className="space-y-3">
          <Field label="Headline"><input value={f.title} onChange={set("title")} maxLength={200} className="sw-input" /></Field>
          <Field label="Category"><select value={f.category} onChange={set("category")} className="sw-input">{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Summary (optional)"><input value={f.excerpt} onChange={set("excerpt")} maxLength={300} className="sw-input" /></Field>
          <Field label="Article" hint="Supports **bold**, lists and code blocks."><textarea value={f.content} onChange={set("content")} rows={8} className="sw-input" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Source name"><input value={f.sourceName} onChange={set("sourceName")} className="sw-input" /></Field><Field label="Source link"><input value={f.sourceUrl} onChange={set("sourceUrl")} type="url" className="sw-input" /></Field></div>
          <Field label="Cover image"><input type="file" accept="image/*" onChange={async (e) => { const x = e.target.files?.[0]; if (x) setF({ ...f, imageUrl: await compressImage(x, 900, 0.72) }); }} className="text-sm" /></Field>
          {err && <ErrorNote message={err} />}
          <button onClick={post} disabled={busy || f.title.length < 5 || f.content.length < 20} className="sw-btn w-full py-3">{busy ? "Publishing…" : "Publish"}</button>
        </div>
      </Sheet>
    </div>
  );
}
