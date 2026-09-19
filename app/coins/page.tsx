"use client";

import { useEffect,useState } from "react";
import { Coins, History, Wallet } from "lucide-react";

export default function CoinsPage(){
  const [data,setData]=useState<any>({balance:0,transactions:[]});
  useEffect(()=>{fetch("/api/coins").then(r=>r.json()).then(setData)},[]);
  return <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
    <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><Coins/></div><div><h1 className="text-3xl font-bold">Scotty Coins</h1><p className="mt-1 text-sm text-muted">Your platform rewards and spending balance.</p></div></div>
    <div className="mt-7 rounded-2xl border border-border bg-card p-6"><Wallet className="text-brand-500"/><p className="mt-3 text-xs text-muted">Current balance</p><p className="mt-1 text-4xl font-bold">{data.balance} SC</p></div>
    <div className="mt-7"><h2 className="flex items-center gap-2 font-semibold"><History size={18}/> Transaction history</h2><div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">{data.transactions.map((t:any)=><div key={t.id} className="flex items-center justify-between p-4 text-sm"><div><p>{t.reason}</p><p className="mt-1 text-xs text-muted">{new Date(t.createdAt).toLocaleString()}</p></div><span className={t.amount>=0?"text-brand-500":"text-red-500"}>{t.amount>=0?"+":""}{t.amount} SC</span></div>)}</div></div>
  </div>
}
