"use client";
import {useEffect,useState}from"react";
export default function Settings(){const[rows,setRows]=useState<any[]>([]);const[key,setKey]=useState("");const[value,setValue]=useState("");
const load=()=>fetch("/api/admin/settings").then(r=>r.ok?r.json():[]).then(setRows);useEffect(()=>{load()},[]);
const save=async()=>{let parsed:any=value;try{parsed=JSON.parse(value)}catch{};const r=await fetch("/api/admin/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,value:parsed})});if(r.ok){setKey("");setValue("");load()}};
return <div className="space-y-5"><div><h1 className="text-2xl font-bold">Platform settings</h1><p className="text-sm text-muted-foreground">Only privileged admin roles can change settings, and every update is audited.</p></div>
<div className="rounded-2xl border bg-card p-4 grid gap-2 sm:grid-cols-3"><input value={key} onChange={e=>setKey(e.target.value)} placeholder="Setting key" className="rounded-lg border bg-background px-3 py-2"/><input value={value} onChange={e=>setValue(e.target.value)} placeholder='Value, e.g. "enabled"' className="rounded-lg border bg-background px-3 py-2"/><button onClick={save} className="rounded-lg bg-primary px-3 py-2 text-primary-foreground">Save</button></div>
<div className="grid gap-3">{rows.map(r=><div key={r.id} className="rounded-xl border bg-card p-4"><div className="font-medium">{r.key}</div><pre className="mt-1 overflow-auto text-xs text-muted-foreground">{JSON.stringify(r.value)}</pre></div>)}</div></div>}
