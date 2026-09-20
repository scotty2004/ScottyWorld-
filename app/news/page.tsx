"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Newspaper } from "lucide-react";
import { Chips, Empty, ErrorNote, ListSkeleton, Page } from "@/components/ui";
import { timeAgo, useApi } from "@/lib/client";
import { NewsThumb } from "@/components/news-thumb";

type A = { id: string; slug: string; title: string; excerpt: string | null; category: string; sourceName: string | null; imageUrl: string | null; publishedAt: string | null; createdAt: string };

export default function NewsPage() {
  const { data, loading, error, reload } = useApi<{ articles: A[] }>("/api/news?limit=50");
  const [cat, setCat] = useState("all");
  const all = data?.articles ?? [];
  const cats = useMemo(() => [...new Set(all.map((a) => a.category))], [all]);
  const list = cat === "all" ? all : all.filter((a) => a.category === cat);
  const [hero, ...rest] = list;

  return (
    <Page>
      <h1 className="mb-1 text-2xl font-extrabold">Tech News</h1>
      <p className="mb-3 text-sm text-subtle">Curated by the ScottyWorld team — tech, AI and developer updates.</p>
      {error && <ErrorNote message={error} onRetry={reload} />}
      {loading ? <ListSkeleton /> : all.length === 0 ? <Empty icon={<Newspaper size={28} />} title="No news yet" text="Fresh tech and AI stories will be published here by the admin." /> : (
        <>
          <Chips items={[{ id: "all", label: "All" }, ...cats.map((c) => ({ id: c, label: c }))]} value={cat} onChange={setCat} />
          {hero && (
            <Link href={`/news/${hero.slug}`} className="sw-card mt-3 block overflow-hidden">
              <div className="relative"><NewsThumb url={hero.imageUrl} title={hero.title} className="h-48 w-full" />
                <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold text-white">{hero.category}</span></div>
              <div className="p-4"><h2 className="text-xl font-extrabold leading-snug">{hero.title}</h2>{hero.excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-subtle">{hero.excerpt}</p>}<p className="mt-3 text-xs text-subtle">{hero.sourceName ? `${hero.sourceName} · ` : ""}{timeAgo(hero.publishedAt ?? hero.createdAt)} ago</p></div>
            </Link>
          )}
          <div className="mt-3 space-y-3">
            {rest.map((a) => (
              <Link key={a.id} href={`/news/${a.slug}`} className="sw-card flex gap-3 p-3">
                <NewsThumb url={a.imageUrl} title={a.title} className="h-24 w-24 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1"><span className="text-[11px] font-bold uppercase tracking-wide text-brand-600">{a.category}</span><h3 className="mt-0.5 line-clamp-2 font-bold leading-snug">{a.title}</h3><p className="mt-1.5 text-xs text-subtle">{timeAgo(a.publishedAt ?? a.createdAt)} ago</p></div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
