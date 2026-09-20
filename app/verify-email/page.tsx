"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";

function Verify() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<{ ok: boolean | null; msg: string }>({ ok: null, msg: "Verifying your email…" });

  useEffect(() => {
    if (!token) { setState({ ok: false, msg: "No verification token was provided." }); return; }
    fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (r) => { const d = await r.json().catch(() => ({})); setState(r.ok ? { ok: true, msg: "Your email has been verified. 🎉" } : { ok: false, msg: d.error || "Verification failed." }); })
      .catch(() => setState({ ok: false, msg: "Verification failed. Check your connection." }));
  }, [token]);

  return (
    <AuthShell title="Email verification">
      <p className={`text-sm ${state.ok === false ? "text-red-300" : state.ok ? "text-emerald-300" : "text-slate-300"}`}>{state.msg}</p>
      <Link href="/dashboard" className="mt-6 block rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-center text-sm font-bold">Continue</Link>
    </AuthShell>
  );
}

export default function VerifyEmailPage() { return <Suspense><Verify /></Suspense>; }
