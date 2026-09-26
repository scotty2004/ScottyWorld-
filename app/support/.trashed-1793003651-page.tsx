"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Clock, HelpCircle, MessageCircle, Send, Ticket } from "lucide-react";
import { Badge, Empty, ErrorNote, Field, Page, Sheet, SubHeader } from "@/components/ui";
import { api, timeAgo, useApi } from "@/lib/client";
import { SUPPORT } from "@/lib/economy";
import { toast } from "@/components/toast";

type T = { id: string; subject: string; message: string; status: string; priority: string; createdAt: string };

export default function SupportPage() {
  const { data, reload } = useApi<{ tickets: T[] }>("/api/support/tickets");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ subject: "", message: "", priority: "NORMAL" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const tickets = data?.tickets ?? [];

  async function submit() {
    setBusy(true); setErr("");
    try { await api("/api/support/tickets", { method: "POST", json: f }); setOpen(false); setF({ subject: "", message: "", priority: "NORMAL" }); toast("Ticket sent to the admin"); await reload(); }
    catch (e) { setErr((e as Error).message.includes("[") ? "Please give a subject (3+ chars) and a message (5+ chars)." : (e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Page>
      <SubHeader title="Help & Support" backHref="/menu" />
      <div className="sw-card overflow-hidden">
        <div className="wallet-card p-5 text-white"><p className="text-lg font-extrabold">How can we help you?</p><p className="mt-1 flex items-center gap-1.5 text-sm text-white/85"><Clock size={15} /> We reply in {SUPPORT.responseTime}</p></div>
        <a href={SUPPORT.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-4 hover:bg-soft">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15"><MessageCircle size={22} /></span>
          <span className="flex-1"><span className="block font-bold">Chat on WhatsApp</span><span className="block text-[13px] text-subtle">{SUPPORT.whatsapp}</span></span><ChevronRight size={18} className="text-subtle" />
        </a>
        <button onClick={() => setOpen(true)} className="flex w-full items-center gap-3 border-t border-border px-4 py-4 text-left hover:bg-soft">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15"><Ticket size={22} /></span>
          <span className="flex-1"><span className="block font-bold">Write a ticket</span><span className="block text-[13px] text-subtle">Goes straight to our admin team</span></span><ChevronRight size={18} className="text-subtle" />
        </button>
        <Link href="/faq" className="flex items-center gap-3 border-t border-border px-4 py-4 hover:bg-soft">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15"><HelpCircle size={22} /></span>
          <span className="flex-1"><span className="block font-bold">Read the FAQ</span><span className="block text-[13px] text-subtle">Quick answers to common questions</span></span><ChevronRight size={18} className="text-subtle" />
        </Link>
      </div>

      <h2 className="mb-2 mt-6 text-[15px] font-bold">Your tickets</h2>
      {tickets.length === 0 ? <Empty icon={<Ticket size={26} />} title="No tickets yet" text="Need help? Send us a ticket and we'll get back to you." /> : (
        <div className="sw-card divide-y divide-border overflow-hidden">
          {tickets.map((t) => (
            <div key={t.id} className="px-4 py-3.5"><div className="flex items-center gap-2"><p className="min-w-0 flex-1 truncate font-semibold">{t.subject}</p><Badge tone={t.status === "RESOLVED" || t.status === "CLOSED" ? "green" : t.status === "OPEN" ? "amber" : "blue"}>{t.status.toLowerCase().replace("_", " ")}</Badge></div>
              <p className="mt-0.5 line-clamp-1 text-[13px] text-subtle">{t.message}</p><p className="mt-1 text-xs text-subtle">{timeAgo(t.createdAt)} ago</p></div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New support ticket">
        <div className="space-y-4">
          <Field label="Subject"><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} maxLength={150} placeholder="What do you need help with?" className="sw-input" /></Field>
          <Field label="Priority"><select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className="sw-input"><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">Urgent</option></select></Field>
          <Field label="Message"><textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={5} maxLength={5000} placeholder="Tell us what happened…" className="sw-input" /></Field>
          {err && <ErrorNote message={err} />}
          <button onClick={submit} disabled={busy || f.subject.trim().length < 3 || f.message.trim().length < 5} className="sw-btn w-full py-3.5"><Send size={17} /> {busy ? "Sending…" : "Send ticket"}</button>
        </div>
      </Sheet>
    </Page>
  );
}
