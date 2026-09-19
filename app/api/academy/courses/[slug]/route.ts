import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { db } from "../../../../../lib/db";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { slug } = await context.params;
  const course = await db.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      lessons: { where: { status: "PUBLISHED" }, orderBy: { position: "asc" }, select: { id: true, title: true, slug: true, position: true, durationMin: true, xpReward: true } },
      progress: { where: { userId: user.id }, take: 1 },
    },
  });

  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  return NextResponse.json({ course });
}
