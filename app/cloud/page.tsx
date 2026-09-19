"use client";

import { useEffect,useState } from "react";
import { Cloud, File, Folder, Plus, Trash2 } from "lucide-react";

export default function CloudPage(){
  const [files,setFiles]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  async function load(){const r=await fetch("/api/cloud/files");const d=await r.json();setFiles(d.files||[]);setLoading(false)}
  useEffect(()=>{load()},[]);
  async function remove(id:string){await fetch(`/api/cloud/files/${id}`,{method:"DELETE"});load()}
  async function addDemo(){
    const key=`project-${Date.now()}.json`;
    await fetch("/api/cloud/files",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:key,key,mimeType:"application/json",sizeBytes:0,folder:"/",visibility:"PRIVATE"})});
    load();
  }
  return <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
    <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><Cloud/></div><div><h1 className="text-3xl font-bold">Scotty Cloud</h1><p className="mt-1 text-sm text-muted">Your private project and file workspace.</p></div></div>
    <button onClick={addDemo} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/> Add file metadata</button>
    <div className="mt-6 rounded-2xl border border-border bg-card">{loading?<p className="p-6 text-sm text-muted">Loading...</p>:files.length===0?<p className="p-6 text-sm text-muted">No files yet.</p>:files.map(f=><div key={f.id} className="flex items-center gap-3 border-b border-border p-4 last:border-0"><File size={18} className="text-brand-500"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{f.name}</p><p className="text-xs text-muted">{f.folder} · {f.visibility} · {f.sizeBytes} bytes</p></div><button onClick={()=>remove(f.id)} className="text-muted hover:text-red-500"><Trash2 size={16}/></button></div>)}</div>
    <div className="mt-4 flex items-center gap-2 text-xs text-muted"><Folder size={14}/> Storage provider integration can be connected later without changing the metadata API.</div>
  </div>
}
