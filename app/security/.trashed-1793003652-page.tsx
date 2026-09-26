"use client";

import Link from "next/link";
import { useState } from "react";
import { Laptop, LogOut, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { Badge, Empty, ListSkeleton, Page, Section, SubHeader } from "@/components/ui";
import { api, timeAgo, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type S = { id: string; createdAt: string; lastSeenAt: string; userAgent: string | null; current: boolean };
type Ev = { id: string; level: string; event: string; createdAt: string };

function describe(ua: string | null) {
  if (!ua) return { name: "Unknown device", mobile: false };
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return { name: `${browser}${os ? ` on ${os}` : ""}`, mobile: /Android|iPhone|iPad|Mobile/.test(ua) };
}

export default function SecurityCenter() {
  const sessions = useApi<{ sessions: S[] }>("/api/auth/sessions");
  const events = useApi<{ events: Ev[] }>("/api/security/events");
  const acc = useApi<{ account: { twoFactor: boolean; emailVerified: boolean } }>("/api/account");
  const [busy, setBusy] = useState(false);
  const list = sessions.data?.sessions ?? [];

  async function revoke(id: string) { try { await api("/api/auth/sessions", { method: "DELETE", json: { sessionId: id } }); toast("Device signed out"); await sessions.reload(); } catch (e) { toast((e as Error).message, "err"); } }
  async function revokeOthers() {
    if (!confirm("Sign out of all other devices?")) return; setBusy(true);
    try { for (const s of list.filter((x) => !x.current)) await api("/api/auth/sessions", { method: "DELETE", json: { sessionId: s.id } }); toast("Signed out everywhere else"); await sessions.reload(); } finally { setBusy(false); }
  }

  const checks = [
    { ok: acc.data?.account.twoFactor, label: "Two-factor authentication", fix: "/settings/privacy" },
    { ok: acc.data?.account.emailVerified, label: "Email verified", fix: "/settings/account" },
  ];

  return (
    <Page>
      <SubHeader title="Security Center" backHref="/settings" />
      <div className="sw-card divide-y divide-border">
        {checks.map((c) => (
          <Link key={c.label} href={c.fix} className="flex items-center gap-3 px-4 py-3.5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>{c.ok ? <ShieldCheck size={20} /> : <TriangleAlert size={20} />}</span>
            <span className="flex-1 font-semibold">{c.label}</span>{c.ok ? <Badge tone="green">On</Badge> : <Badge tone="amber">Fix</Badge>}
          </Link>
        ))}
      </div>

      <Section title="Where you're signed in">
        {sessions.loading ? <ListSkeleton rows={2} /> : list.length === 0 ? <Empty title="No active sessions" /> : (
          <div className="sw-card divide-y divide-border overflow-hidden">
            {list.map((s) => { const d = describe(s.userAgent); const I = d.mobile ? Smartphone : Laptop; return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15"><I size={20} /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{d.name} {s.current && <Badge tone="green">This device</Badge>}</p><p className="text-xs text-subtle">Active {timeAgo(s.lastSeenAt)} ago · signed in {new Date(s.createdAt).toLocaleDateString()}</p></div>
                {!s.current && <button onClick={() => revoke(s.id)} aria-label="Sign out this device" className="grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-500/10"><LogOut size={18} /></button>}
              </div>); })}
          </div>
        )}
        {list.length > 1 && <button onClick={revokeOthers} disabled={busy} className="sw-btn-ghost mt-3 w-full !text-red-600">Sign out of all other devices</button>}
      </Section>

      <Section title="Recent security activity">
        {events.loading ? <ListSkeleton rows={2} /> : !events.data?.events.length ? <p className="sw-card p-6 text-center text-sm text-subtle">No security events recorded.</p> : (
          <div className="sw-card divide-y divide-border overflow-hidden">{events.data.events.slice(0, 10).map((e) => <div key={e.id} className="flex items-center gap-3 px-4 py-3"><Badge tone={e.level === "CRITICAL" ? "red" : e.level === "WARNING" ? "amber" : "slate"}>{e.level.toLowerCase()}</Badge><p className="min-w-0 flex-1 truncate text-sm">{e.event.replace(/_/g, " ").toLowerCase()}</p><span className="text-xs text-subtle">{timeAgo(e.createdAt)}</span></div>)}</div>
        )}
      </Section>
    </Page>
  );
}
