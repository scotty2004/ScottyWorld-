"use client";

import { Badge, Empty, ListSkeleton } from "@/components/ui";
import { api, timeAgo, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type D = { id: string; usdCents: number; coins: number; status: string; method: string | null; createdAt: string; user: { username: string; email: string } };

export default function AdminDeposits() {
  const { data, loading, reload } = useApi<{ deposits: D[] }>("/api/admin/deposits");
  async function decide(id: string, decision: "CONFIRM" | "REJECT") {
    if (decision === "CONFIRM" && !confirm("Confirm you received this payment? Coins will be credited.")) return;
    try { await api("/api/admin/deposits", { method: "PATCH", json: { id, decision } }); toast(decision === "CONFIRM" ? "Coins credited" : "Rejected"); await reload(); } catch (e) { toast((e as Error).message, "err"); }
  }
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-extrabold">Deposits</h1><p className="text-sm text-subtle">Users quote the reference code when they pay. Confirm only after the money arrives.</p></div>
      {loading ? <ListSkeleton /> : !data?.deposits.length ? <Empty title="No deposits yet" /> : (
        <div className="sw-card divide-y divide-border overflow-hidden">
          {data.deposits.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1"><p className="font-semibold">${(d.usdCents / 100).toFixed(2)} → {d.coins} SC <span className="font-mono text-xs text-subtle">#{d.id.slice(-8).toUpperCase()}</span></p><p className="text-xs text-subtle">@{d.user.username} · {d.user.email} · {timeAgo(d.createdAt)} ago</p></div>
              {d.status === "PENDING" ? <div className="flex gap-2"><button onClick={() => decide(d.id, "REJECT")} className="sw-btn-ghost !px-3 !py-1.5 text-xs">Reject</button><button onClick={() => decide(d.id, "CONFIRM")} className="sw-btn !px-3 !py-1.5 text-xs">Confirm paid</button></div> : <Badge tone={d.status === "PAID" ? "green" : "red"}>{d.status.toLowerCase()}</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
