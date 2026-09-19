"use client";

import { useState } from "react";
import {
  Braces, Code2, Copy, FileCode2, KeyRound, Link2, RefreshCw,
  Regex, Search, ShieldCheck, Sparkles, WandSparkles
} from "lucide-react";

const tools = [
  ["json", "JSON Formatter", Braces],
  ["base64", "Base64 Encoder", KeyRound],
  ["base64-decode", "Base64 Decoder", KeyRound],
  ["url", "URL Encoder", Link2],
  ["url-decode", "URL Decoder", Link2],
  ["uuid", "UUID Generator", RefreshCw],
  ["regex", "Regex Tester", Regex],
  ["jwt", "JWT Inspector", ShieldCheck],
  ["html", "HTML Escape", Code2],
];

export default function DeveloperPage() {
  const [tool, setTool] = useState("json");
  const [input, setInput] = useState('{"scottyworld":"developer","phase":4}');
  const [pattern, setPattern] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/developer/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, input, pattern }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Tool failed.");
    else setOutput(data.output);
    setBusy(false);
  }

  async function copyOutput() {
    if (output) await navigator.clipboard.writeText(output);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><WandSparkles /></div>
            <div><h1 className="text-3xl font-bold">Developer Hub</h1><p className="mt-1 text-sm text-muted">Fast, safe utilities for everyday development work.</p></div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted">
          <ShieldCheck size={15} className="text-brand-500" /> Operations run server-side
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-3">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Tools</p>
          <div className="space-y-1">
            {tools.map(([id, name, Icon]) => {
              const Component = Icon as typeof Code2;
              return <button key={String(id)} onClick={() => { setTool(String(id)); setOutput(""); setError(""); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${tool === id ? "bg-brand-500/10 font-semibold text-brand-500" : "text-muted hover:bg-background hover:text-foreground"}`}>
                <Component size={17} /> {String(name)}
              </button>;
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3"><Code2 size={20} className="text-brand-500" /><h2 className="font-semibold">{tools.find(t => t[0] === tool)?.[1] as string}</h2></div>

          {tool === "regex" && (
            <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="Regular expression, e.g. \\b\\d+\\b" className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm outline-none focus:border-brand-500" />
          )}

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Input</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} className="mt-2 min-h-[330px] w-full resize-y rounded-2xl border border-border bg-background p-4 font-mono text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">Output</label>
                <button onClick={copyOutput} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"><Copy size={14} /> Copy</button>
              </div>
              <pre className="mt-2 min-h-[330px] overflow-auto rounded-2xl border border-border bg-background p-4 font-mono text-sm whitespace-pre-wrap">{output || "Run the tool to see the result."}</pre>
            </div>
          </div>

          {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

          <button disabled={busy} onClick={run} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            <Sparkles size={17} /> {busy ? "Running..." : "Run tool"}
          </button>
        </section>
      </div>
    </div>
  );
}
