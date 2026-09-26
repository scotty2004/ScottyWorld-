"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Coins, Search, Store } from "lucide-react";
import { Chips, Empty, ErrorNote, ListSkeleton, Page } from "@/components/ui";
import { api, compact } from "@/lib/client";
import { Cover } from "@/components/market-cover";
import { ECONOMY } from "@/lib/economy";

type P = { id: string; slug: string; title: string; description: string; type: string; priceCoins: number; coverUrl: string | null; seller: { username: string; displayName: string }; _count: { reviews: number; orders: number } };

const CATS = [{ id: "", label: "All" }, { id: "BOT", label: "Bots" }, { id: "TEMPLATE", label: "Templates" }, { id: "CODE", label: "Scripts" }, { id: "TOOL", label: "Tools" }, { id: "THEME", label: "UI Kits" }, { id: "APP", label: "Apps" }, { id: "PLUGIN", label: "Plugins" }];
const LABEL: Record<string, string> = { BOT: "Bot", TEMPLATE: "Template", CODE: "Script", TOOL: "Tool", AI_TOOL: "AI Tool", THEME: "UI Kit", APP: "App", PLUGIN: "Plugin", DEV_RESOURCE: "Resource" };

export default function MarketplacePage() {
  const [q, setQ] = useState(""); const [type, setType] = useState("");
  const [items, setItems] = useState<P[] | null>(null); const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams({ ...(q ? { q } : {}), ...(type ? { type } : {}) });
      api<{ products: P[] }>(`/api/marketplace/products?${qs}`).then((r) => { setItems(r.products); setError(""); }).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q, type]);

  return (
    <Page>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Marketplace</h1>
        <div className="flex gap-2"><Link href="/marketplace/mine" className="sw-btn-ghost !px-3.5 !py-2 text-xs">My items</Link><Link href="/marketplace/sell" className="sw-btn !px-3.5 !py-2 text-xs">+ Sell</Link></div>
      </div>
      <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bots, templates, scripts…" className="sw-input !pl-11" /></div>
      <div className="mt-3"><Chips items={CATS} value={type} onChange={setType} /></div>

      <div className="mb-2 mt-4 flex items-center justify-between"><h2 className="text-[15px] font-bold">{type || q ? "Results" : "Popular items"}</h2><span className="text-xs text-subtle">Anyone can sell · {ECONOMY.MARKET_FEE_PERCENT}% platform fee</span></div>
      {error ? <ErrorNote message={error} /> : items === null ? <ListSkeleton /> : items.length === 0 ? (
        <Empty icon={<Store size={26} />} title="Nothing here yet" text="Be the first to sell a bot file, template or script." action={<Link href="/marketplace/sell" className="sw-btn">Sell something</Link>} />
      ) : (
        <div className="sw-card divide-y divide-border overflow-hidden">
          {items.map((p) => (
            <Link key={p.id} href={`/marketplace/${p.slug}`} className="flex items-center gap-3 p-3.5 hover:bg-soft">
              <Cover url={p.coverUrl} type={p.type} />
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{p.title}</p><p className="text-[13px] text-subtle">{LABEL[p.type] ?? p.type} · by {p.seller.displayName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] font-bold text-amber-600"><Coins size={14} />{p.priceCoins === 0 ? "Free" : `${compact(p.priceCoins)} SC`}{p._count.orders > 0 && <span className="ml-2 font-normal text-subtle">{p._count.orders} sold</span>}</p></div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
