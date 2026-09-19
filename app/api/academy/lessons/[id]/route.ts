import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { db } from "../../../../../lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;

  const lesson = await db.lesson.findFirst({
    where: { id, status: "PUBLISHED" },
    include: { quiz: { select: { id: true, title: true } } },
  });

  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  return NextResponse.json({ lesson });
}
