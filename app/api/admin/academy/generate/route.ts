import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";
import { generateCourse, slugify } from "@/lib/academy/generator";

export const maxDuration = 120;

const schema = z.object({ topic: z.string().trim().min(3).max(120), level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"), lessons: z.number().int().min(3).max(10).default(5), publish: z.boolean().default(true) });

/** Admin: generate a full course (lessons + quizzes) with Scotty AI. */
export async function POST(req: Request) {
  let admin; try { admin = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Give a topic (3+ characters)." }, { status: 400 });
  const { topic, level, lessons, publish } = parsed.data;

  let course;
  try { course = await generateCourse(topic, level, lessons); }
  catch (e) {
    const m = (e as Error).message;
    return NextResponse.json({ error: m === "AI_NOT_CONFIGURED" ? "Scotty AI isn't configured (add OPENROUTER_API_KEY)." : "Scotty AI returned an unusable course. Try again." }, { status: m === "AI_NOT_CONFIGURED" ? 503 : 502 });
  }

  let slug = slugify(course.title);
  if (await db.course.findUnique({ where: { slug }, select: { id: true } })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const created = await db.course.create({
    data: {
      slug, title: course.title, description: course.description || `Learn ${topic}`, category: course.category, level, status: publish ? "PUBLISHED" : "DRAFT", xpReward: course.lessons.length * 20,
      lessons: {
        create: course.lessons.map((l, i) => ({
          title: l.title, slug: `${slugify(l.title)}-${i + 1}`, position: i + 1, content: l.content, durationMin: l.durationMin, xpReward: 20, status: "PUBLISHED" as const,
          ...(l.quiz.length ? { quiz: { create: { title: `${l.title} quiz`, passingScore: 66, questions: { create: l.quiz.map((q, qi) => ({ question: q.question, options: q.options, answer: q.answer, position: qi + 1 })) } } } } : {}),
        })),
      },
    },
    select: { id: true, slug: true, title: true },
  });
  await writeAdminAudit({ userId: admin.id, action: "COURSE_GENERATED", entity: "Course", entityId: created.id, metadata: { topic, level } });
  return NextResponse.json({ course: created }, { status: 201 });
}
