import { requireAdmin } from "@/lib/admin/guards";
import { db } from "@/lib/db";

export default async function AdminNewsPage() {
  await requireAdmin();
  const articles = await db.newsArticle.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">News Manager</h1>
      <div className="mt-5 space-y-3">
        {articles.map(a => <div key={a.id} className="rounded-2xl border p-4"><b>{a.title}</b><div className="text-sm text-muted-foreground">{a.category} · {a.status}</div></div>)}
        {!articles.length && <div className="rounded-2xl border border-dashed p-6 text-muted-foreground">No articles yet.</div>}
      </div>
    </main>
  );
}
