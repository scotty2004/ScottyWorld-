"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthShell, authBtn, authInput } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: String(form.get("email") || "") }) }).catch(() => null);
    setSent(true); setBusy(false);
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link." footer={<Link href="/login" className="font-semibold text-blue-400">Back to sign in</Link>}>
      {sent ? <p className="rounded-xl border border-blue-400/25 bg-blue-500/10 p-4 text-sm text-blue-200">If an account exists for that email, a reset link is on its way. It expires in 30 minutes.</p> : (
        <form onSubmit={submit} className="space-y-4">
          <input name="email" type="email" required placeholder="you@example.com" className={authInput} />
          <button disabled={busy} className={authBtn}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
    </AuthShell>
  );
}
