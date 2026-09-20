"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorNote, Field, Page, SubHeader } from "@/components/ui";
import { api } from "@/lib/client";
import { ECONOMY } from "@/lib/economy";

export default function CreateBotPage() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", description: "", provider: "whatsapp", commandPrefix: "." });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setBusy(true); setError("");
    try { const r = await api<{ bot: { id: string } }>("/api/bots", { method: "POST", json: { ...f, description: f.description || undefined } }); router.push(`/bots/${r.bot.id}`); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }

  return (
    <Page>
      <SubHeader title="Add my bot" backHref="/bots" />
      <p className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">Register a bot you already have. It gets {ECONOMY.BOT_FREE_DAYS} days of free hosting; after that renew with {ECONOMY.BOT_RENEW_COINS} SC per {ECONOMY.BOT_RENEW_DAYS} days.</p>
      <div className="space-y-4">
        <Field label="Bot name"><input value={f.name} onChange={set("name")} maxLength={60} placeholder="My Scotty Bot" className="sw-input" /></Field>
        <Field label="What does it do?"><textarea value={f.description} onChange={set("description")} rows={3} maxLength={500} className="sw-input" /></Field>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <Field label="Platform"><select value={f.provider} onChange={set("provider")} className="sw-input"><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="discord">Discord</option><option value="custom">Custom</option></select></Field>
          <Field label="Prefix"><input value={f.commandPrefix} onChange={set("commandPrefix")} maxLength={5} className="sw-input text-center" /></Field>
        </div>
        {error && <ErrorNote message={error} />}
        <button onClick={submit} disabled={busy || f.name.trim().length < 2} className="sw-btn w-full py-3.5">{busy ? "Creating…" : "Create bot"}</button>
      </div>
    </Page>
  );
}
