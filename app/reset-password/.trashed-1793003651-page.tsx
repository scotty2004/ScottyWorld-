"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, authBtn, authInput } from "@/components/auth-shell";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") || "");
    if (password !== String(f.get("confirm") || "")) return setError("Passwords don't match.");
    setBusy(true);
    const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not reset password.");
    setDone(true); setTimeout(() => router.push("/login"), 1800);
  }

  return (
    <AuthShell title="Choose a new password" footer={<Link href="/login" className="font-semibold text-blue-400">Back to sign in</Link>}>
      {!token ? <p className="text-sm text-red-300">This reset link is missing its token. Request a new one.</p> : done ? <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">Password updated. Redirecting to sign in…</p> : (
        <form onSubmit={submit} className="space-y-4">
          <input name="password" type="password" required minLength={8} placeholder="New password" autoComplete="new-password" className={authInput} />
          <input name="confirm" type="password" required minLength={8} placeholder="Confirm password" autoComplete="new-password" className={authInput} />
          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
          <button disabled={busy} className={authBtn}>{busy ? "Saving…" : "Update password"}</button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() { return <Suspense><ResetForm /></Suspense>; }
