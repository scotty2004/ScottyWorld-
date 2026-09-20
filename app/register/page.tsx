"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gift } from "lucide-react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { AuthShell, authBtn, authInput } from "@/components/auth-shell";

function RegisterForm() {
  const router = useRouter();
  const ref = useSearchParams().get("ref") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const f = new FormData(e.currentTarget);
    const payload = { displayName: String(f.get("displayName") || ""), username: String(f.get("username") || ""), email: String(f.get("email") || ""), password: String(f.get("password") || ""), ref: ref || undefined };
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Registration failed."); return; }
      router.push("/dashboard"); router.refresh();
    } catch { setError("Network problem. Check your connection."); }
    finally { setLoading(false); }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join ScottyWorld — it's free." footer={<>Already have an account? <Link href="/login" className="font-semibold text-blue-400">Sign in</Link></>}>
      {ref && <p className="mb-4 flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-2.5 text-xs text-blue-200"><Gift size={15} /> You were invited by <b>{ref}</b></p>}
      <form onSubmit={submit} className="space-y-3.5">
        <input name="displayName" required minLength={2} placeholder="Display name" autoComplete="name" className={authInput} />
        <input name="username" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+" title="Letters, numbers and underscores only" placeholder="Username" autoComplete="username" className={authInput} />
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className={authInput} />
        <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" autoComplete="new-password" className={authInput} />
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        <button disabled={loading} className={authBtn}>{loading ? "Creating account…" : "Create account"}</button>
        <p className="text-center text-[11px] text-slate-500">By signing up you agree to our Terms of Service, Privacy Policy and Community Guidelines.</p>
      </form>
      <div className="mt-5"><GoogleSignInButton /></div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
