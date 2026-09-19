import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { lessonCompleteSchema } from "@/lib/academy/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const parsed = lessonCompleteSchema.safeParse({ lessonId: id });
  if (!parsed.success) return NextResponse.json({ error: "Invalid lesson." }, { status: 400 });

  const lesson = await db.lesson.findFirst({
    where: { id, status: "PUBLISHED" },
    include: { course: { include: { lessons: { where: { status: "PUBLISHED" }, select: { id: true } } } } },
  });

  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const total = lesson.course.lessons.length;
  const current = await db.courseProgress.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
  });

  const existingCompleted = current?.completedLessons ?? 0;
  const percent = Math.min(100, Math.round((Math.max(existingCompleted, 1) / Math.max(total, 1)) * 100));
  const completedAt = percent >= 100 ? new Date() : undefined;

  const progress = await db.courseProgress.upsert({
    where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
    create: {
      userId: user.id,
      courseId: lesson.courseId,
      completedLessons: 1,
      percent,
      xpEarned: lesson.xpReward,
      completedAt,
    },
    update: {
      completedLessons: Math.max(existingCompleted, 1),
      percent,
      xpEarned: Math.max(current?.xpEarned ?? 0, lesson.xpReward),
      completedAt,
    },
  });

  return NextResponse.json({ progress });
}
