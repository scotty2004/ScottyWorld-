"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Badge, ListSkeleton } from "@/components/ui";
import { AdminHeader, Table, Td } from "@/components/admin/table";
import { api } from "@/lib/client";

type U = { id: string; username: string | null; email: string; role: string; createdAt: string };

export default function AdminUsers() {
  const [q, setQ] = useState(""); const [rows, setRows] = useState<U[] | null>(null);
  useEffect(() => { const t = setTimeout(() => api<U[]>("/api/admin/users?q=" + encodeURIComponent(q)).then(setRows).catch(() => setRows([])), 250); return () => clearTimeout(t); }, [q]);
  return (
    <div>
      <AdminHeader title="Users" sub="Search accounts and roles." />
      <div className="relative mb-4 max-w-md"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username or email" className="sw-input !pl-11" /></div>
      {rows === null ? <ListSkeleton /> : <Table head={["Username", "Email", "Role", "Joined"]}>{rows.map((r) => <tr key={r.id}><Td className="font-semibold">@{r.username ?? "—"}</Td><Td>{r.email}</Td><Td><Badge tone={r.role === "USER" ? "slate" : "purple"}>{r.role.toLowerCase().replace("_", " ")}</Badge></Td><Td>{new Date(r.createdAt).toLocaleDateString()}</Td></tr>)}</Table>}
    </div>
  );
}
