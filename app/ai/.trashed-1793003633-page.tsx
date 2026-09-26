"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, History, MoreVertical, Paperclip, Plus, Square, Trash2, Sparkles, X, FileArchive, Download } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { MarkdownLite } from "@/components/markdown-lite";
import { Sheet, Badge } from "@/components/ui";
import { useApi, uploadToStorage, bytes } from "@/lib/client";
import { downloadZip } from "@/lib/zip";
import { toast } from "@/components/toast";

type Attachment = { key: string; name: string; type: string; size: number };
type Msg = { id: string; role: "user" | "assistant"; content: string; at: number; error?: boolean; attachments?: Attachment[] };
type Chat = { id: string; title: string; messages: Msg[]; updatedAt: number };

const STORE = "scottyworld:ai-chats:v1";
const uid = () => Math.random().toString(36).slice(2, 10);
const load = (): Chat[] => { try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; } };
const save = (c: Chat[]) => { try { localStorage.setItem(STORE, JSON.stringify(c.slice(0, 30))); } catch { /* storage full */ } };
const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const MAX_ATTACHMENTS = 4;

const SUGGESTIONS = ["How do I create a REST API with Node.js?", "Explain JWT authentication", "Make me a WhatsApp bot idea", "Optimize my MySQL queries", "How does caching work?", "Teach me Python step by step"];

function AttachmentChip({ a, onRemove }: { a: Attachment; onRemove?: () => void }) {
  const isImage = a.type.startsWith("image/");
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-soft px-2 py-1.5 text-xs">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/files/${a.key}`} alt={a.name} className="h-8 w-8 rounded-lg object-cover" />
      ) : (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-600"><Paperclip size={14} /></span>
      )}
      <div className="min-w-0"><p className="max-w-[140px] truncate font-semibold">{a.name}</p><p className="text-subtle">{bytes(a.size)}</p></div>
      {onRemove ? <button onClick={onRemove} aria-label="Remove attachment" className="ml-1 text-subtle hover:text-red-500"><X size={14} /></button>
        : <a href={`/api/files/${a.key}?download=1`} aria-label="Download attachment" className="ml-1 text-subtle hover:text-brand-600"><Download size={14} /></a>}
    </div>
  );
}

export default function AiPage() {
  const status = useApi<{ configured: boolean; limit: number; used: number; tier: string }>("/api/ai/chat");
  const [chats, setChats] = useState<Chat[]>([]);
  const [current, setCurrent] = useState<Chat>({ id: uid(), title: "New chat", messages: [], updatedAt: Date.now() });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [history, setHistory] = useState(false);
  const [pending, setPending] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { const c = load(); setChats(c); if (c[0]) setCurrent(c[0]); }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [current.messages]);

  const persist = useCallback((chat: Chat) => {
    setChats((prev) => { const next = [chat, ...prev.filter((c) => c.id !== chat.id)]; save(next); return next; });
  }, []);

  async function onPickFiles(list: FileList | null) {
    if (!list || !list.length) return;
    const files = Array.from(list).slice(0, MAX_ATTACHMENTS - pending.length);
    if (!files.length) { toast(`You can attach up to ${MAX_ATTACHMENTS} files.`, "err"); return; }
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) { toast(`${file.name} is over 20 MB.`, "err"); continue; }
        const up = await uploadToStorage(file, { purpose: "media" });
        setPending((p) => [...p, { key: up.key, name: file.name, type: file.type || "application/octet-stream", size: file.size }]);
      }
    } catch (e) { toast((e as Error).message, "err"); } finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  }

  async function send(text: string) {
    const t = text.trim();
    if ((!t && !pending.length) || busy || uploading) return;
    setInput(""); if (box.current) box.current.style.height = "auto";
    const atts = pending; setPending([]);
    const userMsg: Msg = { id: uid(), role: "user", content: t, at: Date.now(), attachments: atts.length ? atts : undefined };
    const botMsg: Msg = { id: uid(), role: "assistant", content: "", at: Date.now() };
    const base: Chat = { ...current, title: current.messages.length ? current.title : (t || atts[0]?.name || "New chat").slice(0, 40), messages: [...current.messages, userMsg, botMsg], updatedAt: Date.now() };
    setCurrent(base); setBusy(true);

    const historyMsgs = [...current.messages, userMsg].filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content }));
    abort.current = new AbortController();
    let acc = "";
    const patch = (content: string, error = false) => {
      const updated = { ...base, messages: base.messages.map((m) => (m.id === botMsg.id ? { ...m, content, error } : m)), updatedAt: Date.now() };
      setCurrent(updated); return updated;
    };
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: historyMsgs, attachments: atts, stream: true }), signal: abort.current.signal });
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

  const newChat = () => { setCurrent({ id: uid(), title: "New chat", messages: [], updatedAt: Date.now() }); setPending([]); setMenu(false); };
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
            {m.attachments && m.attachments.length > 0 && <div className="mb-1.5 flex max-w-[85%] flex-wrap justify-end gap-1.5">{m.attachments.map((a) => <AttachmentChip key={a.key} a={a} />)}</div>}
            {m.content && <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-[15px] text-white"><p className="whitespace-pre-wrap break-words">{m.content}</p></div>}
            <span className="mt-1 text-[11px] text-subtle">{clock(m.at)}</span>
          </div>
        ) : (
          <div key={m.id} className="flex gap-2.5">
            <span className="mt-1 shrink-0"><LogoMark size={28} /></span>
            <div className="min-w-0 max-w-[88%]">
              <div className={`rounded-2xl rounded-tl-md px-4 py-2.5 ${m.error ? "border border-red-500/30 bg-red-500/10 text-red-600" : "bg-soft"}`}>
                {m.content ? (m.error ? <p className="text-[15px]">{m.content}</p> : <MarkdownLiteWithZip text={m.content} />) : <span className="flex gap-1 py-2">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-pulse3 rounded-full bg-subtle" style={{ animationDelay: `${i * 0.18}s` }} />)}</span>}
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
        {(pending.length > 0 || uploading) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {pending.map((a) => <AttachmentChip key={a.key} a={a} onRemove={() => setPending((p) => p.filter((x) => x.key !== a.key))} />)}
            {uploading && <span className="flex items-center gap-1.5 rounded-xl border border-border px-2 py-1.5 text-xs text-subtle"><span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /> Uploading…</span>}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileInput} type="file" multiple hidden accept="image/*,.zip,.pdf,.txt,.md,.json,.csv,.js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.html,.css,.log,.yml,.yaml" onChange={(e) => onPickFiles(e.target.files)} />
          <button onClick={() => fileInput.current?.click()} disabled={uploading || pending.length >= MAX_ATTACHMENTS} aria-label="Attach file" className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-subtle hover:bg-soft disabled:opacity-40"><Paperclip size={20} /></button>
          <textarea ref={box} value={input} rows={1} maxLength={4000} placeholder="Ask Scotty AI anything…"
            onChange={(e) => { setInput(e.target.value); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 140) + "px"; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width:1024px)").matches) { e.preventDefault(); void send(input); } }}
            className="sw-input max-h-36 flex-1 resize-none !rounded-2xl !py-3" />
          {busy ? (
            <button onClick={() => abort.current?.abort()} aria-label="Stop" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-800 text-white"><Square size={16} fill="currentColor" /></button>
          ) : (
            <button onClick={() => send(input)} disabled={(!input.trim() && !pending.length) || uploading} aria-label="Send" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-float disabled:opacity-40 disabled:shadow-none"><ArrowUp size={22} /></button>
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

/** Renders an assistant reply and, when it contains 2+ named code files, offers a real "Download all as .zip". */
function MarkdownLiteWithZip({ text }: { text: string }) {
  const [files, setFiles] = useState<Array<{ name: string; content: string }>>([]);
  return (
    <div>
      <MarkdownLite text={text} onFiles={setFiles} />
      {files.length > 1 && (
        <button onClick={() => downloadZip("scotty-ai-files.zip", files)} className="mt-2 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-soft"><FileArchive size={14} /> Download all {files.length} files as .zip</button>
      )}
    </div>
  );
}
