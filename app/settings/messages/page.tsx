"use client";

import { ListSkeleton, Page, SubHeader, Toggle } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

export default function MessageSettings() {
  const { data, loading, setData } = useApi<{ account: { preferences: { readReceipts: boolean; showOnlineStatus: boolean } } }>("/api/account");
  const p = data?.account.preferences;
  async function set(k: "readReceipts" | "showOnlineStatus", v: boolean) {
    setData((d: any) => d && { account: { ...d.account, preferences: { ...d.account.preferences, [k]: v } } });
    try { await api("/api/account", { method: "PATCH", json: { [k]: v } }); } catch (e) { toast((e as Error).message, "err"); }
  }
  return (
    <Page>
      <SubHeader title="Messages" backHref="/settings" />
      {loading || !p ? <ListSkeleton rows={2} /> : (
        <div className="sw-card divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-4"><div className="flex-1"><p className="font-semibold">Read receipts</p><p className="text-[13px] text-subtle">Let people see when you&apos;ve read their messages. If you turn this off, you won&apos;t see theirs either.</p></div><Toggle checked={p.readReceipts} onChange={(v) => set("readReceipts", v)} /></div>
          <div className="flex items-center gap-3 px-4 py-4"><div className="flex-1"><p className="font-semibold">Online status</p><p className="text-[13px] text-subtle">Show the green dot when you&apos;re active.</p></div><Toggle checked={p.showOnlineStatus} onChange={(v) => set("showOnlineStatus", v)} /></div>
        </div>
      )}
    </Page>
  );
}
