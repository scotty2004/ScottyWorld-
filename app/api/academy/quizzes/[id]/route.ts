import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { db } from "../../../../../../lib/db";
import { quizSubmitSchema } from "../../../../../../lib/academy/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const parsed = quizSubmitSchema.safeParse({ quizId: id, answers: body.answers });
  if (!parsed.success) return NextResponse.json({ error: "Invalid quiz submission." }, { status: 400 });

  const quiz = await db.quiz.findUnique({ where: { id }, include: { questions: true } });
  if (!quiz) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  let correct = 0;
  for (const question of quiz.questions) {
    const answer = parsed.data.answers[question.id];
    if (answer === question.answer) correct++;
  }

  const score = quiz.questions.length ? Math.round((correct / quiz.questions.length) * 100) : 0;
  const passed = score >= quiz.passingScore;

  const attempt = await db.quizAttempt.create({
    data: { userId: user.id, quizId: id, score, passed, answers: parsed.data.answers as any },
  });

  return NextResponse.json({ attempt, score, passed });
}
