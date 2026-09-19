"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email") || "") }),
    });
    setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-5">
      <div className="w-full rounded-3xl border border-border bg-card p-7">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm text-muted">Enter your email and, if an account exists, ScottyWorld will send reset instructions.</p>
        {sent ? <p className="mt-7 rounded-xl bg-brand-500/10 p-4 text-sm text-brand-500">If the account exists, reset instructions have been queued.</p> : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <input name="email" type="email" required placeholder="you@example.com" className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand-500" />
            <button className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white">Send reset instructions</button>
          </form>
        )}
        <Link href="/login" className="mt-5 block text-center text-sm text-brand-500">Back to sign in</Link>
      </div>
    </div>
  );
}