"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, Send, Phone, Video, MoreVertical, Reply, Trash2, X } from "lucide-react";
import { Avatar, ErrorNote, Sheet } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { useRealtime } from "@/components/realtime";
import { toast } from "@/components/toast";

type M = { id: string; content: string | null; deleted: boolean; createdAt: string; mine: boolean; read: boolean | null; replyTo: { id: string; content: string | null; mine: boolean } | null };
type D = { peer: { username: string; displayName: string; avatarUrl: string | null; online: boolean }; messages: M[] };
const hm = (d: string) => new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const SWIPE_TRIGGER = 56;

function Bubble({ m, onReply, onDelete }: { m: M; onReply: () => void; onDelete: () => void }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [menu, setMenu] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    if (m.deleted) return;
    start.current = { x: e.clientX, y: e.clientY };
    fired.current = false;
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return;
    const dxRaw = e.clientX - start.current.x;
    const dyRaw = e.clientY - start.current.y;
    if (Math.abs(dyRaw) > Math.abs(dxRaw) * 1.2) return; // vertical scroll gesture — ignore
    // Swipe right to reply (works for both sent and received bubbles — mirrors most chat apps)
    const clamped = Math.max(0, Math.min(dxRaw, 88));
    setDx(clamped);
    if (clamped >= SWIPE_TRIGGER && !fired.current) { fired.current = true; if (navigator.vibrate) navigator.vibrate(8); }
  }
  function onPointerUp() {
    if (fired.current) onReply();
    setDx(0); setDragging(false); start.current = null;
  }

  return (
    <div
      className={`relative flex ${m.mine ? "justify-end" : "justify-start"} touch-pan-y select-none`}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
    >
      {dx > 8 && <span className="absolute left-1/2 top-1/2 -translate-y-1/2 text-brand-500" style={{ opacity: Math.min(dx / SWIPE_TRIGGER, 1) }}><Reply size={18} /></span>}
      <div
        onContextMenu={(e) => { e.preventDefault(); if (m.mine && !m.deleted) setMenu(true); }}
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? "none" : "transform 180ms ease" }}
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${m.mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-soft"}`}
      >
        {m.replyTo && (
          <div className={`mb-1 rounded-lg border-l-2 px-2 py-1 text-[12px] ${m.mine ? "border-white/50 bg-white/10 text-white/80" : "border-brand-500 bg-black/5 text-subtle dark:bg-white/10"}`}>
            {m.replyTo.content ?? "Message deleted"}
          </div>
        )}
        {m.deleted ? (
          <p className={`text-[15px] italic ${m.mine ? "text-white/70" : "text-subtle"}`}>This message was deleted</p>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px]">{m.content}</p>
        )}
        <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${m.mine ? "text-white/70" : "text-subtle"}`}>{hm(m.createdAt)}{m.mine && (m.read === null ? <Check size={12} /> : m.read ? <CheckCheck size={13} className="text-sky-200" /> : <Check size={12} />)}</p>
      </div>
      <Sheet open={menu} onClose={() => setMenu(false)} title="Message">
        <div className="space-y-1">
          <button onClick={() => { setMenu(false); onReply(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 font-semibold hover:bg-soft"><Reply size={20} className="text-brand-600" /> Reply</button>
          <button onClick={() => { setMenu(false); onDelete(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 font-semibold text-red-600 hover:bg-soft"><Trash2 size={20} /> Delete for everyone</button>
        </div>
      </Sheet>
    </div>
  );
}

export default function ThreadPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const { data, error, reload, setData } = useApi<D>(`/api/messages/${username}`);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<M | null>(null);
  const [headerMenu, setHeaderMenu] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const onTick = useCallback(() => { void reload(); }, [reload]);
  useRealtime(onTick);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [data?.messages.length]);

  async function send() {
    const t = text.trim(); if (!t || busy) return;
    setBusy(true); setText("");
    const rid = replyTo?.id; setReplyTo(null);
    try {
      const r = await api<{ message: M }>(`/api/messages/${username}`, { method: "POST", json: { content: t, replyToId: rid } });
      setData((d) => d && { ...d, messages: [...d.messages, r.message] });
    } catch (e) { setText(t); toast((e as Error).message, "err"); } finally { setBusy(false); }
  }

  async function deleteMessage(id: string) {
    if (!confirm("Delete this message for everyone?")) return;
    setData((d) => d && { ...d, messages: d.messages.map((m) => (m.id === id ? { ...m, content: null, deleted: true, replyTo: m.replyTo } : m)) });
    try { await api(`/api/messages/${username}/${id}`, { method: "DELETE" }); } catch (e) { toast((e as Error).message, "err"); void reload(); }
  }

  async function deleteChat() {
    if (!confirm(`Delete this chat with ${p?.displayName}? This only removes it for you.`)) return;
    try { await api(`/api/messages/${username}`, { method: "DELETE" }); setData((d) => d && { ...d, messages: [] }); toast("Chat deleted"); router.push("/messages"); }
    catch (e) { toast((e as Error).message, "err"); }
    setHeaderMenu(false);
  }

  const p = data?.peer;
  let lastDay = "";
  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col lg:h-[calc(100dvh-4rem)]">
      <header className="safe-top flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-2 backdrop-blur-xl">
        <button onClick={() => router.back()} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><ArrowLeft size={22} /></button>
        {p && <Link href={`/u/${p.username}`} className="flex min-w-0 flex-1 items-center gap-3"><Avatar name={p.displayName} src={p.avatarUrl} size={38} online={p.online} /><div className="min-w-0"><p className="truncate font-bold leading-tight">{p.displayName}</p><p className="text-xs text-subtle">{p.online ? "Online" : `@${p.username}`}</p></div></Link>}
        {p && (
          <div className="ml-auto flex items-center gap-1">
            <Link href={`/messages/${username}/call?video=0`} aria-label="Voice call" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><Phone size={19} /></Link>
            <Link href={`/messages/${username}/call?video=1`} aria-label="Video call" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><Video size={20} /></Link>
            <button onClick={() => setHeaderMenu(true)} aria-label="More" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><MoreVertical size={19} /></button>
          </div>
        )}
      </header>
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {error ? <ErrorNote message={error} /> : data?.messages.length === 0 ? <p className="py-16 text-center text-sm text-subtle">Say hi to {p?.displayName} 👋</p> : data?.messages.map((m) => {
          const day = new Date(m.createdAt).toDateString(); const show = day !== lastDay; lastDay = day;
          return (
            <div key={m.id}>
              {show && <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wide text-subtle">{new Date(m.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>}
              <Bubble m={m} onReply={() => setReplyTo(m)} onDelete={() => deleteMessage(m.id)} />
            </div>);
        })}
        <div ref={end} />
      </div>
      <div className="safe-bottom shrink-0 border-t border-border bg-card px-3 py-2.5">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-soft px-3 py-2">
            <Reply size={16} className="shrink-0 text-brand-600" />
            <p className="min-w-0 flex-1 truncate text-[13px]">Replying to {replyTo.mine ? "yourself" : p?.displayName}: <span className="text-subtle">{replyTo.deleted ? "Message deleted" : replyTo.content}</span></p>
            <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="text-subtle hover:text-foreground"><X size={16} /></button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000} placeholder="Message…" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width:1024px)").matches) { e.preventDefault(); void send(); } }} className="sw-input max-h-32 flex-1 resize-none !rounded-2xl !py-2.5" />
          <button onClick={send} disabled={!text.trim() || busy} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white disabled:opacity-40"><Send size={18} /></button>
        </div>
      </div>
      <Sheet open={headerMenu} onClose={() => setHeaderMenu(false)} title={p?.displayName}>
        <div className="space-y-1">
          <button onClick={deleteChat} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 font-semibold text-red-600 hover:bg-soft"><Trash2 size={20} /> Delete chat</button>
        </div>
      </Sheet>
    </div>
  );
}
