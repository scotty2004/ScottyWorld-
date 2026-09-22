"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Gift } from "lucide-react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { AuthShell, authBtn, authInput } from "@/components/auth-shell";
import { passwordStrength } from "@/lib/auth/password-strength";
import { MIN_SIGNUP_AGE, ageFromDateOfBirth, isFullName, parseDateOfBirth } from "@/lib/validators/auth";

const BAR = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"];
const TEXT = ["text-red-400", "text-red-400", "text-amber-400", "text-sky-400", "text-emerald-400"];

function isoYearsAgo(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function RegisterForm() {
  const router = useRouter();
  const ref = useSearchParams().get("ref") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "", confirmPassword: "", dateOfBirth: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const strength = useMemo(
    () => passwordStrength(form.password, { username: form.username, email: form.email, name: form.displayName }),
    [form.password, form.username, form.email, form.displayName]
  );
  const mismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!isFullName(form.displayName)) return setError("Enter your full name (name and surname).");
    if (!strength.ok) return setError(strength.problem || "Choose a stronger password.");
    if (form.password !== form.confirmPassword) return setError("Passwords don't match.");
    const dob = parseDateOfBirth(form.dateOfBirth);
    if (!dob) return setError("Enter your date of birth.");
    if (ageFromDateOfBirth(dob) < MIN_SIGNUP_AGE) return setError(`You must be at least ${MIN_SIGNUP_AGE} years old to join.`);

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, ref: ref || undefined }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Registration failed."); return; }
      router.push("/dashboard"); router.refresh();
    } catch { setError("Network problem. Check your connection."); }
    finally { setLoading(false); }
  }

  const rules: [string, boolean][] = [["8+ characters", strength.checks.length], ["Upper & lower case", strength.checks.upper && strength.checks.lower], ["A number", strength.checks.number], ["A symbol (optional)", strength.checks.symbol]];

  return (
    <AuthShell title="Create your account" subtitle="Join ScottyWorld — it's free." footer={<>Already have an account? <Link href="/login" className="font-semibold text-blue-400">Sign in</Link></>}>
      {ref && <p className="mb-4 flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-2.5 text-xs text-blue-200"><Gift size={15} /> You were invited by <b>{ref}</b></p>}
      <form onSubmit={submit} className="space-y-3.5">
        <input name="displayName" value={form.displayName} onChange={set("displayName")} required minLength={3} maxLength={60} placeholder="Full name (name and surname)" autoComplete="name" className={authInput} />
        <input name="username" value={form.username} onChange={set("username")} required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+" title="Letters, numbers and underscores only" placeholder="Username" autoComplete="username" autoCapitalize="none" className={authInput} />
        <input name="email" type="email" value={form.email} onChange={set("email")} required placeholder="Email" autoComplete="email" className={authInput} />

        <div>
          <input name="password" type="password" value={form.password} onChange={set("password")} required minLength={8} maxLength={128} placeholder="Password" autoComplete="new-password" className={authInput} />
          {form.password.length > 0 && (
            <div className="mt-2 px-1" aria-live="polite">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${strength.score >= n ? BAR[strength.score] : "bg-slate-700"}`} />)}
              </div>
              <p className={`mt-1.5 text-xs font-semibold ${TEXT[strength.score]}`}>Password strength: {strength.label}</p>
              <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-400">
                {rules.map(([label, met]) => <li key={label} className={`flex items-center gap-1.5 ${met ? "text-emerald-400" : ""}`}><Check size={12} className={met ? "" : "opacity-30"} />{label}</li>)}
              </ul>
              {strength.problem && strength.checks.length && <p className="mt-1.5 text-[11px] text-amber-400">{strength.problem}</p>}
            </div>
          )}
        </div>

        <div>
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required maxLength={128} placeholder="Confirm password" autoComplete="new-password" className={authInput} />
          {mismatch && <p className="mt-1.5 px-1 text-[11px] text-red-400">Passwords don&apos;t match.</p>}
          {!mismatch && form.confirmPassword.length > 0 && <p className="mt-1.5 flex items-center gap-1.5 px-1 text-[11px] text-emerald-400"><Check size={12} /> Passwords match</p>}
        </div>

        <div>
          <label htmlFor="dob" className="mb-1.5 block px-1 text-xs font-medium text-slate-400">Date of birth</label>
          <input id="dob" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required min={isoYearsAgo(120)} max={isoYearsAgo(MIN_SIGNUP_AGE)} autoComplete="bday" className={`${authInput} [color-scheme:dark]`} />
        </div>

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
