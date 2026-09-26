"use client";

import { useState } from "react";
import { Badge, Field, ListSkeleton } from "@/components/ui";
import { AdminHeader, Table, Td } from "@/components/admin/table";
import { api, timeAgo, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type T = { id: string; amount: number; type: string; reason: string; createdAt: string; user: { username: string | null; email: string } };

export default function AdminCoins() {
  const { data, reload } = useApi<T[]>("/api/admin/coins");
  const [f, setF] = useState({ username: "", amount: "", reason: "" }); const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try { await api("/api/admin/coins", { method: "POST", json: { username: f.username.replace(/^@/, ""), amount: parseInt(f.amount, 10), reason: f.reason } }); toast("Adjustment recorded"); setF({ username: "", amount: "", reason: "" }); await reload(); }
    catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  }
  return (
    <div>
      <AdminHeader title="Scotty Coins" sub="Audited balance adjustments. Use + to give coins and − to take them." />
      <div className="sw-card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_120px_2fr_auto] sm:items-end">
        <Field label="Username"><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="@scotty" className="sw-input" /></Field>
        <Field label="Amount"><input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="+50 / -20" className="sw-input" /></Field>
        <Field label="Reason"><input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} maxLength={240} className="sw-input" /></Field>
        <button onClick={submit} disabled={busy || !f.username || !f.amount || !f.reason} className="sw-btn">Apply</button>
      </div>
      {!data ? <ListSkeleton /> : <Table head={["User", "Amount", "Type", "Reason", "When"]}>{data.map((r) => <tr key={r.id}><Td>@{r.user.username ?? r.user.email}</Td><Td className={`font-bold ${r.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>{r.amount > 0 ? "+" : ""}{r.amount}</Td><Td><Badge tone="slate">{r.type.toLowerCase()}</Badge></Td><Td>{r.reason}</Td><Td>{timeAgo(r.createdAt)}</Td></tr>)}</Table>}
    </div>
  );
}
