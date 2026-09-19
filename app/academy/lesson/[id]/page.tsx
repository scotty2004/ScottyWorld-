"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type Lesson = {
  id: string; title: string; content: string; durationMin: number; xpReward: number;
  quiz: { id: string; title: string } | null;
};

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/academy/lessons/${id}`).then(async r => {
      const d = await r.json();
      if (!r.ok) setError(d.error || "Lesson unavailable.");
      else setLesson(d.lesson);
    });
  }, [id]);

  async function complete() {
    const response = await fetch(`/api/academy/lessons/${id}/complete`, { method: "POST" });
    if (response.ok) setDone(true);
  }

  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><div className="rounded-2xl border border-border bg-card p-7">{error}</div></div>;
  if (!lesson) return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">Loading lesson...</div>;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <p className="text-sm text-muted">{lesson.durationMin} min lesson · {lesson.xpReward} XP</p>
      <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
      <div className="prose prose-invert mt-8 max-w-none whitespace-pre-wrap rounded-2xl border border-border bg-card p-6 text-sm leading-7">{lesson.content}</div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={complete} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white"><CheckCircle2 size={17}/> {done ? "Completed" : "Mark complete"}</button>
        {lesson.quiz && <button onClick={() => router.push(`/academy/quiz/${lesson.quiz!.id}`)} className="rounded-xl border border-border px-5 py-3 text-sm">Take quiz</button>}
      </div>
    </article>
  );
}
