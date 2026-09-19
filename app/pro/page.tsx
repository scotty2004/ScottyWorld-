"use client";

import { useEffect,useState } from "react";
import { Check, Crown, CreditCard } from "lucide-react";

export default function ProPage(){
  const [plans,setPlans]=useState<any[]>([]);
  const [message,setMessage]=useState("");
  useEffect(()=>{fetch("/api/pro/plans").then(r=>r.json()).then(d=>setPlans(d.plans||[]))},[]);
  async function subscribe(planId:string){
    const r=await fetch("/api/pro/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId})});
    const d=await r.json();setMessage(d.message||d.error||"Request complete.");
  }
  return <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
    <div className="text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><Crown/></div><h1 className="mt-4 text-3xl font-bold">ScottyWorld Pro</h1><p className="mx-auto mt-2 max-w-xl text-sm text-muted">Premium capabilities with configurable plans and limits.</p></div>
    {message&&<div className="mx-auto mt-5 max-w-xl rounded-xl border border-border bg-card p-4 text-sm">{message}</div>}
    <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">{plans.map(p=><div key={p.id} className="rounded-2xl border border-border bg-card p-6"><p className="font-semibold">{p.name}</p><p className="mt-2 text-sm text-muted">{p.description}</p><p className="mt-5 text-3xl font-bold">{(p.priceCents/100).toFixed(2)} <span className="text-sm font-normal text-muted">{p.currency}/{p.interval.toLowerCase()}</span></p><ul className="mt-5 space-y-2">{(p.features||[]).map((f:string)=><li key={f} className="flex gap-2 text-sm"><Check size={16} className="mt-0.5 text-brand-500"/>{f}</li>)}</ul><button onClick={()=>subscribe(p.id)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"><CreditCard size={16}/> Continue</button></div>)}</div>
    {plans.length===0&&<div className="mx-auto mt-8 max-w-xl rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">No active Pro plans yet. Configure plans from the Control Center.</div>}
  </div>
}
