"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Question = { id: string; question: string; options: string[]; position: number };
type Quiz = { id: string; title: string; passingScore: number; questions: Question[] };

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{score:number; passed:boolean} | null>(null);

  useEffect(() => {
    fetch(`/api/academy/quizzes/${id}`).then(r => r.json()).then(d => setQuiz(d.quiz));
  }, [id]);

  async function submit() {
    const response = await fetch(`/api/academy/quizzes/${id}/submit`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ answers }),
    });
    const data = await response.json();
    if (response.ok) setResult({ score: data.score, passed: data.passed });
  }

  if (!quiz) return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">Loading quiz...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-bold">{quiz.title}</h1>
      <p className="mt-2 text-sm text-muted">Passing score: {quiz.passingScore}%</p>

      <div className="mt-8 space-y-5">
        {quiz.questions.map(q => (
          <div key={q.id} className="rounded-2xl border border-border bg-card p-5">
            <p className="font-medium">{q.position}. {q.question}</p>
            <div className="mt-4 grid gap-2">
              {(q.options || []).map((option, index) => (
                <label key={index} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm hover:border-brand-500">
                  <input type="radio" name={q.id} checked={answers[q.id] === index} onChange={() => setAnswers(a => ({...a, [q.id]: index}))}/>
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={submit} className="mt-6 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white">Submit quiz</button>

      {result && <div className="mt-5 rounded-2xl border border-border bg-card p-6"><p className="font-semibold">Score: {result.score}%</p><p className="mt-2 text-sm text-muted">{result.passed ? "Passed." : "Not passed yet. Review the lesson and try again."}</p></div>}
    </div>
  );
}
