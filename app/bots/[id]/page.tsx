"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, Play, Square, Rocket, FlaskConical, Activity } from "lucide-react";

type BotData = {
  id: string; name: string; description: string | null; status: string; provider: string; version: string; commandPrefix: string;
  commands: { id: string; name: string; description: string | null; enabled: boolean }[];
  events: { id: string; type: string; message: string; createdAt: string }[];
};

export default function BotDetailsPage() {
  const params = useParams<{ id: string }>();
  const [bot, setBot] = useState<BotData | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch(`/api/bots/${params.id}`);
    const data = await response.json();
    if (!response.ok) setError(data.error || "Bot unavailable.");
    else setBot(data.bot);
  }

  useEffect(() => { if (params.id) load(); }, [params.id]);

  async function action(action: string) {
    const response = await fetch(`/api/bots/${params.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Action failed.");
    else load();
  }

  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><div className="rounded-2xl border border-border bg-card p-7 text-sm">{error}</div></div>;
  if (!bot) return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted">Loading bot...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><Bot /></div>
          <div>
            <h1 className="text-3xl font-bold">{bot.name}</h1>
            <p className="mt-1 text-sm text-muted">{bot.description || "No description"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => action("test")} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm"><FlaskConical size={17} /> Test</button>
          <button onClick={() => action("start")} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"><Play size={17} /> Start</button>
          <button onClick={() => action("stop")} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm"><Square size={17} /> Stop</button>
          <button onClick={() => action("deploy")} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm"><Rocket size={17} /> Deploy</button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted">Status</p><p className="mt-2 font-semibold">{bot.status}</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted">Provider</p><p className="mt-2 font-semibold">{bot.provider}</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted">Version</p><p className="mt-2 font-semibold">v{bot.version}</p></div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3"><Activity size={19} className="text-brand-500" /><h2 className="font-semibold">Bot events</h2></div>
          <div className="mt-5 space-y-3">
            {bot.events.length === 0 ? <p className="text-sm text-muted">No events yet.</p> : bot.events.map(event => (
              <div key={event.id} className="rounded-xl bg-background p-3">
                <div className="flex justify-between gap-3 text-xs"><span className="font-medium">{event.type}</span><span className="text-muted">{new Date(event.createdAt).toLocaleString()}</span></div>
                <p className="mt-1 text-sm text-muted">{event.message}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Commands</h2>
          <div className="mt-5 space-y-3">
            {bot.commands.length === 0 ? <p className="text-sm text-muted">No commands configured yet.</p> : bot.commands.map(command => (
              <div key={command.id} className="flex items-center justify-between rounded-xl bg-background p-3">
                <div><p className="font-medium">{bot.commandPrefix}{command.name}</p><p className="text-xs text-muted">{command.description || "No description"}</p></div>
                <span className="text-xs text-muted">{command.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
