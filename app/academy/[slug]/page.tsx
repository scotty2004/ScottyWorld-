"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3 } from "lucide-react";

type Course = {
  title: string; description: string; category: string; level: string;
  lessons: { id: string; title: string; slug: string; position: number; durationMin: number; xpReward: number }[];
  progress: { percent: number; completedLessons: number }[];
};

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/academy/courses/${slug}`).then(async r => {
      const d = await r.json();
      if (!r.ok) setError(d.error || "Course unavailable.");
      else setCourse(d.course);
    });
  }, [slug]);

  if (error) return <div className="mx-auto max-w-4xl px-4 py-10"><div className="rounded-2xl border border-border bg-card p-7 text-sm">{error}</div></div>;
  if (!course) return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-muted">Loading course...</div>;

  const percent = course.progress[0]?.percent ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <p className="text-sm text-brand-500">{course.category}</p>
      <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>
      <p className="mt-3 text-muted">{course.description}</p>
      <div className="mt-6 h-2 rounded-full bg-card"><div className="h-full rounded-full bg-brand-500" style={{width: `${percent}%`}} /></div>
      <p className="mt-2 text-xs text-muted">{percent}% complete</p>

      <div className="mt-8 space-y-3">
        {course.lessons.map(lesson => (
          <Link key={lesson.id} href={`/academy/lesson/${lesson.id}`} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-brand-500">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-500"><BookOpen size={18}/></div>
            <div className="min-w-0 flex-1"><p className="font-medium">{lesson.position}. {lesson.title}</p><p className="mt-1 text-xs text-muted"><span className="inline-flex items-center gap-1"><Clock3 size={12}/>{lesson.durationMin} min</span> <span className="ml-3">{lesson.xpReward} XP</span></p></div>
            <ArrowRight size={18} className="text-muted"/>
          </Link>
        ))}
      </div>
    </div>
  );
}
