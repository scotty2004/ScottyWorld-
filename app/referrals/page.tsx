"use client";

import { Copy, Gift, MousePointerClick, Share2, UserCheck, UserPlus, Coins } from "lucide-react";
import { Avatar, Badge, Empty, ListSkeleton, Page, SubHeader } from "@/components/ui";
import { copyText, timeAgo, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type D = { code: string; link: string; rewards: { perReferral: number; perClick: number }; stats: { clicks: number; signups: number; successful: number; earned: number }; referrals: Array<{ id: string; status: string; createdAt: string; referred: { username: string; displayName: string } }> };

export default function ReferralsPage() {
  const { data, loading } = useApi<D>("/api/referrals");

  async function share() {
    if (!data) return;
    const text = `Join me on ScottyWorld — AI, bots, learning & community in one app. ${data.link}`;
    if (navigator.share) { try { await navigator.share({ title: "ScottyWorld", text, url: data.link }); return; } catch { return; } }
    await copyText(text); toast("Invite message copied");
  }

  return (
    <Page>
      <SubHeader title="Referrals" backHref="/menu" />
      {loading || !data ? <ListSkeleton /> : (
        <>
          <div className="wallet-card rounded-3xl p-5 text-white shadow-float">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15"><Gift size={22} /></span>
            <h2 className="mt-3 text-xl font-extrabold">Invite friends, earn coins</h2>
            <p className="mt-1 text-sm text-white/85">Get <b>{data.rewards.perReferral} SC</b> for every friend who joins and verifies their email, plus <b>{data.rewards.perClick} SC</b> for each new visitor who clicks your link.</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/20 p-1.5 pl-3"><span className="min-w-0 flex-1 truncate font-mono text-[13px]">{data.link}</span>
              <button onClick={async () => { await copyText(data.link); toast("Link copied"); }} className="grid h-9 w-9 place-items-center rounded-lg bg-white/20" aria-label="Copy link"><Copy size={16} /></button></div>
            <button onClick={share} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-brand-700"><Share2 size={17} /> Share invite</button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[[MousePointerClick, "Link clicks", data.stats.clicks], [UserPlus, "Sign-ups", data.stats.signups], [UserCheck, "Successful", data.stats.successful], [Coins, "Coins earned", data.stats.earned]].map(([I, l, v]: any) => (
              <div key={l} className="sw-card p-4"><I size={19} className="text-brand-600" /><p className="mt-2 text-2xl font-extrabold">{v}</p><p className="text-xs text-subtle">{l}</p></div>
            ))}
          </div>

          <h2 className="mb-2 mt-6 text-[15px] font-bold">Your referrals</h2>
          {data.referrals.length === 0 ? <Empty icon={<UserPlus size={26} />} title="No referrals yet" text="Share your link — you'll see everyone who joins here." /> : (
            <div className="sw-card divide-y divide-border overflow-hidden">
              {data.referrals.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3.5"><Avatar name={r.referred.displayName} size={40} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.referred.displayName}</p><p className="text-xs text-subtle">Joined {timeAgo(r.createdAt)} ago</p></div>
                  {r.status === "REWARDED" ? <Badge tone="green">+{data.rewards.perReferral} SC</Badge> : <Badge tone="amber">Pending verification</Badge>}</div>
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  );
}
