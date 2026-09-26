"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Paperclip, Upload, X } from "lucide-react";
import { ErrorNote, Field, Page, SubHeader } from "@/components/ui";
import { api, bytes, compressImage, fileToDataUrl, useApi } from "@/lib/client";
import { ECONOMY, marketFee } from "@/lib/economy";
import { toast } from "@/components/toast";

const TYPES = [["BOT", "Bot file"], ["TEMPLATE", "Template"], ["CODE", "Script / Code"], ["TOOL", "Tool"], ["AI_TOOL", "AI tool"], ["THEME", "UI kit / Theme"], ["APP", "App"], ["PLUGIN", "Plugin"], ["DEV_RESOURCE", "Dev resource"]];

export default function SellPage() {
  const router = useRouter();
  const bots = useApi<{ bots: Array<{ id: string; name: string; hasFile: boolean }> }>("/api/bots");
  const [f, setF] = useState({ title: "", description: "", type: "BOT", price: "50", link: "", botId: "" });
  const [cover, setCover] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; size: number; data: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const coverRef = useRef<HTMLInputElement>(null); const fileRef = useRef<HTMLInputElement>(null);

  const price = Math.max(0, parseInt(f.price || "0", 10) || 0);
  const fee = marketFee(price);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });

  async function pickFile(x?: File) {
    if (!x) return;
    if (x.size > 1_000_000) return toast("Files can be up to 1 MB. For bigger files, paste a download link instead.", "err");
    setFile({ name: x.name, size: x.size, data: await fileToDataUrl(x) });
  }

  async function publish() {
    setBusy(true); setError("");
    try {
      await api("/api/marketplace/products", { method: "POST", json: {
        title: f.title, description: f.description, type: f.type, priceCoins: price,
        coverUrl: cover, downloadUrl: f.link || null, fileName: file?.name ?? null, fileData: file?.data ?? null, botId: f.botId || undefined,
      } });
      toast("Published to the marketplace!"); router.push("/marketplace/mine");
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const hasDelivery = Boolean(file || f.link || f.botId);
  const valid = f.title.trim().length >= 2 && f.description.trim().length >= 10 && hasDelivery;

  return (
    <Page>
      <SubHeader title="Sell an item" backHref="/marketplace" />
      <div className="space-y-4">
        <Field label="Cover image (optional)">
          <input ref={coverRef} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) setCover(await compressImage(x, 480, 0.72)); }} />
          {cover ? <div className="relative w-28">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={cover} alt="" className="h-28 w-28 rounded-2xl object-cover" /><button onClick={() => setCover(null)} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-white"><X size={14} /></button></div>
            : <button onClick={() => coverRef.current?.click()} className="grid h-28 w-28 place-items-center rounded-2xl border-2 border-dashed border-border text-subtle"><span className="text-center text-xs"><ImageIcon className="mx-auto mb-1" size={22} />Add image</span></button>}
        </Field>
        <Field label="Title"><input value={f.title} onChange={set("title")} maxLength={120} placeholder="e.g. Ultimate WhatsApp Bot v2" className="sw-input" /></Field>
        <Field label="Category"><select value={f.type} onChange={set("type")} className="sw-input">{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Description" hint="What it does, what's included, how to set it up."><textarea value={f.description} onChange={set("description")} rows={5} maxLength={5000} className="sw-input" /></Field>
        <Field label="Price (Scotty Coins)" hint={price === 0 ? "Free items can be downloaded by anyone." : `Buyers pay ${price} SC · platform fee ${ECONOMY.MARKET_FEE_PERCENT}% (${fee} SC) · you receive ${price - fee} SC per sale.`}>
          <input value={f.price} onChange={set("price")} inputMode="numeric" className="sw-input" />
        </Field>

        <div className="sw-card space-y-3 p-4">
          <p className="text-sm font-bold">What does the buyer get?</p>
          {bots.data?.bots.some((b) => b.hasFile) && (
            <Field label="Sell one of your generated bots"><select value={f.botId} onChange={set("botId")} className="sw-input"><option value="">— none —</option>{bots.data.bots.filter((b) => b.hasFile).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
          )}
          <input ref={fileRef} type="file" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
          {file ? <div className="flex items-center gap-2 rounded-xl bg-soft px-3 py-2.5 text-sm"><Paperclip size={16} /><span className="flex-1 truncate font-semibold">{file.name}</span><span className="text-subtle">{bytes(file.size)}</span><button onClick={() => setFile(null)}><X size={16} /></button></div>
            : <button onClick={() => fileRef.current?.click()} className="sw-btn-ghost w-full"><Upload size={17} /> Upload a file (max 1 MB)</button>}
          <Field label="…or a download link"><input value={f.link} onChange={set("link")} type="url" placeholder="https://" className="sw-input" /></Field>
        </div>
        {error && <ErrorNote message={error} />}
        <button onClick={publish} disabled={busy || !valid} className="sw-btn w-full py-3.5">{busy ? "Publishing…" : "Publish item"}</button>
      </div>
    </Page>
  );
}
