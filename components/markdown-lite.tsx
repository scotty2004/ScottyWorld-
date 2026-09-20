"use client";

import { Fragment, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/client";

function Code({ lang, code }: { lang: string; code: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="my-2 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 text-[11px] text-slate-400">
        <span className="font-semibold uppercase tracking-wide">{lang || "code"}</span>
        <button onClick={async () => { await copyText(code); setOk(true); setTimeout(() => setOk(false), 1500); }} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-white/10">{ok ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}</button>
      </div>
      <pre className="overflow-x-auto p-3 text-[12.5px] leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) return <code key={i} className="rounded bg-black/10 px-1 py-0.5 text-[0.9em] dark:bg-white/15">{p.slice(1, -1)}</code>;
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

/** Small, dependency-free renderer: fenced code, lists, bold, inline code, headings. */
export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.split(/(```[\s\S]*?(?:```|$))/g);
  return (
    <div className="space-y-1.5 break-words text-[15px] leading-relaxed">
      {blocks.map((b, i) => {
        if (b.startsWith("```")) {
          const m = /^```(\w*)\n?([\s\S]*?)(?:```)?$/.exec(b);
          return <Code key={i} lang={m?.[1] ?? ""} code={(m?.[2] ?? "").replace(/\n$/, "")} />;
        }
        return b.split(/\n{2,}/).map((para, j) => {
          const lines = para.split("\n").filter((l) => l.trim());
          if (!lines.length) return null;
          if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return <ul key={`${i}-${j}`} className="list-disc space-y-1 pl-5">{lines.map((l, k) => <li key={k}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>)}</ul>;
          if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) return <ol key={`${i}-${j}`} className="list-decimal space-y-1 pl-5">{lines.map((l, k) => <li key={k}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>)}</ol>;
          if (/^#{1,4}\s/.test(lines[0])) return <p key={`${i}-${j}`} className="pt-1 text-base font-bold">{inline(lines[0].replace(/^#{1,4}\s+/, ""))}</p>;
          return <p key={`${i}-${j}`} className="whitespace-pre-wrap">{inline(lines.join("\n"))}</p>;
        });
      })}
    </div>
  );
}
