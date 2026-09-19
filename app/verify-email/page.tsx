"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const [message, setMessage] = useState("Verifying your email...");
  const token = params.get("token");

  useEffect(() => {
    if (!token) {
      setMessage("No verification token was provided.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async response => {
      const data = await response.json();
      setMessage(response.ok ? "Your email has been verified." : data.error || "Verification failed.");
    }).catch(() => setMessage("Verification failed."));
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-5">
      <div className="w-full rounded-3xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold">Email verification</h1>
        <p className="mt-3 text-sm text-muted">{message}</p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white">Continue</Link>
      </div>
    </div>
  );
}