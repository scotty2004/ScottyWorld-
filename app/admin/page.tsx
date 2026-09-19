"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Bot, Coins, FileClock, GraduationCap, ShieldCheck, Store, Users } from "lucide-react";

const cards=[
 ["Users","users",Users,"/admin/users"],["Bots","bots",Bot,"/admin/bots"],["Marketplace","products",Store,"/admin/marketplace"],
 ["Open reports","reports",AlertTriangle,"/admin/community"],["Courses","courses",GraduationCap,"/admin/academy"],
 ["Active subscriptions","subscriptions",Coins,"/admin/payments"],["Security alerts","securityEvents",ShieldCheck,"/admin/security"],
 ["Audit records","auditLogs",FileClock,"/admin/audit-logs"]
] as const;

export default function AdminDashboard(){
 const [data,setData]=useState<any>(null);
 useEffect(()=>{fetch("/api/admin/overview").then(r=>r.ok?r.json():null).then(setData)},[]);
 return <div className="space-y-6">
  <div><p className="text-sm text-muted-foreground">Secure administration</p><h1 className="text-3xl font-bold">Control Center</h1><p className="mt-1 text-muted-foreground">Manage the platform through audited, role-protected tools.</p></div>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {cards.map(([label,key,Icon,href])=><Link href={href} key={key} className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
    <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon className="h-5 w-5"/></div>
    <div className="mt-3 text-3xl font-bold">{data?.[key] ?? "—"}</div>
   </Link>)}
  </div>
  <div className="grid gap-4 lg:grid-cols-2">
   <div className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4"/> Admin principles</div>
    <ul className="mt-4 space-y-2 text-sm text-muted-foreground"><li>Role-based access on both pages and APIs.</li><li>Privileged changes are written to the audit ledger.</li><li>Secrets, passwords and session tokens are never shown.</li><li>Coins are changed only through server-side transactions.</li></ul>
   </div>
   <div className="rounded-2xl border bg-card p-5"><div className="font-semibold">Phase 8 foundation</div><p className="mt-2 text-sm text-muted-foreground">The Control Center is ready for deeper moderation workflows, news management, channel management and production payment webhooks.</p></div>
  </div>
 </div>
}
