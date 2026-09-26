"use client";

import { useState } from "react";
import { Badge, Empty, ListSkeleton, Sheet } from "@/components/ui";
import { api, timeAgo, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type T = { id: string; subject: string; message: string; status: string; priority: string; createdAt: string; user: { username: string; email: string; displayName: string } };

export default function AdminSupport() {
  const { data, loading, reload } = useApi<{ tickets: T[] }>("/api/admin/support");
  const [open, setOpen] = useState<T | null>(null); const [reply, setReply] = useState("");
  async function update(status: string) {
    if (!open) return;
    try { await api("/api/admin/support", { method: "PATCH", json: { id: open.id, status, reply: reply || undefined } }); toast("Ticket updated"); setOpen(null); setReply(""); await reload(); } catch (e) { toast((e as Error).message, "err"); }
  }
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-extrabold">Support tickets</h1><p className="text-sm text-subtle">Replies are sent to the user as a notification.</p></div>
      {loading ? <ListSkeleton /> : !data?.tickets.length ? <Empty title="No tickets" /> : (
        <div className="sw-card divide-y divide-border overflow-hidden">
          {data.tickets.map((t) => (
            <button key={t.id} onClick={() => { setOpen(t); setReply(""); }} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-soft">
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{t.subject}</p><p className="truncate text-xs text-subtle">@{t.user.username} · {timeAgo(t.createdAt)} ago</p></div>
              {t.priority === "HIGH" && <Badge tone="red">urgent</Badge>}<Badge tone={t.status === "OPEN" ? "amber" : t.status === "RESOLVED" || t.status === "CLOSED" ? "green" : "blue"}>{t.status.toLowerCase().replace("_", " ")}</Badge>
            </button>
          ))}
        </div>
      )}
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.subject}>
        {open && <div className="space-y-3">
          <p className="text-xs text-subtle">{open.user.displayName} · {open.user.email}</p>
          <p className="whitespace-pre-wrap rounded-xl bg-soft p-3 text-sm">{open.message}</p>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write a reply (optional)…" className="sw-input" />
          <div className="grid grid-cols-3 gap-2"><button onClick={() => update("IN_PROGRESS")} className="sw-btn-ghost text-xs">In progress</button><button onClick={() => update("RESOLVED")} className="sw-btn text-xs">Resolve</button><button onClick={() => update("CLOSED")} className="sw-btn-ghost text-xs">Close</button></div>
        </div>}
      </Sheet>
    </div>
  );
}
