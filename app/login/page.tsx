"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "../../components/google-sign-in-button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Unable to sign in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-5 py-12">
      <div className="w-full rounded-3xl border border-border bg-card p-7">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to your ScottyWorld account.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium">Email
            <input name="email" type="email" required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand-500" placeholder="you@example.com" />
          </label>
          <label className="block text-sm font-medium">Password
            <input name="password" type="password" required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand-500" />
          </label>

          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}

          <button disabled={loading} className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <GoogleSignInButton />

        <p className="mt-6 text-center text-sm text-muted">
          New to ScottyWorld? <Link href="/register" className="text-brand-500">Create an account</Link>
        </p>
      </div>
    </div>
  );
}