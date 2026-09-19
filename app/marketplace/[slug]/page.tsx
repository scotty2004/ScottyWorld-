"use client";

import { useEffect,useState } from "react";
import { useParams } from "next/navigation";
import { Coins, ShoppingCart, Star } from "lucide-react";

export default function ProductPage() {
  const {slug}=useParams<{slug:string}>();
  const [product,setProduct]=useState<any>(null);
  const [message,setMessage]=useState("");
  useEffect(()=>{fetch(`/api/marketplace/products/${slug}`).then(r=>r.json()).then(d=>setProduct(d.product))},[slug]);

  async function buy(){
    if(!product)return;
    const r=await fetch(`/api/marketplace/products/${product.id}/buy`,{method:"POST"});
    const d=await r.json(); setMessage(r.ok?"Purchase complete.":d.error||"Purchase failed.");
  }

  if(!product)return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">Loading product...</div>;
  return <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
    <p className="text-xs text-brand-500">{product.type.replaceAll("_"," ")}</p>
    <h1 className="mt-2 text-3xl font-bold">{product.title}</h1>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{product.description}</p>
    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5"><Coins size={15}/>{product.priceCoins} SC</span>
      <span className="inline-flex items-center gap-1 text-muted"><Star size={15}/>{product._count.reviews} reviews</span>
      <span className="text-muted">Seller: @{product.seller.username}</span>
    </div>
    <button onClick={buy} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white"><ShoppingCart size={17}/> Buy with Scotty Coins</button>
    {message&&<p className="mt-4 rounded-xl border border-border bg-card p-4 text-sm">{message}</p>}
    <div className="mt-8 space-y-3">{product.reviews.map((r:any)=><div key={r.id} className="rounded-xl border border-border bg-card p-4"><p className="text-sm font-medium">{r.user.displayName} · {r.rating}/5</p><p className="mt-1 text-sm text-muted">{r.body}</p></div>)}</div>
  </div>
}
