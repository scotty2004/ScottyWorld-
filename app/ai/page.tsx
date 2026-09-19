"use client";
import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.answer || data.error || "No response." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">Scotty AI</h1>
        <p className="text-sm text-muted-foreground">Your technology assistant inside ScottyWorld.</p>
      </div>
      <div className="flex-1 space-y-3 rounded-2xl border bg-card p-4">
        {messages.length === 0 && <div className="flex min-h-[40vh] items-center justify-center text-center text-sm text-muted-foreground">Ask about coding, bots, websites, AI or the ScottyWorld platform.</div>}
        {messages.map((m, i) => (
          <div key={i} className={`rounded-2xl p-3 text-sm ${m.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-muted"}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Ask Scotty..." className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3" />
        <button disabled={busy} onClick={send} className="rounded-xl bg-primary px-5 text-primary-foreground disabled:opacity-50">{busy ? "..." : "Send"}</button>
      </div>
    </div>
  );
}
