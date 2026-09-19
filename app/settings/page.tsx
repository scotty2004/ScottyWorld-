import { getCurrentUser } from "../../lib/auth/session";
import { redirect } from "next/navigation";
import { ShieldCheck, UserRound, Bell, KeyRound } from "lucide-react";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted">Manage your ScottyWorld account and security preferences.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <UserRound className="text-brand-500" />
          <h2 className="mt-5 font-semibold">Profile</h2>
          <p className="mt-2 text-sm text-muted">@{user.username} · {user.email}</p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <ShieldCheck className="text-brand-500" />
          <h2 className="mt-5 font-semibold">Security</h2>
          <p className="mt-2 text-sm text-muted">{user.emailVerified ? "Email verified" : "Email verification required"}</p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <KeyRound className="text-brand-500" />
          <h2 className="mt-5 font-semibold">Password and sessions</h2>
          <p className="mt-2 text-sm text-muted">Password reset and active-session controls are available through the secure API layer.</p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <Bell className="text-brand-500" />
          <h2 className="mt-5 font-semibold">Notifications</h2>
          <p className="mt-2 text-sm text-muted">Notification preferences will control security, community, bot, marketplace and platform updates.</p>
        </section>
      </div>
    </div>
  );
}