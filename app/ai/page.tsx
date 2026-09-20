"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, History, MoreVertical, Plus, Square, Trash2, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { MarkdownLite } from "@/components/markdown-lite";
import { Sheet, Badge } from "@/components/ui";
import { useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type Msg = { id: string; role: "user" | "assistant"; content: string; at: number; error?: boolean };
type Chat = { id: string; title: string; messages: Msg[]; updatedAt: number };

const STORE = "scottyworld:ai-chats:v1";
const uid = () => Math.random().toString(36).slice(2, 10);
const load = (): Chat[] => { try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; } };
const save = (c: Chat[]) => { try { localStorage.setItem(STORE, JSON.stringify(c.slice(0, 30))); } catch { /* storage full */ } };
const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const SUGGESTIONS = ["How do I create a REST API with Node.js?", "Explain JWT authentication", "Make me a WhatsApp bot idea", "Optimize my MySQL queries", "How does caching work?", "Teach me Python step by step"];

export default function AiPage() {
  const status = useApi<{ configured: boolean; limit: number; used: number; tier: string }>("/api/ai/chat");
  const [chats, setChats] = useState<Chat[]>([]);
  const [current, setCurrent] = useState<Chat>({ id: uid(), title: "New chat", messages: [], updatedAt: Date.now() });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [history, setHistory] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { const c = load(); setChats(c); if (c[0]) setCurrent(c[0]); }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [current.messages]);

  const persist = useCallback((chat: Chat) => {
    setChats((prev) => { const next = [chat, ...prev.filter((c) => c.id !== chat.id)]; save(next); return next; });
  }, []);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput(""); if (box.current) box.current.style.height = "auto";
    const userMsg: Msg = { id: uid(), role: "user", content: t, at: Date.now() };
    const botMsg: Msg = { id: uid(), role: "assistant", content: "", at: Date.now() };
    const base: Chat = { ...current, title: current.messages.length ? current.title : t.slice(0, 40), messages: [...current.messages, userMsg, botMsg], updatedAt: Date.now() };
    setCurrent(base); setBusy(true);

    const history = [...current.messages, userMsg].filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content }));
    abort.current = new AbortController();
    let acc = "";
    const patch = (content: string, error = false) => {
      const updated = { ...base, messages: base.messages.map((m) => (m.id === botMsg.id ? { ...m, content, error } : m)), updatedAt: Date.now() };
      setCurrent(updated); return updated;
    };
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history, stream: true }), signal: abort.current.signal });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        persist(patch(d.error || "Scotty AI couldn't answer. Try again.", true)); return;
      }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      for (;;) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); patch(acc); }
      persist(patch(acc || "I didn't get a response. Please try again.", !acc));
    } catch (e) {
      if ((e as Error).name === "AbortError") persist(patch(acc || "Stopped.")); else persist(patch(acc || "Connection lost. Check your internet and try again.", !acc));
    } finally { setBusy(false); abort.current = null; void status.reload(); }
  }

  const newChat = () => { setCurrent({ id: uid(), title: "New chat", messages: [], updatedAt: Date.now() }); setMenu(false); };
  const clearAll = () => { if (!confirm("Delete all chats on this device?")) return; setChats([]); save([]); newChat(); setHistory(false); };
  const empty = current.messages.length === 0;
  const s = status.data;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col lg:h-[calc(100dvh-4rem)]">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur-xl">
        <LogoMark size={30} />
        <h1 className="text-lg font-bold">Scotty AI</h1><Badge>AI</Badge>
        <span className="ml-1 flex items-center gap-1 text-xs text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />{s?.configured === false ? <span className="text-amber-600">setup needed</span> : "online"}</span>
        <button onClick={() => setMenu(true)} aria-label="Menu" className="ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><MoreVertical size={20} /></button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-glow"><Sparkles size={30} /></div>
            <h2 className="mt-4 text-xl font-bold">Hello! I&apos;m Scotty AI</h2>
            <p className="mt-1 text-sm text-subtle">How can I help you today?</p>
            <div className="mt-6 grid w-full max-w-md gap-2">
              {SUGGESTIONS.slice(0, 4).map((q) => <button key={q} onClick={() => send(q)} className="sw-card px-4 py-3 text-left text-sm font-medium hover:border-brand-500/50">{q}</button>)}
            </div>
          </div>
        ) : current.messages.map((m) => m.role === "user" ? (
          <div key={m.id} className="flex flex-col items-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-[15px] text-white"><p className="whitespace-pre-wrap break-words">{m.content}</p></div>
            <span className="mt-1 text-[11px] text-subtle">{clock(m.at)}</span>
          </div>
        ) : (
          <div key={m.id} className="flex gap-2.5">
            <span className="mt-1 shrink-0"><LogoMark size={28} /></span>
            <div className="min-w-0 max-w-[88%]">
              <div className={`rounded-2xl rounded-tl-md px-4 py-2.5 ${m.error ? "border border-red-500/30 bg-red-500/10 text-red-600" : "bg-soft"}`}>
                {m.content ? (m.error ? <p className="text-[15px]">{m.content}</p> : <MarkdownLite text={m.content} />) : <span className="flex gap-1 py-2">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-pulse3 rounded-full bg-subtle" style={{ animationDelay: `${i * 0.18}s` }} />)}</span>}
              </div>
              {m.content && !m.error && <span className="mt-1 block text-[11px] text-subtle">{clock(m.at)}</span>}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {empty ? null : !busy && (
        <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pb-2">
          {SUGGESTIONS.slice(2).map((q) => <button key={q} onClick={() => send(q)} className="sw-chip hover:bg-soft">{q}</button>)}
        </div>
      )}

      <div className="shrink-0 border-t border-border bg-card px-3 py-2.5">
        {s && s.limit !== -1 && <p className="mb-1.5 px-1 text-[11px] text-subtle">{Math.max(0, s.limit - s.used)} of {s.limit} messages left today{s.tier === "FREE" && <> · <Link href="/pro" className="font-semibold text-brand-600">Upgrade</Link></>}</p>}
        <div className="flex items-end gap-2">
          <textarea ref={box} value={input} rows={1} maxLength={4000} placeholder="Ask Scotty AI anything…"
            onChange={(e) => { setInput(e.target.value); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 140) + "px"; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width:1024px)").matches) { e.preventDefault(); void send(input); } }}
            className="sw-input max-h-36 flex-1 resize-none !rounded-2xl !py-3" />
          {busy ? (
            <button onClick={() => abort.current?.abort()} aria-label="Stop" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-800 text-white"><Square size={16} fill="currentColor" /></button>
          ) : (
            <button onClick={() => send(input)} disabled={!input.trim()} aria-label="Send" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-float disabled:opacity-40 disabled:shadow-none"><ArrowUp size={22} /></button>
          )}
        </div>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Scotty AI">
        <div className="space-y-1">
          <button onClick={newChat} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 font-semibold hover:bg-soft"><Plus size={20} className="text-brand-600" /> New chat</button>
          <button onClick={() => { setMenu(false); setHistory(true); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 font-semibold hover:bg-soft"><History size={20} className="text-brand-600" /> Chat history</button>
          <Link href="/bots?generate=1" className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 font-semibold hover:bg-soft"><Sparkles size={20} className="text-brand-600" /> Generate a bot file</Link>
        </div>
      </Sheet>
      <Sheet open={history} onClose={() => setHistory(false)} title="Chat history">
        {chats.length === 0 ? <p className="py-6 text-center text-sm text-subtle">No saved chats yet.</p> : (
          <div className="space-y-1">
            {chats.map((c) => <button key={c.id} onClick={() => { setCurrent(c); setHistory(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-soft ${c.id === current.id ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}><span className="truncate font-semibold">{c.title}</span><span className="ml-3 shrink-0 text-xs text-subtle">{new Date(c.updatedAt).toLocaleDateString()}</span></button>)}
            <button onClick={clearAll} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-red-600 hover:bg-red-500/10"><Trash2 size={16} /> Delete all chats</button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
