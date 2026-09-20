"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import { Avatar, ErrorNote, Field, ListSkeleton, Page, SubHeader } from "@/components/ui";
import { api, compressImage, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

type A = { account: { displayName: string; username: string; email: string; bio: string; avatarUrl: string | null; emailVerified: boolean; hasPassword: boolean; accountNumber: string } };

export default function AccountSettings() {
  const { data, loading, reload } = useApi<A>("/api/account");
  const a = data?.account;
  const [f, setF] = useState({ displayName: "", username: "", bio: "", email: "", currentPassword: "", newPassword: "" });
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (a) setF((x) => ({ ...x, displayName: a.displayName, username: a.username, bio: a.bio, email: a.email })); }, [a]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });

  async function save() {
    if (!a) return; setBusy(true); setErr("");
    const body: Record<string, unknown> = { displayName: f.displayName, bio: f.bio };
    if (f.username !== a.username) body.username = f.username;
    if (f.email.toLowerCase() !== a.email) { body.email = f.email; body.currentPassword = f.currentPassword; }
    if (f.newPassword) { body.newPassword = f.newPassword; body.currentPassword = f.currentPassword; }
    if (avatar !== undefined) body.avatarUrl = avatar ?? "";
    try { await api("/api/account", { method: "PATCH", json: body }); toast("Saved"); setF((x) => ({ ...x, currentPassword: "", newPassword: "" })); setAvatar(undefined); await reload(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const needsPw = a && (f.email.toLowerCase() !== a.email || f.newPassword) && a.hasPassword;
  const shownAvatar = avatar !== undefined ? avatar : a?.avatarUrl;

  return (
    <Page>
      <SubHeader title="Account" backHref="/settings" />
      {loading || !a ? <ListSkeleton /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button onClick={() => file.current?.click()} className="relative" aria-label="Change photo"><Avatar name={f.displayName || "You"} src={shownAvatar} size={84} /><span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white ring-2 ring-background"><Camera size={15} /></span></button>
            <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) setAvatar(await compressImage(x, 256, 0.8)); }} />
            <div><p className="font-bold">Profile photo</p>{shownAvatar && <button onClick={() => setAvatar(null)} className="text-sm font-semibold text-red-600">Remove</button>}</div>
          </div>
          <Field label="Display name"><input value={f.displayName} onChange={set("displayName")} maxLength={60} className="sw-input" /></Field>
          <Field label="Username" hint="Letters, numbers and underscores. Others use this to find you."><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle">@</span><input value={f.username} onChange={set("username")} maxLength={30} className="sw-input !pl-8" /></div></Field>
          <Field label="Bio"><textarea value={f.bio} onChange={set("bio")} rows={3} maxLength={280} placeholder="Tell people about yourself" className="sw-input" /></Field>
          <Field label="Email" hint={a.emailVerified ? undefined : "Not verified yet — check your inbox for the verification link."}>
            <div className="relative"><input value={f.email} onChange={set("email")} type="email" className="sw-input !pr-11" />{a.emailVerified && <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />}</div></Field>
          <Field label={a.hasPassword ? "Change password" : "Set a password"} hint="Leave blank to keep your current password."><input value={f.newPassword} onChange={set("newPassword")} type="password" minLength={8} autoComplete="new-password" placeholder="New password (8+ characters)" className="sw-input" /></Field>
          {needsPw && <Field label="Current password" hint="Needed to change your email or password."><input value={f.currentPassword} onChange={set("currentPassword")} type="password" autoComplete="current-password" className="sw-input" /></Field>}
          {err && <ErrorNote message={err} />}
          <button onClick={save} disabled={busy} className="sw-btn w-full py-3.5">{busy ? "Saving…" : "Save changes"}</button>
        </div>
      )}
    </Page>
  );
}
