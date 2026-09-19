"use client";
import {useEffect,useState} from "react";
export default function Bots(){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{fetch("/api/admin/bots").then(r=>r.ok?r.json():[]).then(setRows)},[]);
return <div className="space-y-5"><div><h1 className="text-2xl font-bold">Bots</h1><p className="text-sm text-muted-foreground">Review bot ownership, status and activity state.</p></div>
<div className="grid gap-3">{rows.map(r=><div key={r.id} className="rounded-2xl border bg-card p-4 flex justify-between gap-4"><div><div className="font-semibold">{r.name}</div><div className="text-xs text-muted-foreground">{r.owner?.username||r.owner?.email||"Unknown owner"}</div></div><span className="text-sm">{r.status}</span></div>)}</div></div>}
