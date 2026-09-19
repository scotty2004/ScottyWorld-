 "use client";

import { useEffect, useState } from "react";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  async function load() {
    const r = await fetch("/api/support/tickets");
    const d = await r.json();
    if (r.ok) setTickets(d.tickets || []);
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Sending...");
    const r = await fetch("/api/support/tickets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    setStatus(r.ok ? "Ticket created." : "Could not create ticket.");
    if (r.ok) { setSubject(""); setMessage(""); load(); }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Support</h1>
      <p className="mt-1 text-muted-foreground">Get help with your ScottyWorld account and features.</p>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-3xl border bg-card p-6">
        <input required value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full rounded-xl border bg-background px-4 py-3" />
        <textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe the issue..." rows={6} className="w-full rounded-xl border bg-background px-4 py-3" />
        <button className="rounded-xl bg-primary px-5 py-3 text-primary-foreground">Create ticket</button>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </form>
      <div className="mt-8 space-y-3">
        {tickets.map(t => <div key={t.id} className="rounded-2xl border p-4"><b>{t.subject}</b><div className="text-sm text-muted-foreground">{t.status} · {new Date(t.createdAt).toLocaleString()}</div></div>)}
      </div>
    </main>
  );
}
