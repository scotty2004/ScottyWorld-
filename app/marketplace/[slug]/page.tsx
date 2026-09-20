"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Coins, Download, ShoppingCart, Star } from "lucide-react";
import { Avatar, Badge, ErrorNote, Field, ListSkeleton, Page, Sheet, SubHeader } from "@/components/ui";
import { Cover } from "@/components/market-cover";
import { api, timeAgo, useApi } from "@/lib/client";
import { coinsToUsd } from "@/lib/economy";
import { toast } from "@/components/toast";

type D = { product: { id: string; slug: string; title: string; description: string; type: string; priceCoins: number; coverUrl: string | null; fileName: string | null; seller: { username: string; displayName: string }; reviews: Array<{ id: string; rating: number; body: string | null; createdAt: string; user: { username: string; displayName: string } }>; _count: { orders: number; reviews: number } }; owned: boolean; isSeller: boolean; feePercent: number };

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data, loading, error, reload } = useApi<D>(`/api/marketplace/products/${slug}`);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5); const [body, setBody] = useState("");
  const p = data?.product;

  async function buy() {
    if (!p) return; setBusy(true);
    try { await api(`/api/marketplace/products/${p.id}/buy`, { method: "POST" }); setConfirm(false); toast("Purchase complete! You can download now."); await reload(); }
    catch (e: any) { toast(e.status === 402 ? `Not enough coins — you have ${e.data?.balance ?? 0} SC.` : e.message, "err"); } finally { setBusy(false); }
  }
  async function review() {
    if (!p) return;
    try { await api(`/api/marketplace/products/${p.id}/reviews`, { method: "POST", json: { rating, body: body || undefined } }); setBody(""); toast("Review posted"); await reload(); } catch (e) { toast((e as Error).message, "err"); }
  }

  const avg = p && p.reviews.length ? p.reviews.reduce((n, r) => n + r.rating, 0) / p.reviews.length : 0;
  const canDownload = data && (data.owned || p?.priceCoins === 0);

  return (
    <Page>
      <SubHeader title="Item" backHref="/marketplace" />
      {loading ? <ListSkeleton /> : error || !p || !data ? <ErrorNote message={error || "Item not found."} /> : (
        <>
          <div className="sw-card p-4">
            <div className="flex gap-3"><Cover url={p.coverUrl} type={p.type} size={72} />
              <div className="min-w-0 flex-1"><h1 className="text-xl font-extrabold leading-tight">{p.title}</h1>
                <Link href={`/u/${p.seller.username}`} className="text-sm text-subtle">by <span className="font-semibold text-brand-600">{p.seller.displayName}</span></Link>
                <div className="mt-1.5 flex items-center gap-2"><Badge>{p.type.replace("_", " ")}</Badge>{avg > 0 && <span className="flex items-center gap-1 text-xs font-semibold"><Star size={13} className="fill-amber-400 text-amber-400" />{avg.toFixed(1)} ({p.reviews.length})</span>}<span className="text-xs text-subtle">{p._count.orders} sold</span></div></div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{p.description}</p>
          </div>

          <div className="sticky bottom-20 z-20 mt-4 lg:bottom-4">
            <div className="sw-card flex items-center gap-3 p-3.5 shadow-float">
              <div className="flex-1"><p className="flex items-center gap-1.5 text-xl font-extrabold text-amber-600"><Coins size={20} />{p.priceCoins === 0 ? "Free" : `${p.priceCoins} SC`}</p>{p.priceCoins > 0 && <p className="text-xs text-subtle">≈ ${coinsToUsd(p.priceCoins).toFixed(2)}</p>}</div>
              {data.isSeller ? <Badge tone="green">Your listing</Badge> : canDownload ? (
                <a href={`/api/marketplace/products/${p.id}/download`} className="sw-btn"><Download size={18} /> Download</a>
              ) : <button onClick={() => setConfirm(true)} className="sw-btn"><ShoppingCart size={18} /> Buy now</button>}
              {data.isSeller && <a href={`/api/marketplace/products/${p.id}/download`} className="sw-btn-ghost"><Download size={18} /></a>}
            </div>
          </div>

          <h2 className="mb-2 mt-6 text-[15px] font-bold">Reviews</h2>
          {data.owned && !data.isSeller && (
            <div className="sw-card mb-3 p-4">
              <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}><Star size={26} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-border"} /></button>)}</div>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={2000} placeholder="Share your experience (optional)" className="sw-input mt-3" />
              <button onClick={review} className="sw-btn mt-3">Post review</button>
            </div>
          )}
          {p.reviews.length === 0 ? <p className="sw-card p-6 text-center text-sm text-subtle">No reviews yet.</p> : (
            <div className="sw-card divide-y divide-border">{p.reviews.map((r) => (
              <div key={r.id} className="flex gap-3 p-4"><Avatar name={r.user.displayName} size={36} /><div><p className="text-sm"><b>{r.user.displayName}</b> <span className="text-subtle">· {timeAgo(r.createdAt)}</span></p><div className="mt-0.5 flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-border"} />)}</div>{r.body && <p className="mt-1 text-sm">{r.body}</p>}</div></div>
            ))}</div>
          )}

          <Sheet open={confirm} onClose={() => setConfirm(false)} title="Confirm purchase">
            <p className="text-[15px]">Buy <b>{p.title}</b> for <b>{p.priceCoins} SC</b>? Coins are taken from your wallet and the file unlocks instantly.</p>
            <button onClick={buy} disabled={busy} className="sw-btn mt-5 w-full py-3.5">{busy ? "Processing…" : `Pay ${p.priceCoins} SC`}</button>
            <Link href="/coins" className="mt-3 block text-center text-sm font-semibold text-brand-600">Need coins? Open wallet</Link>
          </Sheet>
        </>
      )}
    </Page>
  );
}
