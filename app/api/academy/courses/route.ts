import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { db } from "../../../../lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { lessons: true } },
      progress: { where: { userId: user.id }, take: 1 },
    },
  });

  return NextResponse.json({ courses });
}
