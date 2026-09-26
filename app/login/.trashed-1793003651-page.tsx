"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { AuthShell, authBtn, authInput } from "@/components/auth-shell";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [need2fa, setNeed2fa] = useState(false);
  const [creds, setCreds] = useState({ email: "", password: "" });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = { email: creds.email || String(form.get("email") || ""), password: creds.password || String(form.get("password") || ""), code: need2fa ? String(form.get("code") || "") : undefined };
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (data.twoFactorRequired) { setCreds({ email: payload.email, password: payload.password }); setNeed2fa(true); return; }
      if (!res.ok) { setError(data.error || "Unable to sign in."); return; }
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch { setError("Network problem. Check your connection."); }
    finally { setLoading(false); }
  }

  return (
    <AuthShell title={need2fa ? "Two-step verification" : "Welcome back"} subtitle={need2fa ? "Enter the 6-digit code from your authenticator app." : "Sign in to your ScottyWorld account."}
      footer={<>New to ScottyWorld? <Link href="/register" className="font-semibold text-blue-400">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {!need2fa ? (
          <>
            <input name="email" type="email" required autoComplete="email" placeholder="Email" className={authInput} />
            <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={authInput} />
            <div className="text-right"><Link href="/forgot-password" className="text-xs font-semibold text-blue-400">Forgot password?</Link></div>
          </>
        ) : (
          <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus placeholder="123456" className={`${authInput} text-center text-2xl tracking-[.5em]`} />
        )}
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        <button disabled={loading} className={authBtn}>{loading ? "Please wait…" : need2fa ? "Verify & sign in" : "Sign in"}</button>
      </form>
      {!need2fa && <div className="mt-5"><GoogleSignInButton /></div>}
    </AuthShell>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
