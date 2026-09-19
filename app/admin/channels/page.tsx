import { requireAdmin } from "@/lib/admin/guards";
import { db } from "@/lib/db";

export default async function AdminChannelsPage() {
  await requireAdmin();
  const channels = await db.channel.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Channel Manager</h1>
      <div className="mt-5 space-y-3">
        {channels.map(c => <div key={c.id} className="rounded-2xl border p-4"><b>{c.name}</b><div className="text-sm text-muted-foreground">{c.platform} · {c.active ? "Active" : "Disabled"}</div></div>)}
        {!channels.length && <div className="rounded-2xl border border-dashed p-6 text-muted-foreground">No channels configured.</div>}
      </div>
    </main>
  );
}
