"use client";

import { useState } from "react";
import { BrainCircuit, Bug, FileText, Gauge, Sparkles } from "lucide-react";

export default function DeveloperAIPage() {
  const [code, setCode] = useState("function greet(name) {\n  return 'Hello ' + name\n}");
  const [language, setLanguage] = useState("JavaScript");
  const [action, setAction] = useState("explain");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const response = await fetch("/api/developer/ai-explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, action }),
    });
    const data = await response.json();
    setAnswer(response.ok ? data.answer : data.error || "Unable to process code.");
    setLoading(false);
  }

  const actions = [
    ["explain", "Explain", BrainCircuit],
    ["debug", "Find errors", Bug],
    ["optimize", "Optimize", Gauge],
    ["document", "Write docs", FileText],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><Sparkles /></div>
        <div><h1 className="text-3xl font-bold">Scotty Developer AI</h1><p className="mt-1 text-sm text-muted">Use Scotty to explain, debug, optimize and document code.</p></div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {actions.map(([id, label, Icon]) => {
          const Component = Icon as typeof BrainCircuit;
          return <button key={String(id)} onClick={() => setAction(String(id))} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${action === id ? "border-brand-500 bg-brand-500/10 text-brand-500" : "border-border"}`}>
            <Component size={16} /> {String(label)}
          </button>;
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex gap-3">
            <select value={language} onChange={e => setLanguage(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <option>JavaScript</option><option>TypeScript</option><option>Python</option><option>HTML</option><option>CSS</option><option>SQL</option><option>Node.js</option>
            </select>
          </div>
          <textarea value={code} onChange={e => setCode(e.target.value)} className="mt-4 min-h-[400px] w-full rounded-2xl border border-border bg-background p-4 font-mono text-sm outline-none focus:border-brand-500" />
          <button disabled={loading} onClick={run} className="mt-4 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "Scotty is analyzing..." : "Run with Scotty"}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Scotty response</h2>
          <div className="mt-4 min-h-[465px] whitespace-pre-wrap rounded-2xl border border-border bg-background p-4 text-sm leading-6">
            {answer || "Your analysis will appear here."}
          </div>
        </div>
      </div>
    </div>
  );
}
