"use client";

import { ExternalLink, Facebook, MessageCircle, Music2, Radio, Send, Youtube, type LucideIcon } from "lucide-react";
import { Empty, ListSkeleton, Page, SubHeader } from "@/components/ui";
import { useApi } from "@/lib/client";

type C = { id: string; name: string; platform: string; url: string; description: string | null };
const P: Record<string, { i: LucideIcon; label: string; c: string }> = {
  WHATSAPP: { i: MessageCircle, label: "WhatsApp", c: "bg-emerald-500" }, TELEGRAM: { i: Send, label: "Telegram", c: "bg-sky-500" },
  TIKTOK: { i: Music2, label: "TikTok", c: "bg-slate-900" }, YOUTUBE: { i: Youtube, label: "YouTube", c: "bg-red-600" }, FACEBOOK: { i: Facebook, label: "Facebook", c: "bg-blue-600" },
};

export default function ChannelsPage() {
  const { data, loading } = useApi<{ channels: C[] }>("/api/channels");
  return (
    <Page>
      <SubHeader title="Channels" backHref="/menu" />
      <p className="mb-4 text-sm text-subtle">Join our official channels for updates, giveaways and community. Some of them also have coin tasks — see <a className="font-semibold text-brand-600" href="/coins">Scotty Coins</a>.</p>
      {loading ? <ListSkeleton /> : !data?.channels.length ? <Empty icon={<Radio size={26} />} title="No channels yet" /> : (
        <div className="space-y-3">
          {data.channels.map((c) => { const p = P[c.platform] ?? { i: Radio, label: c.platform, c: "bg-brand-600" }; const I = p.i; return (
            <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" className="sw-card flex items-center gap-3.5 p-4 transition hover:border-brand-500/40">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${p.c}`}><I size={24} /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{c.name}</p><p className="text-xs font-semibold text-brand-600">{p.label}</p>{c.description && <p className="mt-0.5 line-clamp-2 text-[13px] text-subtle">{c.description}</p>}</div>
              <span className="sw-btn !px-3.5 !py-2 text-xs">Join <ExternalLink size={13} /></span>
            </a>); })}
        </div>
      )}
    </Page>
  );
}
