"use client";

import Link from "next/link";
import { AlertTriangle, Bot, Coins, FileClock, GraduationCap, Landmark, LifeBuoy, ListChecks, ShieldCheck, Store, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { useApi } from "@/lib/client";

const URGENT = [["Task reviews waiting", "pendingTasks", ListChecks, "/admin/tasks"], ["Deposits to confirm", "pendingDeposits", Landmark, "/admin/deposits"], ["Open support tickets", "openTickets", LifeBuoy, "/admin/support"], ["Open reports", "reports", AlertTriangle, "/admin/community"]] as const;
const STATS = [["Users", "users", Users, "/admin/users"], ["Bots", "bots", Bot, "/admin/bots"], ["Marketplace items", "products", Store, "/admin/marketplace"], ["Courses", "courses", GraduationCap, "/admin/academy"], ["Active subscriptions", "subscriptions", Coins, "/admin/payments"], ["Security alerts", "securityEvents", ShieldCheck, "/admin/security"], ["Audit records", "auditLogs", FileClock, "/admin/audit-logs"]] as const;

export default function AdminDashboard() {
  const { data } = useApi<Record<string, number>>("/api/admin/overview");
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold">Control Center</h1><p className="text-sm text-subtle">Everything that needs your attention.</p></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {URGENT.map(([l, k, I, href]) => (
          <Link key={k} href={href} className={`sw-card p-4 transition hover:-translate-y-0.5 ${data?.[k] ? "!border-amber-500/40 bg-amber-500/5" : ""}`}>
            <I size={20} className={data?.[k] ? "text-amber-600" : "text-brand-600"} />
            {data ? <p className="mt-2 text-3xl font-extrabold">{data[k] ?? 0}</p> : <Skeleton className="mt-2 h-9 w-14" />}
            <p className="text-[13px] text-subtle">{l}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="wallet-card rounded-2xl p-5 text-white"><p className="flex items-center gap-2 text-sm font-semibold text-white/85"><TrendingUp size={16} /> Marketplace fees earned</p><p className="mt-1 text-3xl font-extrabold">{data ? data.marketFees.toLocaleString() : "—"} SC</p></div>
        <div className="sw-card p-5"><p className="flex items-center gap-2 text-sm font-semibold text-subtle"><Coins size={16} /> Coins in circulation</p><p className="mt-1 text-3xl font-extrabold">{data ? data.coinsInCirculation.toLocaleString() : "—"} SC</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATS.map(([l, k, I, href]) => (
          <Link key={k} href={href} className="sw-card p-4"><div className="flex items-center justify-between text-subtle"><span className="text-[13px]">{l}</span><I size={17} /></div><p className="mt-2 text-2xl font-extrabold">{data ? data[k] ?? 0 : "—"}</p></Link>
        ))}
      </div>
    </div>
  );
}
