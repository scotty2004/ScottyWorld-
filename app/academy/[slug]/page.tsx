"use client";

import Link from "next/link";
import { use } from "react";
import { CheckCircle2, Circle, Clock, PlayCircle } from "lucide-react";
import { Badge, ErrorNote, ListSkeleton, Page, SubHeader } from "@/components/ui";
import { useApi } from "@/lib/client";

type Data = { course: { title: string; description: string; category: string; level: string; xpReward: number; lessons: Array<{ id: string; title: string; position: number; durationMin: number; xpReward: number }>; progress: Array<{ percent: number }> }; completedLessonIds: string[] };

export default function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data, loading, error } = useApi<Data>(`/api/academy/courses/${slug}`);
  const c = data?.course;
  const done = new Set(data?.completedLessonIds ?? []);
  const next = c?.lessons.find((l) => !done.has(l.id)) ?? c?.lessons[0];

  return (
    <Page>
      <SubHeader title={c?.title ?? "Course"} backHref="/academy" />
      {loading ? <ListSkeleton /> : error || !c ? <ErrorNote message={error || "Course not found."} /> : (
        <>
          <div className="sw-card p-4">
            <div className="flex flex-wrap items-center gap-2"><Badge>{c.category}</Badge><Badge tone="slate">{c.level.charAt(0) + c.level.slice(1).toLowerCase()}</Badge></div>
            <p className="mt-3 text-[15px]">{c.description}</p>
            <div className="mt-4 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-brand-600" style={{ width: `${c.progress[0]?.percent ?? 0}%` }} /></div><span className="text-sm font-bold">{c.progress[0]?.percent ?? 0}%</span></div>
            {next && <Link href={`/academy/lesson/${next.id}`} className="sw-btn mt-4 w-full py-3"><PlayCircle size={19} /> {done.size ? "Continue" : "Start course"}</Link>}
          </div>
          <h2 className="mb-2 mt-6 text-[15px] font-bold">{c.lessons.length} lessons</h2>
          <div className="sw-card divide-y divide-border overflow-hidden">
            {c.lessons.map((l) => (
              <Link key={l.id} href={`/academy/lesson/${l.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-soft">
                {done.has(l.id) ? <CheckCircle2 size={22} className="shrink-0 text-emerald-500" /> : <Circle size={22} className="shrink-0 text-border" />}
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{l.position}. {l.title}</p><p className="flex items-center gap-1 text-xs text-subtle"><Clock size={12} /> {l.durationMin} min · {l.xpReward} XP</p></div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
