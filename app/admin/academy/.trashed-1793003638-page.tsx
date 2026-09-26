"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge, Empty, ErrorNote, ListSkeleton, Spinner } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type C = { id: string; title: string; slug: string; level: string; status: string };
const IDEAS = ["Python for absolute beginners", "JavaScript basics", "Build a REST API with Node.js", "Git & GitHub essentials", "Intro to AI and prompts", "Build a WhatsApp bot", "SQL basics", "Linux command line", "Cybersecurity fundamentals", "HTML & CSS in a day"];

export default function AdminAcademy() {
  const { data, loading, reload } = useApi<C[]>("/api/admin/academy");
  const [topic, setTopic] = useState(""); const [level, setLevel] = useState("BEGINNER"); const [lessons, setLessons] = useState(5);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  async function generate(t = topic) {
    setBusy(true); setErr("");
    try { const r = await api<{ course: { title: string } }>("/api/admin/academy/generate", { method: "POST", json: { topic: t, level, lessons, publish: true } }); toast(`Published: ${r.course.title}`); setTopic(""); await reload(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-extrabold">Academy</h1><p className="text-sm text-subtle">Let Scotty AI write simple, step-by-step courses with quizzes.</p></div>
      <div className="sw-card space-y-3 p-4">
        <p className="flex items-center gap-2 font-bold"><Sparkles size={18} className="text-brand-600" /> Generate a course</p>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic, e.g. Build a WhatsApp bot" className="sw-input" />
        <div className="grid grid-cols-2 gap-3"><select value={level} onChange={(e) => setLevel(e.target.value)} className="sw-input"><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select>
          <select value={lessons} onChange={(e) => setLessons(Number(e.target.value))} className="sw-input">{[3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} lessons</option>)}</select></div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">{IDEAS.map((i) => <button key={i} onClick={() => setTopic(i)} className="sw-chip shrink-0 hover:bg-soft">{i}</button>)}</div>
        {err && <ErrorNote message={err} />}
        <button onClick={() => generate()} disabled={busy || topic.trim().length < 3} className="sw-btn w-full py-3">{busy ? <><Spinner size={16} /> Writing course… (up to a minute)</> : "Generate & publish"}</button>
      </div>
      {loading ? <ListSkeleton /> : !data?.length ? <Empty title="No courses yet" /> : (
        <div className="grid gap-3 sm:grid-cols-2">{data.map((c) => <div key={c.id} className="sw-card p-4"><p className="font-bold">{c.title}</p><div className="mt-2 flex gap-2"><Badge tone="slate">{c.level.toLowerCase()}</Badge><Badge tone={c.status === "PUBLISHED" ? "green" : "amber"}>{c.status.toLowerCase()}</Badge></div></div>)}</div>
      )}
    </div>
  );
}
