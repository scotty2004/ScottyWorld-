"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ChevronRight } from "lucide-react";

export default function CreateBotPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const response = await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        provider: form.get("provider"),
        commandPrefix: form.get("commandPrefix"),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not create bot.");
      setLoading(false);
      return;
    }

    router.push(`/bots/${data.bot.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><Bot /></div>
        <div><h1 className="text-3xl font-bold">Bot Factory</h1><p className="mt-1 text-sm text-muted">Create a bot project. Deployment is intentionally separate from creation.</p></div>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div>
          <label className="text-sm font-medium">Bot name</label>
          <input name="name" required maxLength={60} placeholder="My Scotty Bot" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea name="description" maxLength={500} rows={4} placeholder="What should this bot do?" className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Provider</label>
            <select name="provider" defaultValue="custom" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3">
              <option value="custom">Custom</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Command prefix</label>
            <input name="commandPrefix" defaultValue="." maxLength={5} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" />
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Creating..." : "Create bot"} <ChevronRight size={17} />
        </button>
      </form>
    </div>
  );
}
