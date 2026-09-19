"use client";
import {useEffect,useState} from "react";
export default function Users(){
 const [q,setQ]=useState(""); const [rows,setRows]=useState<any[]>([]);
 const load=()=>fetch("/api/admin/users?q="+encodeURIComponent(q)).then(r=>r.ok?r.json():[]).then(setRows);
 useEffect(()=>{load()},[]);
 return <div className="space-y-5"><div><h1 className="text-2xl font-bold">Users</h1><p className="text-sm text-muted-foreground">Search platform accounts and roles.</p></div>
 <div className="flex gap-2"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search username or email" className="w-full rounded-xl border bg-background px-3 py-2"/><button onClick={load} className="rounded-xl bg-primary px-4 text-primary-foreground">Search</button></div>
 <div className="overflow-x-auto rounded-2xl border"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Username</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Created</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-b last:border-0"><td className="p-3">{r.username||"—"}</td><td className="p-3">{r.email}</td><td className="p-3">{r.role}</td><td className="p-3">{new Date(r.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>
}
