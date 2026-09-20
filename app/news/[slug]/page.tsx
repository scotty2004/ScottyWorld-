"use client";

import { use } from "react";
import { ExternalLink } from "lucide-react";
import { ErrorNote, ListSkeleton, Page, SubHeader } from "@/components/ui";
import { MarkdownLite } from "@/components/markdown-lite";
import { NewsThumb } from "@/components/news-thumb";
import { useApi } from "@/lib/client";

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data, loading, error } = useApi<{ article: { title: string; content: string; category: string; sourceName: string | null; sourceUrl: string | null; imageUrl: string | null; publishedAt: string | null } }>(`/api/news/${slug}`);
  const a = data?.article;
  return (
    <Page>
      <SubHeader title="Tech News" backHref="/news" />
      {loading ? <ListSkeleton rows={2} /> : error || !a ? <ErrorNote message={error || "Article not found."} /> : (
        <article>
          <NewsThumb url={a.imageUrl} title={a.title} className="h-52 w-full rounded-2xl" />
          <span className="mt-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">{a.category}</span>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight">{a.title}</h1>
          <p className="mt-1 text-xs text-subtle">{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString(undefined, { dateStyle: "long" }) : ""}{a.sourceName ? ` · ${a.sourceName}` : ""}</p>
          <div className="mt-5"><MarkdownLite text={a.content} /></div>
          {a.sourceUrl && <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="sw-btn-ghost mt-6 w-full"><ExternalLink size={16} /> Read the original source</a>}
        </article>
      )}
    </Page>
  );
}
