import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { lessonCompleteSchema } from "@/lib/academy/validation";

/** Tracks every completed lesson individually, so progress really reaches 100%. */
export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const parsed = lessonCompleteSchema.safeParse({ lessonId: id });
  if (!parsed.success) return NextResponse.json({ error: "Invalid lesson." }, { status: 400 });

  const lesson = await db.lesson.findFirst({
    where: { id, status: "PUBLISHED" },
    include: { course: { include: { lessons: { where: { status: "PUBLISHED" }, select: { id: true, xpReward: true } } } } },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  await db.lessonCompletion.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: id } },
    update: {}, create: { userId: user.id, lessonId: id, courseId: lesson.courseId },
  });

  const publishedIds = lesson.course.lessons.map((l) => l.id);
  const done = await db.lessonCompletion.findMany({ where: { userId: user.id, courseId: lesson.courseId, lessonId: { in: publishedIds } }, select: { lessonId: true } });
  const doneSet = new Set(done.map((d) => d.lessonId));
  const total = Math.max(publishedIds.length, 1);
  const percent = Math.min(100, Math.round((doneSet.size / total) * 100));
  const xp = lesson.course.lessons.filter((l) => doneSet.has(l.id)).reduce((n, l) => n + l.xpReward, 0);

  const progress = await db.courseProgress.upsert({
    where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
    create: { userId: user.id, courseId: lesson.courseId, completedLessons: doneSet.size, percent, xpEarned: xp, completedAt: percent >= 100 ? new Date() : null },
    update: { completedLessons: doneSet.size, percent, xpEarned: xp, completedAt: percent >= 100 ? new Date() : null },
  });
  return NextResponse.json({ progress, completedLessonIds: [...doneSet] });
}
