"use client";

import Link from "next/link";
import { useState } from "react";
import { Ban, Copy, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { Avatar, Empty, Field, ListSkeleton, Page, Sheet, SubHeader, Toggle } from "@/components/ui";
import { api, copyText, timeAgo, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

export default function PrivacySettings() {
  const acc = useApi<{ account: { private: boolean; twoFactor: boolean } }>("/api/account");
  const blocks = useApi<{ blocked: Array<{ username: string; displayName: string; since: string }> }>("/api/account/blocks");
  const [tfa, setTfa] = useState<"idle" | "setup" | "off">("idle");
  const [secret, setSecret] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState(""); const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);
  const a = acc.data?.account;

  async function setPrivate(v: boolean) { try { await api("/api/account", { method: "PATCH", json: { private: v } }); toast(v ? "Your account is now private" : "Your account is public"); await acc.reload(); } catch (e) { toast((e as Error).message, "err"); } }
  async function unblock(u: string) { await api("/api/account/blocks", { method: "POST", json: { username: u } }).catch(() => null); await blocks.reload(); }
  async function startTfa() { try { setSecret(await api("/api/account/2fa", { method: "POST", json: { action: "setup" } })); setCode(""); setTfa("setup"); } catch (e) { toast((e as Error).message, "err"); } }
  async function enableTfa() { setBusy(true); try { await api("/api/account/2fa", { method: "POST", json: { action: "enable", code } }); toast("Two-factor authentication is on"); setTfa("idle"); await acc.reload(); } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); } }
  async function disableTfa() { setBusy(true); try { await api("/api/account/2fa", { method: "POST", json: { action: "disable", password: pw } }); toast("Two-factor authentication is off"); setTfa("idle"); setPw(""); await acc.reload(); } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); } }

  return (
    <Page>
      <SubHeader title="Privacy & Security" backHref="/settings" />
      {acc.loading || !a ? <ListSkeleton /> : (
        <div className="space-y-4">
          <div className="sw-card divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-4"><div className="flex-1"><p className="font-semibold">Private account</p><p className="text-[13px] text-subtle">Only people who follow you can see your posts.</p></div><Toggle checked={a.private} onChange={setPrivate} /></div>
            <div className="flex items-center gap-3 px-4 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><ShieldCheck size={20} /></span>
              <div className="flex-1"><p className="font-semibold">Two-factor authentication</p><p className="text-[13px] text-subtle">{a.twoFactor ? "On — a code is required at sign-in." : "Add an extra layer of protection."}</p></div>
              <button onClick={() => (a.twoFactor ? setTfa("off") : startTfa())} className={a.twoFactor ? "sw-btn-ghost !px-3.5 !py-2 text-xs" : "sw-btn !px-3.5 !py-2 text-xs"}>{a.twoFactor ? "Turn off" : "Enable"}</button></div>
            <Link href="/security" className="flex items-center gap-3 px-4 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15"><Smartphone size={20} /></span><div className="flex-1"><p className="font-semibold">Security Center</p><p className="text-[13px] text-subtle">Review devices signed in to your account</p></div></Link>
          </div>

          <div><h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-subtle">Blocked users</h2>
            {blocks.loading ? <ListSkeleton rows={1} /> : !blocks.data?.blocked.length ? <Empty icon={<Ban size={24} />} title="No blocked users" text="People you block can't see your posts or message you." /> : (
              <div className="sw-card divide-y divide-border overflow-hidden">{blocks.data.blocked.map((b) => <div key={b.username} className="flex items-center gap-3 px-4 py-3"><Avatar name={b.displayName} size={40} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{b.displayName}</p><p className="text-xs text-subtle">@{b.username} · blocked {timeAgo(b.since)} ago</p></div><button onClick={() => unblock(b.username)} className="sw-btn-ghost !px-3.5 !py-2 text-xs">Unblock</button></div>)}</div>
            )}</div>
        </div>
      )}

      <Sheet open={tfa === "setup"} onClose={() => setTfa("idle")} title="Set up 2FA">
        {secret && <div className="space-y-4">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm"><li>Open an authenticator app (Google Authenticator, Authy, Microsoft Authenticator).</li><li>Add a key manually and enter the setup key below (or tap the button on this phone).</li><li>Enter the 6-digit code it shows.</li></ol>
          <div className="flex items-center gap-2 rounded-xl bg-soft p-3"><KeyRound size={17} className="text-brand-600" /><code className="flex-1 break-all text-sm font-bold tracking-wider">{secret.secret.match(/.{1,4}/g)?.join(" ")}</code><button onClick={async () => { await copyText(secret.secret); toast("Key copied"); }} aria-label="Copy key"><Copy size={16} /></button></div>
          <a href={secret.uri} className="sw-btn-ghost w-full">Open in authenticator app</a>
          <Field label="6-digit code"><input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className="sw-input text-center text-xl tracking-[.4em]" /></Field>
          <button onClick={enableTfa} disabled={busy || code.length !== 6} className="sw-btn w-full py-3.5">{busy ? "Verifying…" : "Turn on 2FA"}</button></div>}
      </Sheet>
      <Sheet open={tfa === "off"} onClose={() => setTfa("idle")} title="Turn off 2FA">
        <div className="space-y-4"><p className="text-sm text-subtle">Enter your password to confirm. Your account will be less protected.</p><input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Password" className="sw-input" />
          <button onClick={disableTfa} disabled={busy || !pw} className="sw-btn w-full !bg-red-600 py-3.5 hover:!bg-red-700">{busy ? "Turning off…" : "Turn off 2FA"}</button></div>
      </Sheet>
    </Page>
  );
}
