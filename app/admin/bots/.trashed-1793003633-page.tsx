"use client";

import { Badge, ListSkeleton } from "@/components/ui";
import { AdminHeader, Table, Td } from "@/components/admin/table";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type B = { id: string; name: string; status: string; source: string; hostedUntil: string | null; owner: { username: string | null; email: string } };
const STATUSES = ["DRAFT", "TESTING", "DEPLOYING", "RUNNING", "STOPPED", "ERROR", "PAUSED"];

export default function AdminBots() {
  const { data, reload } = useApi<B[]>("/api/admin/bots");
  async function patch(id: string, body: object) { try { await api("/api/admin/bots", { method: "PATCH", json: { id, ...body } }); await reload(); } catch (e) { toast((e as Error).message, "err"); } }
  return (
    <div>
      <AdminHeader title="Bots" sub="You run the bots — set their real status here and grant hosting days. Users renew with coins." />
      {!data ? <ListSkeleton /> : <Table head={["Bot", "Owner", "Hosting", "Status", "Grant"]}>
        {data.map((b) => { const left = b.hostedUntil ? Math.ceil((new Date(b.hostedUntil).getTime() - Date.now()) / 86_400_000) : 0; return (
          <tr key={b.id}><Td><p className="font-semibold">{b.name}</p><p className="text-xs text-subtle">{b.source}</p></Td><Td>@{b.owner.username ?? b.owner.email}</Td>
            <Td>{left > 0 ? <Badge tone={left <= 2 ? "amber" : "green"}>{left}d left</Badge> : <Badge tone="red">expired</Badge>}</Td>
            <Td><select value={b.status} onChange={(e) => patch(b.id, { status: e.target.value })} className="sw-input !w-auto !py-1.5 text-xs">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Td>
            <Td><button onClick={() => patch(b.id, { addDays: 7 })} className="sw-btn-ghost !px-3 !py-1.5 text-xs">+7 days</button></Td></tr>); })}
      </Table>}
    </div>
  );
}
