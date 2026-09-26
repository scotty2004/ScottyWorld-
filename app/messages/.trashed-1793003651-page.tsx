"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Search, SquarePen, Trash2 } from "lucide-react";
import { Avatar, Empty, ListSkeleton, Page, Sheet, SubHeader } from "@/components/ui";
import { api, timeAgo, useApi } from "@/lib/client";
import { useRealtime } from "@/components/realtime";
import { toast } from "@/components/toast";

type C = { username: string; displayName: string; avatarUrl: string | null; online: boolean; unread: number; last: { content: string; createdAt: string; mine: boolean } };
type P = { kind: string; id: string; title: string; href: string; description?: string };

function NewMessage({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState(""); const [res, setRes] = useState<P[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return; }
    const t = setTimeout(() => api<{ results: P[] }>(`/api/search?q=${encodeURIComponent(q)}`).then((r) => setRes(r.results.filter((x) => x.kind === "people"))).catch(() => setRes([])), 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <Sheet open={open} onClose={onClose} title="New message">
      <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people by name or @username" className="sw-input !pl-11" /></div>
      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {res.map((p) => <Link key={p.id} href={`/messages/${p.href.replace("/u/", "")}`} onClick={onClose} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-soft"><Avatar name={p.title} size={42} /><div><p className="font-semibold">{p.title}</p><p className="text-xs text-subtle">{p.description}</p></div></Link>)}
        {q.trim().length >= 2 && res.length === 0 && <p className="py-6 text-center text-sm text-subtle">No people found.</p>}
      </div>
    </Sheet>
  );
}

export default function MessagesPage() {
  const { data, loading, reload, setData } = useApi<{ conversations: C[] }>("/api/messages");
  const [q, setQ] = useState(""); const [compose, setCompose] = useState(false);
  const [toDelete, setToDelete] = useState<C | null>(null);
  const onTick = useCallback((t: { dmFrom: string[] }) => { if (t.dmFrom.length) void reload(); }, [reload]);
  useRealtime(onTick as any);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await api(`/api/messages/${toDelete.username}`, { method: "DELETE" });
      setData((d) => d && { ...d, conversations: d.conversations.filter((c) => c.username !== toDelete.username) });
      toast("Chat deleted");
    } catch (e) { toast((e as Error).message, "err"); }
    setToDelete(null);
  }

  const list = (data?.conversations ?? []).filter((c) => !q || (c.displayName + c.username).toLowerCase().includes(q.toLowerCase()));
  const online = (data?.conversations ?? []).filter((c) => c.online);

  return (
    <Page>
      <SubHeader title="Messages" backHref="/menu" right={<button onClick={() => setCompose(true)} aria-label="New message" className="grid h-10 w-10 place-items-center rounded-full text-brand-600 hover:bg-soft"><SquarePen size={22} /></button>} />
      <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" className="sw-input !rounded-2xl !bg-soft !pl-11" /></div>

      {online.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-4 flex gap-4 overflow-x-auto px-4">
          {online.map((c) => <Link key={c.username} href={`/messages/${c.username}`} className="flex w-16 shrink-0 flex-col items-center gap-1"><Avatar name={c.displayName} src={c.avatarUrl} size={56} online ring /><span className="w-full truncate text-center text-[11px] font-medium">{c.displayName.split(" ")[0]}</span></Link>)}
        </div>
      )}

      <div className="mt-4">
        {loading ? <ListSkeleton /> : list.length === 0 ? (
          <Empty icon={<MessageCircle size={28} />} title={q ? "No matches" : "No messages yet"} text={q ? undefined : "Start a conversation with someone from the community."} action={!q && <button onClick={() => setCompose(true)} className="sw-btn">New message</button>} />
        ) : (
          <div className="sw-card divide-y divide-border overflow-hidden">
            {list.map((c) => (
              <Link key={c.username} href={`/messages/${c.username}`} onContextMenu={(e) => { e.preventDefault(); setToDelete(c); }} className="flex items-center gap-3 px-4 py-3.5 hover:bg-soft">
                <Avatar name={c.displayName} src={c.avatarUrl} size={50} online={c.online} />
                <div className="min-w-0 flex-1"><p className={`truncate ${c.unread ? "font-extrabold" : "font-semibold"}`}>{c.displayName}</p><p className={`truncate text-[13.5px] ${c.unread ? "font-semibold text-foreground" : "text-subtle"}`}>{c.last.mine ? "You: " : ""}{c.last.content}</p></div>
                <div className="flex flex-col items-end gap-1"><span className="text-xs text-subtle">{timeAgo(c.last.createdAt)}</span>{c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <NewMessage open={compose} onClose={() => setCompose(false)} />
      <Sheet open={!!toDelete} onClose={() => setToDelete(null)} title={toDelete?.displayName}>
        <button onClick={confirmDelete} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 font-semibold text-red-600 hover:bg-soft"><Trash2 size={20} /> Delete chat (only for you)</button>
      </Sheet>
    </Page>
  );
}
