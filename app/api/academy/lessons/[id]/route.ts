import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;

  const lesson = await db.lesson.findFirst({
    where: { id, status: "PUBLISHED" },
    include: { quiz: { select: { id: true, title: true } } },
  });

  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  const siblings = await db.lesson.findMany({ where: { courseId: lesson.courseId, status: "PUBLISHED" }, orderBy: { position: "asc" }, select: { id: true } });
  const i = siblings.findIndex((x) => x.id === id);
  const course = await db.course.findUnique({ where: { id: lesson.courseId }, select: { slug: true, title: true } });
  const done = await db.lessonCompletion.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: id } }, select: { id: true } });
  return NextResponse.json({ lesson, course, position: i + 1, total: siblings.length, prevId: siblings[i - 1]?.id ?? null, nextId: siblings[i + 1]?.id ?? null, completed: Boolean(done) });
}
