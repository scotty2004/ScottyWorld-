"use client";

import { useEffect,useState } from "react";
import { Gift, Users } from "lucide-react";

export default function ReferralsPage(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{fetch("/api/referrals").then(r=>r.json()).then(d=>setItems(d.referrals||[]))},[]);
  return <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
    <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><Gift/></div><div><h1 className="text-3xl font-bold">Referrals</h1><p className="mt-1 text-sm text-muted">Invite people and track referral rewards.</p></div></div>
    <div className="mt-7 rounded-2xl border border-border bg-card p-6"><Users className="text-brand-500"/><p className="mt-3 text-2xl font-bold">{items.length}</p><p className="text-sm text-muted">Referral records</p></div>
    <div className="mt-5 space-y-3">{items.map(x=><div key={x.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm"><span>@{x.referred.username}</span><span className="text-muted">{x.status}</span><span>{x.rewardCoins} SC</span></div>)}</div>
  </div>
}
