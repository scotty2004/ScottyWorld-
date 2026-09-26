"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, GraduationCap, MessageSquare, Newspaper, Search, SlidersHorizontal, Store, TrendingUp, UserRound, X, type LucideIcon } from "lucide-react";
import { ListSkeleton, Page } from "@/components/ui";
import { api, useApi } from "@/lib/client";

type R = { kind: string; id: string; title: string; href: string; description?: string };
const META: Record<string, [LucideIcon, string]> = { marketplace: [Store, "Marketplace"], academy: [GraduationCap, "Academy"], community: [MessageSquare, "Community"], news: [Newspaper, "News"], bot: [Bot, "My bots"], people: [UserRound, "People"] };

export default function SearchPage() {
  const sg = useApi<{ recent: string[]; trending: string[] }>("/api/search/suggest");
  const [q, setQ] = useState(""); const [res, setRes] = useState<R[] | null>(null); const [busy, setBusy] = useState(false); const [kind, setKind] = useState("all");

  async function run(term: string, record = false) {
    if (term.trim().length < 2) { setRes(null); return; }
    setBusy(true);
    try { const r = await api<{ results: R[] }>(`/api/search?q=${encodeURIComponent(term)}${record ? "&record=1" : ""}`); setRes(r.results); } catch { setRes([]); } finally { setBusy(false); }
  }
  useEffect(() => { const t = setTimeout(() => void run(q), 300); return () => clearTimeout(t); }, [q]);

  const kinds = ["all", ...new Set((res ?? []).map((r) => r.kind))];
  const shown = (res ?? []).filter((r) => kind === "all" || r.kind === kind);

  return (
    <Page>
      <h1 className="mb-3 text-2xl font-extrabold">Search</h1>
      <form onSubmit={(e) => { e.preventDefault(); void run(q, true); }} className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ScottyWorld…" className="sw-input !pl-11 !pr-11" />
        {q ? <button type="button" onClick={() => { setQ(""); setRes(null); }} aria-label="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle"><X size={18} /></button> : <SlidersHorizontal size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-subtle" />}
      </form>

      {res === null ? (
        <>
          {(sg.data?.recent.length ?? 0) > 0 && (
            <section className="mt-6"><div className="mb-2 flex items-center justify-between"><h2 className="text-[15px] font-bold">Recent searches</h2><button onClick={async () => { await api("/api/search/suggest", { method: "DELETE" }); await sg.reload(); }} className="text-sm font-semibold text-brand-600">Clear</button></div>
              <div className="flex flex-wrap gap-2">{sg.data!.recent.map((r) => <button key={r} onClick={() => { setQ(r); }} className="sw-chip hover:bg-soft">{r}</button>)}</div></section>
          )}
          {(sg.data?.trending.length ?? 0) > 0 && (
            <section className="mt-6"><h2 className="mb-2 text-[15px] font-bold">Trending</h2>
              <div className="sw-card divide-y divide-border overflow-hidden">{sg.data!.trending.map((t) => <button key={t} onClick={() => setQ(t)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-soft"><TrendingUp size={18} className="text-brand-600" /><span className="font-medium">{t}</span></button>)}</div></section>
          )}
          {!sg.loading && !sg.data?.recent.length && !sg.data?.trending.length && <p className="mt-10 text-center text-sm text-subtle">Search for people, posts, courses, news and marketplace items.</p>}
        </>
      ) : (
        <div className="mt-4">
          {kinds.length > 2 && <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">{kinds.map((k) => <button key={k} onClick={() => setKind(k)} className={`sw-chip ${kind === k ? "sw-chip-active" : ""}`}>{k === "all" ? "All" : META[k]?.[1] ?? k}</button>)}</div>}
          {busy && res.length === 0 ? <ListSkeleton rows={3} /> : shown.length === 0 ? <p className="py-12 text-center text-sm text-subtle">No results for “{q}”.</p> : (
            <div className="sw-card divide-y divide-border overflow-hidden">
              {shown.map((r) => { const [I, l] = META[r.kind] ?? [Search, r.kind]; return (
                <Link key={`${r.kind}-${r.id}`} href={r.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-soft"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15"><I size={19} /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.title}</p><p className="truncate text-[13px] text-subtle">{l}{r.description ? ` · ${r.description}` : ""}</p></div></Link>); })}
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
