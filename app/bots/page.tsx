"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Plus, Activity, ArrowRight } from "lucide-react";

type BotRecord = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  provider: string;
  version: string;
  _count: { commands: number; events: number };
};

export default function BotsPage() {
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch("/api/bots");
    if (response.ok) setBots((await response.json()).bots);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bot Studio</h1>
          <p className="mt-2 text-muted">Create, configure, test and manage your ScottyWorld bots.</p>
        </div>
        <Link href="/bots/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white">
          <Plus size={18} /> Create bot
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-sm text-muted">Loading your bots...</div>
      ) : bots.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Bot className="mx-auto text-brand-500" size={34} />
          <h2 className="mt-4 font-semibold">No bots yet</h2>
          <p className="mt-2 text-sm text-muted">Start with the Bot Factory and create your first project.</p>
          <Link href="/bots/create" className="mt-5 inline-flex rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white">Open Bot Factory</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {bots.map(bot => (
            <Link key={bot.id} href={`/bots/${bot.id}`} className="rounded-2xl border border-border bg-card p-6 hover:border-brand-500">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-500"><Bot /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">{bot.name}</h2>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs">{bot.status}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{bot.description || "No description yet."}</p>
                  <div className="mt-5 flex items-center gap-4 text-xs text-muted">
                    <span>{bot.provider}</span>
                    <span>v{bot.version}</span>
                    <span>{bot._count.commands} commands</span>
                    <span className="ml-auto"><ArrowRight size={16} /></span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
