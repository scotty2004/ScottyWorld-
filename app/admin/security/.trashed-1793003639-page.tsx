"use client";
import {useEffect,useState}from"react";
export default function Security(){const[rows,setRows]=useState<any[]>([]);useEffect(()=>{fetch("/api/admin/security").then(r=>r.ok?r.json():[]).then(setRows)},[]);
return <div className="space-y-5"><h1 className="text-2xl font-bold">Security events</h1><div className="grid gap-3">{rows.map(r=><div key={r.id} className="rounded-2xl border bg-card p-4"><div className="font-semibold">{r.type||r.event||"Security event"} <span className="ml-2 text-xs text-muted-foreground">{r.level}</span></div><div className="mt-1 text-xs text-muted-foreground">{r.user?.username||r.user?.email||"System"} · {new Date(r.createdAt).toLocaleString()}</div></div>)}</div></div>}
