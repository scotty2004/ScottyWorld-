"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, Send } from "lucide-react";
import { Avatar, ErrorNote } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { useRealtime } from "@/components/realtime";
import { toast } from "@/components/toast";

type M = { id: string; content: string; createdAt: string; mine: boolean; read: boolean | null };
type D = { peer: { username: string; displayName: string; avatarUrl: string | null; online: boolean }; messages: M[] };
const hm = (d: string) => new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ThreadPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const { data, error, reload, setData } = useApi<D>(`/api/messages/${username}`);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const onTick = useCallback(() => { void reload(); }, [reload]);
  useRealtime(onTick as any);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [data?.messages.length]);

  async function send() {
    const t = text.trim(); if (!t || busy) return;
    setBusy(true); setText("");
    try { const r = await api<{ message: M }>(`/api/messages/${username}`, { method: "POST", json: { content: t } }); setData((d) => d && { ...d, messages: [...d.messages, r.message] }); }
    catch (e) { setText(t); toast((e as Error).message, "err"); } finally { setBusy(false); }
  }

  const p = data?.peer;
  let lastDay = "";
  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col lg:h-[calc(100dvh-4rem)]">
      <header className="safe-top flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-2 backdrop-blur-xl">
        <button onClick={() => router.back()} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><ArrowLeft size={22} /></button>
        {p && <Link href={`/u/${p.username}`} className="flex min-w-0 items-center gap-3"><Avatar name={p.displayName} src={p.avatarUrl} size={38} online={p.online} /><div className="min-w-0"><p className="truncate font-bold leading-tight">{p.displayName}</p><p className="text-xs text-subtle">{p.online ? "Online" : `@${p.username}`}</p></div></Link>}
      </header>
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {error ? <ErrorNote message={error} /> : data?.messages.length === 0 ? <p className="py-16 text-center text-sm text-subtle">Say hi to {p?.displayName} 👋</p> : data?.messages.map((m) => {
          const day = new Date(m.createdAt).toDateString(); const show = day !== lastDay; lastDay = day;
          return (
            <div key={m.id}>
              {show && <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wide text-subtle">{new Date(m.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>}
              <div className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${m.mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-soft"}`}>
                  <p className="whitespace-pre-wrap break-words text-[15px]">{m.content}</p>
                  <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${m.mine ? "text-white/70" : "text-subtle"}`}>{hm(m.createdAt)}{m.mine && (m.read === null ? <Check size={12} /> : m.read ? <CheckCheck size={13} className="text-sky-200" /> : <Check size={12} />)}</p>
                </div>
              </div>
            </div>);
        })}
        <div ref={end} />
      </div>
      <div className="safe-bottom shrink-0 border-t border-border bg-card px-3 py-2.5">
        <div className="flex items-end gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000} placeholder="Message…" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width:1024px)").matches) { e.preventDefault(); void send(); } }} className="sw-input max-h-32 flex-1 resize-none !rounded-2xl !py-2.5" />
          <button onClick={send} disabled={!text.trim() || busy} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white disabled:opacity-40"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
