"use client";
import {useEffect,useState}from"react";
export default function Academy(){const[rows,setRows]=useState<any[]>([]);useEffect(()=>{fetch("/api/admin/academy").then(r=>r.ok?r.json():[]).then(setRows)},[]);
return <div className="space-y-5"><div><h1 className="text-2xl font-bold">Academy</h1><p className="text-sm text-muted-foreground">Course publishing and content overview.</p></div><div className="grid gap-3 sm:grid-cols-2">{rows.map(r=><div key={r.id} className="rounded-2xl border bg-card p-4"><div className="font-semibold">{r.title}</div><div className="mt-1 text-xs text-muted-foreground">{r.level} · {r.status}</div></div>)}</div></div>}
