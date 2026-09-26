"use client";

import Link from "next/link";
import { Coins, Download, Package } from "lucide-react";
import { Badge, Empty, ListSkeleton, Page, Section, SubHeader } from "@/components/ui";
import { useApi } from "@/lib/client";

type D = { selling: Array<{ id: string; slug: string; title: string; type: string; priceCoins: number; status: string; _count: { orders: number } }>; bought: Array<{ id: string; product: { id: string; slug: string; title: string } }>; earnings: { coins: number; fees: number; sales: number } };

export default function MyMarketPage() {
  const { data, loading } = useApi<D>("/api/marketplace/mine");
  return (
    <Page>
      <SubHeader title="My marketplace" backHref="/marketplace" />
      {loading || !data ? <ListSkeleton /> : (
        <>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Sales", data.earnings.sales], ["Earned (SC)", data.earnings.coins], ["Fees paid (SC)", data.earnings.fees]].map(([l, v]) => <div key={l as string} className="sw-card py-3"><p className="text-xl font-extrabold">{v}</p><p className="text-[11px] text-subtle">{l}</p></div>)}
          </div>
          <Section title="Selling" className="!mt-5">
            {data.selling.length === 0 ? <Empty icon={<Package size={26} />} title="You're not selling anything yet" action={<Link href="/marketplace/sell" className="sw-btn">Sell an item</Link>} /> : (
              <div className="sw-card divide-y divide-border overflow-hidden">{data.selling.map((p) => (
                <Link key={p.id} href={`/marketplace/${p.slug}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-soft"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.title}</p><p className="text-xs text-subtle">{p._count.orders} sold</p></div><span className="flex items-center gap-1 text-sm font-bold text-amber-600"><Coins size={13} />{p.priceCoins}</span><Badge tone={p.status === "PUBLISHED" ? "green" : "slate"}>{p.status.toLowerCase()}</Badge></Link>
              ))}</div>
            )}
          </Section>
          <Section title="Purchased">
            {data.bought.length === 0 ? <p className="sw-card p-6 text-center text-sm text-subtle">Nothing purchased yet.</p> : (
              <div className="sw-card divide-y divide-border overflow-hidden">{data.bought.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-4 py-3.5"><Link href={`/marketplace/${o.product.slug}`} className="min-w-0 flex-1 truncate font-semibold">{o.product.title}</Link><a href={`/api/marketplace/products/${o.product.id}/download`} className="sw-btn-ghost !px-3 !py-2"><Download size={16} /></a></div>
              ))}</div>
            )}
          </Section>
        </>
      )}
    </Page>
  );
}
