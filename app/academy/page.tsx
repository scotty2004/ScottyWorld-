"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock3, GraduationCap, Trophy } from "lucide-react";

type Course = {
  id: string; slug: string; title: string; description: string; category: string; level: string; xpReward: number;
  _count: { lessons: number };
  progress: { percent: number; xpEarned: number }[];
};

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/academy/courses").then(r => r.json()).then(d => setCourses(d.courses || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><GraduationCap /></div>
        <div><h1 className="text-3xl font-bold">Scotty Academy</h1><p className="mt-1 text-sm text-muted">Learn technology through structured courses, lessons and quizzes.</p></div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5"><BookOpen className="text-brand-500" size={20}/><p className="mt-3 text-xs text-muted">Courses</p><p className="mt-1 text-xl font-bold">{courses.length}</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><CheckCircle2 className="text-brand-500" size={20}/><p className="mt-3 text-xs text-muted">Progress</p><p className="mt-1 text-xl font-bold">Tracked</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><Trophy className="text-brand-500" size={20}/><p className="mt-3 text-xs text-muted">Achievements</p><p className="mt-1 text-xl font-bold">Earn XP</p></div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Courses</h2>
        {loading ? <p className="mt-4 text-sm text-muted">Loading courses...</p> : courses.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted">No published courses yet. Content managers can publish courses from the Control Center.</div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {courses.map(course => {
              const progress = course.progress[0]?.percent ?? 0;
              return <Link key={course.id} href={`/academy/${course.slug}`} className="rounded-2xl border border-border bg-card p-6 hover:border-brand-500">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-brand-500">{course.category}</p><h3 className="mt-2 text-lg font-semibold">{course.title}</h3></div><span className="rounded-full border border-border px-2.5 py-1 text-xs">{course.level}</span></div>
                <p className="mt-3 text-sm text-muted">{course.description}</p>
                <div className="mt-5 flex items-center gap-4 text-xs text-muted"><span>{course._count.lessons} lessons</span><span className="inline-flex items-center gap-1"><Clock3 size={13}/> self-paced</span><span className="ml-auto">{course.xpReward} XP</span></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-background"><div className="h-full bg-brand-500" style={{width: `${progress}%`}} /></div>
                <p className="mt-2 text-xs text-muted">{progress}% complete</p>
              </Link>
            })}
          </div>
        )}
      </div>
    </div>
  );
}
