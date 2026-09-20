"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { ErrorNote, ListSkeleton, Page, SubHeader } from "@/components/ui";
import { MarkdownLite } from "@/components/markdown-lite";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type Data = { lesson: { id: string; title: string; content: string; durationMin: number; xpReward: number; quiz: { id: string; title: string } | null }; course: { slug: string; title: string } | null; position: number; total: number; prevId: string | null; nextId: string | null; completed: boolean };

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, loading, error, reload } = useApi<Data>(`/api/academy/lessons/${id}`);
  const [busy, setBusy] = useState(false);

  async function complete(goNext: boolean) {
    setBusy(true);
    try {
      if (!data?.completed) { await api(`/api/academy/lessons/${id}/complete`, { method: "POST" }); toast(`+${data?.lesson.xpReward} XP`); }
      if (goNext && data?.nextId) router.push(`/academy/lesson/${data.nextId}`);
      else if (goNext && data?.course) router.push(`/academy/${data.course.slug}`);
      else await reload();
    } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  }

  return (
    <Page>
      <SubHeader title={data ? `Lesson ${data.position}/${data.total}` : "Lesson"} backHref={data?.course ? `/academy/${data.course.slug}` : "/academy"} />
      {loading ? <ListSkeleton rows={3} /> : error || !data ? <ErrorNote message={error || "Lesson unavailable."} /> : (
        <article>
          <p className="text-xs font-semibold text-subtle">{data.course?.title} · {data.lesson.durationMin} min · {data.lesson.xpReward} XP</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight">{data.lesson.title}</h1>
          <div className="sw-card mt-4 p-4"><MarkdownLite text={data.lesson.content} /></div>

          {data.lesson.quiz && <Link href={`/academy/quiz/${data.lesson.quiz.id}`} className="sw-btn-ghost mt-4 w-full py-3"><ListChecks size={18} /> Take the quiz</Link>}

          <div className="mt-4 grid grid-cols-[auto_1fr] gap-3">
            {data.prevId ? <Link href={`/academy/lesson/${data.prevId}`} className="sw-btn-ghost px-4"><ChevronLeft size={18} /></Link> : <span />}
            <button onClick={() => complete(true)} disabled={busy} className="sw-btn py-3.5">
              {data.completed ? <><CheckCircle2 size={18} /> {data.nextId ? "Next lesson" : "Back to course"}</> : data.nextId ? <>Complete & continue <ChevronRight size={18} /></> : <><CheckCircle2 size={18} /> Complete course</>}
            </button>
          </div>
        </article>
      )}
    </Page>
  );
}
