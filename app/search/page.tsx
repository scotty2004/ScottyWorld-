 "use client";

import { useState } from "react";
import Link from "next/link";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (q.trim().length < 2) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Smart Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search across ScottyWorld content.</p>
        <div className="mt-5 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search tutorials, bots, marketplace, community..." className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 outline-none" />
          <button onClick={search} className="rounded-xl bg-primary px-5 py-3 text-primary-foreground">{loading ? "Searching..." : "Search"}</button>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {results.map((r) => (
          <Link key={`${r.kind}-${r.id}`} href={r.href} className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.kind}</div>
            <div className="mt-1 font-medium">{r.title}</div>
            {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
          </Link>
        ))}
        {!loading && q.length >= 2 && results.length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">No results found.</div>
        )}
      </div>
    </main>
  );
}
