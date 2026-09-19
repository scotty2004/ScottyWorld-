"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Search, ShoppingBag, Star } from "lucide-react";

type Product = {
  id:string; slug:string; title:string; description:string; type:string; priceCoins:number; priceCents:number|null; currency:string;
  seller:{username:string;displayName:string}; _count:{reviews:number;orders:number};
};

export default function MarketplacePage() {
  const [products,setProducts] = useState<Product[]>([]);
  const [q,setQ] = useState("");
  const [loading,setLoading] = useState(true);

  async function load(search="") {
    setLoading(true);
    const r=await fetch(`/api/marketplace/products${search ? `?q=${encodeURIComponent(search)}` : ""}`);
    const d=await r.json(); setProducts(d.products||[]); setLoading(false);
  }
  useEffect(()=>{load()},[]);

  return <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
    <div className="flex items-center gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><ShoppingBag/></div>
      <div><h1 className="text-3xl font-bold">Marketplace</h1><p className="mt-1 text-sm text-muted">Discover bots, code, templates, tools and developer resources.</p></div>
    </div>
    <div className="mt-7 flex gap-2">
      <div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-muted"/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load(q)} placeholder="Search marketplace..." className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm"/></div>
      <button onClick={()=>load(q)} className="rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white">Search</button>
    </div>
    {loading ? <p className="mt-6 text-sm text-muted">Loading products...</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map(p=><Link href={`/marketplace/${p.slug}`} key={p.id} className="rounded-2xl border border-border bg-card p-5 hover:border-brand-500">
        <p className="text-xs text-brand-500">{p.type.replaceAll("_"," ")}</p><h2 className="mt-2 font-semibold">{p.title}</h2><p className="mt-2 line-clamp-3 text-sm text-muted">{p.description}</p>
        <div className="mt-5 flex items-center gap-3 text-xs text-muted"><span className="inline-flex items-center gap-1"><Coins size={13}/>{p.priceCoins} SC</span><span className="inline-flex items-center gap-1"><Star size={13}/>{p._count.reviews} reviews</span><span className="ml-auto">@{p.seller.username}</span></div>
      </Link>)}
    </div>}
  </div>
}
