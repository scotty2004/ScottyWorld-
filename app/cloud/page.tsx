"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CloudUpload, Download, File as FileIcon, FileText, Film, ImageIcon, Trash2, Music } from "lucide-react";
import { Chips, Empty, ErrorNote, ListSkeleton, Page } from "@/components/ui";
import { api, bytes, timeAgo, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type F = { id: string; name: string; mimeType: string | null; sizeBytes: number; updatedAt: string };
type D = { files: F[]; usage: { usedBytes: number; limitBytes: number; tier: string }; storageConnected: boolean };

const kind = (m: string | null) => (m?.startsWith("image/") ? "image" : m?.startsWith("video/") ? "video" : m?.startsWith("audio/") ? "audio" : m?.includes("pdf") || m?.startsWith("text/") ? "doc" : "file");
const ICON = { image: [ImageIcon, "bg-pink-50 text-pink-600 dark:bg-pink-500/15"], video: [Film, "bg-violet-50 text-violet-600 dark:bg-violet-500/15"], audio: [Music, "bg-amber-50 text-amber-600 dark:bg-amber-500/15"], doc: [FileText, "bg-blue-50 text-blue-600 dark:bg-blue-500/15"], file: [FileIcon, "bg-slate-100 text-slate-600 dark:bg-slate-500/20"] } as const;

function putWithProgress(url: string, file: File, type: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url); x.setRequestHeader("Content-Type", type);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => (x.status < 300 ? resolve() : reject(new Error("Upload was rejected by storage.")));
    x.onerror = () => reject(new Error("Upload failed. Check your connection and the storage CORS settings."));
    x.send(file);
  });
}

export default function CloudPage() {
  const { data, loading, error, reload } = useApi<D>("/api/cloud/files");
  const [filter, setFilter] = useState("all");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const key = file.name + file.size;
      setProgress((p) => ({ ...p, [key]: 0 }));
      try {
        const type = file.type || "application/octet-stream";
        const r = await api<{ uploadUrl: string; key: string }>("/api/cloud/upload-url", { method: "POST", json: { filename: file.name, contentType: type, size: file.size } });
        await putWithProgress(r.uploadUrl, file, type, (pct) => setProgress((p) => ({ ...p, [key]: pct })));
        await api("/api/cloud/files", { method: "POST", json: { name: file.name, key: r.key, mimeType: type, sizeBytes: file.size, folder: "/" } });
        toast(`${file.name} uploaded`);
      } catch (e: any) { toast(e.status === 503 ? "Cloud storage isn't connected yet." : e.message, "err"); }
      setProgress((p) => { const n = { ...p }; delete n[key]; return n; });
    }
    if (input.current) input.current.value = "";
    await reload();
  }
  async function download(f: F) {
    try { const r = await api<{ url: string }>(`/api/cloud/files/${f.id}/download`); window.location.href = r.url; } catch (e) { toast((e as Error).message, "err"); }
  }
  async function remove(f: F) {
    if (!confirm(`Delete ${f.name}?`)) return;
    try { await api(`/api/cloud/files/${f.id}`, { method: "DELETE" }); toast("Deleted"); await reload(); } catch (e) { toast((e as Error).message, "err"); }
  }

  const files = (data?.files ?? []).filter((f) => filter === "all" || kind(f.mimeType) === filter || (filter === "file" && kind(f.mimeType) === "doc"));
  const pct = data ? Math.min(100, Math.round((data.usage.usedBytes / data.usage.limitBytes) * 100)) : 0;
  const uploading = Object.entries(progress);

  return (
    <Page>
      <h1 className="mb-3 text-2xl font-extrabold lg:hidden">Scotty Cloud</h1>
      {data && !data.storageConnected && <div className="mb-3 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"><AlertTriangle size={20} className="shrink-0" /><p>Cloud storage isn&apos;t connected yet, so uploads are disabled. The admin needs to add the S3/R2 keys in the server settings.</p></div>}
      {error && <ErrorNote message={error} onRetry={reload} />}

      <div className="sw-card p-4">
        <div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-subtle">Storage</p><p className="text-2xl font-extrabold">{data ? bytes(data.usage.usedBytes) : "—"} <span className="text-sm font-medium text-subtle">/ {data ? bytes(data.usage.limitBytes) : "—"}</span></p></div>
          {data?.usage.tier === "FREE" && <Link href="/pro" className="text-sm font-bold text-brand-600">Get more</Link>}</div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-soft"><div className={`h-full rounded-full transition-all ${pct > 90 ? "bg-red-500" : "bg-brand-600"}`} style={{ width: `${pct}%` }} /></div>
      </div>

      <input ref={input} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
      <button onClick={() => input.current?.click()} disabled={data ? !data.storageConnected : false} className="sw-btn mt-3 w-full py-3.5"><CloudUpload size={19} /> Upload photos, videos or files</button>

      {uploading.map(([k, p]) => <div key={k} className="sw-card mt-3 p-3"><p className="truncate text-sm font-semibold">{k.replace(/\d+$/, "")}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft"><div className="h-full bg-brand-600 transition-all" style={{ width: `${p}%` }} /></div></div>)}

      <div className="mt-4"><Chips items={[{ id: "all", label: "All" }, { id: "image", label: "Photos" }, { id: "video", label: "Videos" }, { id: "file", label: "Files" }]} value={filter} onChange={setFilter} /></div>
      <div className="mt-3">
        {loading ? <ListSkeleton /> : files.length === 0 ? <Empty icon={<CloudUpload size={28} />} title="Nothing here yet" text="Upload your pictures, videos and files. Only you can see them, and you can download them anytime." /> : (
          <div className="sw-card divide-y divide-border overflow-hidden">
            {files.map((f) => { const [I, c] = ICON[kind(f.mimeType) as keyof typeof ICON]; return (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c}`}><I size={21} /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{f.name}</p><p className="text-xs text-subtle">{bytes(f.sizeBytes)} · {timeAgo(f.updatedAt)} ago</p></div>
                <button onClick={() => download(f)} aria-label="Download" className="grid h-9 w-9 place-items-center rounded-lg text-brand-600 hover:bg-soft"><Download size={18} /></button>
                <button onClick={() => remove(f)} aria-label="Delete" className="grid h-9 w-9 place-items-center rounded-lg text-subtle hover:bg-red-500/10 hover:text-red-600"><Trash2 size={17} /></button>
              </div>); })}
          </div>
        )}
      </div>
    </Page>
  );
}
