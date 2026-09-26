"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge, Empty, Field, ListSkeleton, Sheet, Toggle } from "@/components/ui";
import { AdminHeader } from "@/components/admin/table";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type C = { id: string; name: string; platform: string; url: string; description: string | null; active: boolean };

export default function AdminChannels() {
  const { data, reload } = useApi<{ channels: C[] }>("/api/admin/channels");
  const [open, setOpen] = useState(false); const [f, setF] = useState({ name: "", platform: "WHATSAPP", url: "", description: "" }); const [busy, setBusy] = useState(false);
  async function add() { setBusy(true); try { await api("/api/admin/channels", { method: "POST", json: { ...f, description: f.description || undefined } }); setOpen(false); setF({ name: "", platform: "WHATSAPP", url: "", description: "" }); await reload(); } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); } }
  return (
    <div>
      <AdminHeader title="Channels" sub="Shown on the public Channels page." right={<button onClick={() => setOpen(true)} className="sw-btn text-xs"><Plus size={15} /> Add</button>} />
      {!data ? <ListSkeleton /> : data.channels.length === 0 ? <Empty title="No channels" /> : <div className="sw-card divide-y divide-border">{data.channels.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-4 py-3.5"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.name}</p><p className="truncate text-xs text-subtle">{c.url}</p></div><Badge tone="slate">{c.platform.toLowerCase()}</Badge>
          <Toggle checked={c.active} onChange={async (v) => { await api("/api/admin/channels", { method: "PATCH", json: { id: c.id, active: v } }); await reload(); }} />
          <button onClick={async () => { if (confirm("Delete this channel?")) { await api("/api/admin/channels", { method: "DELETE", json: { id: c.id } }); await reload(); } }} aria-label="Delete" className="text-subtle hover:text-red-600"><Trash2 size={17} /></button></div>))}</div>}
      <Sheet open={open} onClose={() => setOpen(false)} title="Add channel"><div className="space-y-4">
        <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="sw-input" /></Field>
        <Field label="Platform"><select value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })} className="sw-input">{["WHATSAPP", "TELEGRAM", "TIKTOK", "YOUTUBE", "FACEBOOK", "OTHER"].map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Link"><input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} type="url" placeholder="https://" className="sw-input" /></Field>
        <Field label="Description"><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={200} className="sw-input" /></Field>
        <button onClick={add} disabled={busy || f.name.length < 2 || !f.url} className="sw-btn w-full py-3.5">Add channel</button></div></Sheet>
    </div>
  );
}
