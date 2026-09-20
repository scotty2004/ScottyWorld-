"use client";

import Link from "next/link";
import { Empty, ListSkeleton } from "@/components/ui";
import { AdminHeader, Table, Td } from "@/components/admin/table";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type R = { id: string; reason: string | null; status: string; createdAt: string; reporter: { username: string | null }; post: { id: string; title: string | null; type: string } | null };

export default function AdminCommunity() {
  const { data, setData } = useApi<R[]>("/api/admin/community");
  async function set(id: string, status: string) {
    try { await api("/api/admin/community", { method: "PATCH", json: { id, status } }); setData((d: any) => d?.map((r: R) => (r.id === id ? { ...r, status } : r))); } catch (e) { toast((e as Error).message, "err"); }
  }
  return (
    <div>
      <AdminHeader title="Community moderation" sub="Review reports. Open the post to delete it if needed." />
      {!data ? <ListSkeleton /> : data.length === 0 ? <Empty title="No reports" text="Nothing has been reported." /> : <Table head={["Reported post", "Reporter", "Reason", "Status"]}>{data.map((r) => <tr key={r.id}>
        <Td>{r.post ? <Link href={`/community/post/${r.post.id}`} className="font-semibold text-brand-600">{r.post.title || "Open post"}</Link> : "Deleted post"}</Td><Td>@{r.reporter.username ?? "—"}</Td><Td>{r.reason ?? "—"}</Td>
        <Td><select value={r.status} onChange={(e) => set(r.id, e.target.value)} className="sw-input !w-auto !py-1.5 text-xs">{["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"].map((s) => <option key={s}>{s}</option>)}</select></Td></tr>)}</Table>}
    </div>
  );
}
