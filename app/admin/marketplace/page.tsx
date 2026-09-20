"use client";

import { ListSkeleton } from "@/components/ui";
import { AdminHeader, Table, Td } from "@/components/admin/table";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type P = { id: string; title: string; type: string; priceCoins: number; status: string; seller: { username: string | null; email: string } };

export default function AdminMarketplace() {
  const { data, setData } = useApi<P[]>("/api/admin/marketplace");
  async function set(id: string, status: string) {
    try { await api("/api/admin/marketplace", { method: "PATCH", json: { id, status } }); setData((d: any) => d?.map((r: P) => (r.id === id ? { ...r, status } : r))); } catch (e) { toast((e as Error).message, "err"); }
  }
  return (
    <div>
      <AdminHeader title="Marketplace moderation" sub="Publish, archive or suspend items. The platform keeps 5% of every sale." />
      {!data ? <ListSkeleton /> : <Table head={["Item", "Seller", "Price", "Status"]}>{data.map((r) => <tr key={r.id}><Td><p className="font-semibold">{r.title}</p><p className="text-xs text-subtle">{r.type}</p></Td><Td>@{r.seller.username ?? r.seller.email}</Td><Td>{r.priceCoins} SC</Td>
        <Td><select value={r.status} onChange={(e) => set(r.id, e.target.value)} className="sw-input !w-auto !py-1.5 text-xs">{["DRAFT", "PUBLISHED", "ARCHIVED", "SUSPENDED"].map((s) => <option key={s}>{s}</option>)}</select></Td></tr>)}</Table>}
    </div>
  );
}
