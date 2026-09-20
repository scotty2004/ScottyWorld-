"use client";

import Link from "next/link";
import { use, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { ErrorNote, ListSkeleton, Page, SubHeader } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type Quiz = { quiz: { id: string; title: string; passingScore: number; lessonId: string; questions: Array<{ id: string; question: string; options: string[] }> } };

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error } = useApi<Quiz>(`/api/academy/quizzes/${id}`);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; review: Array<{ id: string; answer: number }> } | null>(null);
  const [busy, setBusy] = useState(false);
  const q = data?.quiz;
  const answered = q ? q.questions.every((x) => answers[x.id] !== undefined) : false;

  async function submit() {
    setBusy(true);
    try { setResult(await api(`/api/academy/quizzes/${id}`, { method: "POST", json: { answers } })); window.scrollTo({ top: 0, behavior: "smooth" }); }
    catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  }
  const correct = (qid: string) => result?.review.find((r) => r.id === qid)?.answer;

  return (
    <Page>
      <SubHeader title="Quiz" backHref={q ? `/academy/lesson/${q.lessonId}` : "/academy"} />
      {loading ? <ListSkeleton /> : error || !q ? <ErrorNote message={error || "Quiz not found."} /> : (
        <>
          {result && (
            <div className={`mb-4 rounded-2xl p-5 text-center ${result.passed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
              <p className="text-4xl font-extrabold">{result.score}%</p>
              <p className="mt-1 font-semibold">{result.passed ? "You passed! 🎉" : `Keep going — you need ${q.passingScore}% to pass.`}</p>
              <div className="mt-3 flex justify-center gap-2"><button onClick={() => { setResult(null); setAnswers({}); }} className="sw-btn-ghost">Try again</button><Link href={`/academy/lesson/${q.lessonId}`} className="sw-btn">Back to lesson</Link></div>
            </div>
          )}
          <div className="space-y-4">
            {q.questions.map((qq, i) => (
              <div key={qq.id} className="sw-card p-4">
                <p className="font-bold">{i + 1}. {qq.question}</p>
                <div className="mt-3 space-y-2">
                  {qq.options.map((o, oi) => {
                    const sel = answers[qq.id] === oi; const right = correct(qq.id) === oi;
                    const cls = result ? (right ? "border-emerald-500 bg-emerald-500/10" : sel ? "border-red-500 bg-red-500/10" : "border-border") : sel ? "border-brand-600 bg-brand-50 dark:bg-brand-500/15" : "border-border hover:bg-soft";
                    return (
                      <button key={oi} disabled={!!result} onClick={() => setAnswers({ ...answers, [qq.id]: oi })} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] ${cls}`}>
                        <span className="flex-1">{o}</span>{result && right && <CheckCircle2 size={18} className="text-emerald-600" />}{result && sel && !right && <XCircle size={18} className="text-red-500" />}
                      </button>);
                  })}
                </div>
              </div>
            ))}
          </div>
          {!result && <button onClick={submit} disabled={!answered || busy} className="sw-btn mt-5 w-full py-3.5">{busy ? "Checking…" : "Submit answers"}</button>}
        </>
      )}
    </Page>
  );
}
