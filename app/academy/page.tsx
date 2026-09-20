"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, BookOpen, Brain, Cloud, Code2, Database, GitBranch, Lock, PlayCircle, Shield, Bot, Globe, GraduationCap, type LucideIcon } from "lucide-react";
import { Badge, Chips, Empty, ErrorNote, ListSkeleton, Page, Section } from "@/components/ui";
import { useApi } from "@/lib/client";

type Course = { id: string; slug: string; title: string; description: string; category: string; level: string; xpReward: number; _count: { lessons: number }; progress: Array<{ percent: number; completedLessons: number; xpEarned: number; completedAt: string | null }> };

const CAT: Record<string, LucideIcon> = { Programming: Code2, "AI & Machine Learning": Brain, "Cloud Computing": Cloud, Cybersecurity: Shield, "Data Science": Database, DevOps: GitBranch, "Web Development": Globe, "Bots & Automation": Bot };
const LEVEL_TONE: Record<string, "green" | "amber" | "red"> = { BEGINNER: "green", INTERMEDIATE: "amber", ADVANCED: "red" };

export default function AcademyPage() {
  const { data, loading, error, reload } = useApi<{ courses: Course[] }>("/api/academy/courses");
  const [cat, setCat] = useState("all");
  const courses = data?.courses ?? [];

  const cats = useMemo(() => {
    const m = new Map<string, number>();
    courses.forEach((c) => m.set(c.category, (m.get(c.category) ?? 0) + 1));
    return [...m.entries()];
  }, [courses]);

  const xp = courses.reduce((n, c) => n + (c.progress[0]?.xpEarned ?? 0), 0);
  const level = Math.floor(xp / 100) + 1;
  const inLevel = xp % 100;
  const continueCourse = courses.filter((c) => c.progress[0] && c.progress[0].percent < 100).sort((a, b) => b.progress[0].percent - a.progress[0].percent)[0];
  const shown = cat === "all" ? courses : courses.filter((c) => c.category === cat);

  return (
    <Page>
      <h1 className="mb-3 text-2xl font-extrabold lg:hidden">Academy</h1>
      {error && <ErrorNote message={error} onRetry={reload} />}
      {loading ? <ListSkeleton rows={3} /> : courses.length === 0 ? (
        <Empty icon={<GraduationCap size={28} />} title="Courses are on their way" text="Scotty AI is preparing simple, step-by-step courses. Check back very soon." />
      ) : (
        <>
          <Section title="Your progress" className="!mt-0">
            <div className="sw-card p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white"><Award size={24} /></span>
                <div className="flex-1"><div className="flex items-center justify-between"><p className="font-bold">Level {level}</p><p className="text-xs text-subtle">{inLevel} / 100 XP</p></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${inLevel}%` }} /></div></div>
              </div>
            </div>
          </Section>

          {continueCourse && (
            <Section title="Continue learning">
              <Link href={`/academy/${continueCourse.slug}`} className="sw-card flex items-center gap-3 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">{(() => { const I = CAT[continueCourse.category] ?? BookOpen; return <I size={24} />; })()}</span>
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{continueCourse.title}</p><p className="text-[13px] text-subtle">Lesson {Math.min(continueCourse.progress[0].completedLessons + 1, continueCourse._count.lessons)} of {continueCourse._count.lessons}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-brand-600" style={{ width: `${continueCourse.progress[0].percent}%` }} /></div></div>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-white"><PlayCircle size={22} /></span>
              </Link>
            </Section>
          )}

          <Section title="Categories">
            <div className="grid grid-cols-3 gap-2.5">
              {cats.map(([name, n]) => { const I = CAT[name] ?? BookOpen; return (
                <button key={name} onClick={() => setCat(cat === name ? "all" : name)} className={`sw-card flex flex-col items-center gap-1.5 px-2 py-4 text-center transition ${cat === name ? "!border-brand-600 ring-2 ring-brand-600/20" : ""}`}>
                  <I size={26} className="text-brand-600" strokeWidth={1.7} /><span className="text-[12.5px] font-bold leading-tight">{name}</span><span className="text-[11px] text-subtle">{n} course{n > 1 ? "s" : ""}</span>
                </button>); })}
            </div>
          </Section>

          <Section title={cat === "all" ? "All courses" : cat}>
            <Chips items={[{ id: "all", label: "All" }, ...cats.map(([n]) => ({ id: n, label: n }))]} value={cat} onChange={setCat} />
            <div className="mt-3 space-y-3">
              {shown.map((c) => { const pr = c.progress[0]; const I = CAT[c.category] ?? BookOpen; return (
                <Link key={c.id} href={`/academy/${c.slug}`} className="sw-card flex gap-3 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15"><I size={24} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug">{c.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-subtle">{c.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2"><Badge tone={LEVEL_TONE[c.level] ?? "slate"}>{c.level.charAt(0) + c.level.slice(1).toLowerCase()}</Badge><span className="text-xs text-subtle">{c._count.lessons} lessons · {c.xpReward} XP</span>{pr?.completedAt && <Badge tone="green">Completed</Badge>}</div>
                    {pr && !pr.completedAt && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-brand-600" style={{ width: `${pr.percent}%` }} /></div>}
                  </div>
                </Link>); })}
            </div>
          </Section>
        </>
      )}
    </Page>
  );
}
