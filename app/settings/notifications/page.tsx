"use client";

import { ListSkeleton, Page, SubHeader, Toggle } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

const LABEL: Record<string, [string, string]> = {
  COMMUNITY: ["Community", "Likes, comments, replies and follows"], MARKETPLACE: ["Marketplace", "Sales and purchases"], BOT: ["Bots", "Hosting and bot status"],
  ACADEMY: ["Academy", "Courses and progress"], REFERRAL: ["Referrals", "Referral rewards"], PRO: ["Pro", "Plan updates"], SYSTEM: ["Wallet & system", "Coins, tasks, deposits and announcements"],
};

export default function NotificationSettings() {
  const { data, loading, setData } = useApi<{ preferences: Array<{ type: string; enabled: boolean }> }>("/api/notifications/preferences");
  async function toggle(type: string, enabled: boolean) {
    setData((d: any) => d && { preferences: d.preferences.map((p: any) => (p.type === type ? { ...p, enabled } : p)) });
    try { await api("/api/notifications/preferences", { method: "PATCH", json: { type, enabled } }); } catch (e) { toast((e as Error).message, "err"); }
  }
  return (
    <Page>
      <SubHeader title="Notifications" backHref="/settings" />
      <p className="mb-3 text-sm text-subtle">Choose what shows up in your notifications.</p>
      {loading ? <ListSkeleton /> : (
        <div className="sw-card divide-y divide-border">
          {data?.preferences.map((p) => { const [t, d] = LABEL[p.type] ?? [p.type, ""]; return (
            <div key={p.type} className="flex items-center gap-3 px-4 py-4"><div className="flex-1"><p className="font-semibold">{t}</p><p className="text-[13px] text-subtle">{d}</p></div><Toggle checked={p.enabled} onChange={(v) => toggle(p.type, v)} /></div>); })}
        </div>
      )}
      <p className="mt-3 text-xs text-subtle">Security alerts are always shown.</p>
    </Page>
  );
}
