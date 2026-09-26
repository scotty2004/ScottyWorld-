"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Boxes, Check, Copy, FolderGit2, Lock, Plus, Sparkles, Trash2, Users, Wrench, Braces, Binary, Link2, Hash, Fingerprint, Clock, Regex, ShieldCheck, FileCode2, Globe, type LucideIcon } from "lucide-react";
import { Badge, Empty, ErrorNote, Field, ListSkeleton, Page, Section, Sheet, Tabs } from "@/components/ui";
import { MarkdownLite } from "@/components/markdown-lite";
import { api, copyText, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type Project = { id: string; name: string; slug: string; description: string | null; visibility: string; updatedAt: string };
type BotRow = { id: string; name: string; status: string; provider: string | null; hosting: { state: string; daysLeft: number } };
type Tool = { id: string; name: string; description: string; category: string };

const TOOL_ICON: Record<string, LucideIcon> = { json: Braces, "json-min": Braces, base64: Binary, url: Link2, uuid: Fingerprint, regex: Regex, jwt: ShieldCheck, html: FileCode2, markdown: FileCode2, sha256: Hash, timestamp: Clock, slug: Globe };
const HOST_TONE: Record<string, "green" | "amber" | "red"> = { ACTIVE: "green", EXPIRING: "amber", EXPIRED: "red" };

function ToolSheet({ tool, onClose }: { tool: Tool | null; onClose: () => void }) {
  const [input, setInput] = useState("");
  const [pattern, setPattern] = useState("");
  const [decode, setDecode] = useState(false);
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!tool) return null;
  const canDecode = tool.id === "base64" || tool.id === "url";
  const id = decode && canDecode ? `${tool.id}-decode` : tool.id;

  async function run() {
    setBusy(true); setErr(""); setOut("");
    try { const r = await api<{ output: string }>("/api/developer/run", { method: "POST", json: { tool: id, input, pattern: tool!.id === "regex" ? pattern : undefined } }); setOut(r.output); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <Sheet open onClose={onClose} title={tool.name}>
      <p className="mb-3 text-sm text-subtle">{tool.description}</p>
      {canDecode && <div className="mb-3 flex gap-2">{["Encode", "Decode"].map((l, i) => <button key={l} onClick={() => setDecode(i === 1)} className={`sw-chip ${decode === (i === 1) ? "sw-chip-active" : ""}`}>{l}</button>)}</div>}
      {tool.id === "regex" && <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Pattern, e.g. \d+" className="sw-input mb-3 font-mono" />}
      {tool.id !== "uuid" && <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder="Paste your input here…" className="sw-input font-mono text-[13px]" />}
      <button onClick={run} disabled={busy} className="sw-btn mt-3 w-full">{busy ? "Running…" : tool.id === "uuid" ? "Generate UUID" : "Run"}</button>
      {err && <div className="mt-3"><ErrorNote message={err} /></div>}
      {out && (
        <div className="relative mt-3">
          <pre className="max-h-64 overflow-auto rounded-xl bg-slate-950 p-3 pr-12 font-mono text-[12.5px] text-slate-100">{out}</pre>
          <button onClick={async () => { await copyText(out); toast("Copied"); }} aria-label="Copy" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white"><Copy size={15} /></button>
        </div>
      )}
    </Sheet>
  );
}

function AiHelper() {
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("JavaScript");
  const [action, setAction] = useState("explain");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setAnswer("");
    try { const r = await api<{ answer: string }>("/api/developer/ai-explain", { method: "POST", json: { code, language: lang, action } }); setAnswer(r.answer); }
    catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  }
  return (
    <div className="sw-card p-4">
      <div className="mb-3 flex items-center gap-2"><Sparkles size={18} className="text-brand-600" /><h3 className="font-bold">Scotty AI code helper</h3></div>
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">{["explain", "debug", "optimize", "document"].map((a) => <button key={a} onClick={() => setAction(a)} className={`sw-chip capitalize ${action === a ? "sw-chip-active" : ""}`}>{a}</button>)}</div>
      <select value={lang} onChange={(e) => setLang(e.target.value)} className="sw-input mb-2">{["JavaScript", "TypeScript", "Python", "PHP", "Java", "C++", "Go", "SQL", "Bash"].map((l) => <option key={l}>{l}</option>)}</select>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={6} placeholder="Paste your code…" className="sw-input font-mono text-[13px]" />
      <button onClick={go} disabled={busy || code.trim().length < 3} className="sw-btn mt-3 w-full">{busy ? "Scotty is thinking…" : "Ask Scotty"}</button>
      {answer && <div className="mt-4 rounded-xl bg-soft p-3"><MarkdownLite text={answer} /></div>}
    </div>
  );
}

export default function DeveloperHubPage() {
  const [tab, setTab] = useState<"overview" | "projects" | "bots" | "tools">("overview");
  const projects = useApi<{ projects: Project[] }>("/api/projects");
  const bots = useApi<{ bots: BotRow[]; limit: number }>("/api/bots");
  const tools = useApi<{ tools: Tool[] }>("/api/developer/tools");
  const [tool, setTool] = useState<Tool | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [shared, setShared] = useState(false); const [busy, setBusy] = useState(false);

  const list = projects.data?.projects ?? [];
  const botList = bots.data?.bots ?? [];

  async function create() {
    setBusy(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    try { await api("/api/projects", { method: "POST", json: { name, slug: slug.length >= 2 ? slug : `project-${Date.now().toString(36)}`, description: desc || undefined, visibility: shared ? "SHARED" : "PRIVATE" } }); setNewOpen(false); setName(""); setDesc(""); await projects.reload(); toast("Project created"); }
    catch (e) { toast(/Unique|unique/.test((e as Error).message) ? "You already have a project with that name." : (e as Error).message, "err"); } finally { setBusy(false); }
  }
  async function del(id: string) { if (!confirm("Delete this project?")) return; try { await api(`/api/projects/${id}`, { method: "DELETE" }); await projects.reload(); } catch (e) { toast((e as Error).message, "err"); } }

  const ProjectRow = ({ p }: { p: Project }) => (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15"><FolderGit2 size={20} /></span>
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.name}</p><p className="truncate text-[13px] text-subtle">{p.description || `/${p.slug}`}</p></div>
      <Badge tone={p.visibility === "SHARED" ? "green" : "slate"}>{p.visibility === "SHARED" ? <><Users size={11} /> Shared</> : <><Lock size={11} /> Private</>}</Badge>
      <button onClick={() => del(p.id)} aria-label="Delete project" className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-red-500/10 hover:text-red-600"><Trash2 size={16} /></button>
    </div>
  );
  const BotRowView = ({ b }: { b: BotRow }) => (
    <Link href={`/bots/${b.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-soft">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15"><Bot size={20} /></span>
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{b.name}</p><p className="text-[13px] text-subtle">{b.hosting.state === "EXPIRED" ? "Hosting expired" : `${b.hosting.daysLeft} day${b.hosting.daysLeft === 1 ? "" : "s"} of hosting left`}</p></div>
      <Badge tone={HOST_TONE[b.hosting.state]}>{b.hosting.state === "ACTIVE" ? "Hosted" : b.hosting.state === "EXPIRING" ? "Expiring" : "Expired"}</Badge>
    </Link>
  );

  return (
    <Page>
      <h1 className="mb-1 text-2xl font-extrabold lg:hidden">Developer Hub</h1>
      <Tabs items={[{ id: "overview", label: "Overview" }, { id: "projects", label: "Projects" }, { id: "bots", label: "Bots" }, { id: "tools", label: "Tools" }]} value={tab} onChange={setTab} />

      {tab === "overview" && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[["Projects", list.length, Boxes], ["Bots", botList.length, Bot], ["Tools", tools.data?.tools.length ?? 0, Wrench]].map(([l, n, I]: any) => (
              <div key={l} className="sw-card py-3"><I size={18} className="mx-auto text-brand-600" /><p className="mt-1 text-xl font-extrabold">{n}</p><p className="text-xs text-subtle">{l}</p></div>
            ))}
          </div>
          <Section title="My projects">
            {projects.loading ? <ListSkeleton rows={2} /> : list.length === 0 ? <Empty icon={<FolderGit2 size={26} />} title="No projects yet" text="Create a project to keep your builds organised." /> : <div className="sw-card divide-y divide-border overflow-hidden">{list.slice(0, 3).map((p) => <ProjectRow key={p.id} p={p} />)}</div>}
          </Section>
          <Section title="My bots" href="/bots">
            {bots.loading ? <ListSkeleton rows={2} /> : botList.length === 0 ? <Empty icon={<Bot size={26} />} title="No bots yet" text="Host a bot free for 7 days, or let Scotty AI generate one for you." action={<Link href="/bots" className="sw-btn">Open Bots</Link>} /> : <div className="sw-card divide-y divide-border overflow-hidden">{botList.slice(0, 3).map((b) => <BotRowView key={b.id} b={b} />)}</div>}
          </Section>
          <Section title="Quick tools">
            <div className="grid grid-cols-4 gap-2.5">
              {(tools.data?.tools ?? []).slice(0, 4).map((t) => { const I = TOOL_ICON[t.id] ?? Wrench; return <button key={t.id} onClick={() => setTool(t)} className="sw-card flex flex-col items-center gap-1.5 px-1 py-3"><I size={20} className="text-brand-600" /><span className="text-center text-[11px] font-semibold leading-tight">{t.name}</span></button>; })}
            </div>
          </Section>
          <div className="mt-6"><AiHelper /></div>
        </>
      )}

      {tab === "projects" && (
        <div className="mt-4">
          {projects.error && <ErrorNote message={projects.error} />}
          {projects.loading ? <ListSkeleton /> : list.length === 0 ? <Empty icon={<FolderGit2 size={26} />} title="No projects yet" text="Projects group your ideas, bots and code." /> : <div className="sw-card divide-y divide-border overflow-hidden">{list.map((p) => <ProjectRow key={p.id} p={p} />)}</div>}
          <button onClick={() => setNewOpen(true)} className="sw-btn mt-4 w-full py-3.5"><Plus size={18} /> New project</button>
        </div>
      )}

      {tab === "bots" && (
        <div className="mt-4">
          {bots.loading ? <ListSkeleton /> : botList.length === 0 ? <Empty icon={<Bot size={26} />} title="No bots yet" action={<Link href="/bots" className="sw-btn">Create a bot</Link>} /> : <div className="sw-card divide-y divide-border overflow-hidden">{botList.map((b) => <BotRowView key={b.id} b={b} />)}</div>}
          <Link href="/bots" className="sw-btn mt-4 w-full py-3.5"><Bot size={18} /> Manage bots</Link>
        </div>
      )}

      {tab === "tools" && (
        <div className="mt-4 space-y-2.5">
          {tools.loading ? <ListSkeleton /> : (tools.data?.tools ?? []).map((t) => { const I = TOOL_ICON[t.id] ?? Wrench; return (
            <button key={t.id} onClick={() => setTool(t)} className="sw-card flex w-full items-center gap-3 p-4 text-left hover:border-brand-500/40">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15"><I size={21} /></span>
              <span className="min-w-0 flex-1"><span className="block font-bold">{t.name}</span><span className="block text-[13px] text-subtle">{t.description}</span></span>
              <Badge tone="slate">{t.category}</Badge>
            </button>); })}
        </div>
      )}

      <ToolSheet key={tool?.id} tool={tool} onClose={() => setTool(null)} />
      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New project">
        <div className="space-y-4">
          <Field label="Project name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="My WhatsApp bot" className="sw-input" /></Field>
          <Field label="Description (optional)"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={3} className="sw-input" /></Field>
          <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-semibold">Share with community <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} className="h-5 w-5 accent-brand-600" /></label>
          <button onClick={create} disabled={busy || name.trim().length < 1} className="sw-btn w-full py-3.5">{busy ? "Creating…" : <><Check size={18} /> Create project</>}</button>
        </div>
      </Sheet>
    </Page>
  );
}
