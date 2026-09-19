"use client";

import { useEffect,useState } from "react";
import { AlertTriangle, KeyRound, Monitor, ShieldCheck, X } from "lucide-react";

export default function SecurityPage(){
  const [data,setData]=useState<any>({events:[],sessions:[]});
  const [message,setMessage]=useState("");
  async function load(){const r=await fetch("/api/security/events");const d=await r.json();setData(d)}
  useEffect(()=>{load()},[]);
  async function revoke(id:string){const r=await fetch(`/api/security/sessions/${id}`,{method:"DELETE"});setMessage(r.ok?"Session revoked.":"Could not revoke session.");load()}
  return <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
    <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><ShieldCheck/></div><div><h1 className="text-3xl font-bold">Security Center</h1><p className="mt-1 text-sm text-muted">Review sessions, security events and account protection.</p></div></div>
    {message&&<p className="mt-4 rounded-xl border border-border bg-card p-3 text-sm">{message}</p>}
    <div className="mt-7 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-semibold"><Monitor size={18}/> Active sessions</h2><div className="mt-4 space-y-3">{data.sessions.map((x:any)=><div key={x.id} className="rounded-xl border border-border p-4"><div className="flex gap-3"><Monitor size={17} className="text-brand-500"/><div className="min-w-0 flex-1"><p className="truncate text-sm">{x.userAgent||"Unknown device"}</p><p className="mt-1 text-xs text-muted">Last seen {new Date(x.lastSeenAt).toLocaleString()}</p></div><button onClick={()=>revoke(x.id)} title="Revoke" className="text-muted hover:text-red-500"><X size={16}/></button></div></div>)}</div></section>
      <section className="rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-semibold"><AlertTriangle size={18}/> Security events</h2><div className="mt-4 space-y-3">{data.events.map((x:any)=><div key={x.id} className="rounded-xl border border-border p-4"><p className="text-sm font-medium">{x.event}</p><p className="mt-1 text-xs text-muted">{x.level} · {new Date(x.createdAt).toLocaleString()}</p></div>)}</div></section>
    </div>
    <div className="mt-6 rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-semibold"><KeyRound size={18}/> Protection checklist</h2><div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm"><div className="rounded-xl border border-border p-4">Password protection</div><div className="rounded-xl border border-border p-4">Session controls</div><div className="rounded-xl border border-border p-4">2FA foundation</div></div></div>
  </div>
}
