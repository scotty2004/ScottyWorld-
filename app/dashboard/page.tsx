import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bot, Code2, Coins, GraduationCap, ShieldCheck, Sparkles, Store, Users } from "lucide-react";
import { getCurrentUser } from "../../lib/auth/session";

const actions = [
  ["Ask Scotty AI", "/ai", Sparkles],
  ["Create Bot", "/bots", Bot],
  ["Developer Tools", "/developer", Code2],
  ["Marketplace", "/marketplace", Store],
  ["Academy", "/academy", GraduationCap],
  ["Community", "/community", Users],
];

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted">Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Good morning, {user.displayName}.</h1>
          <p className="mt-2 text-muted">Welcome back to your ScottyWorld workspace.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <Coins className="text-brand-500" size={20} />
            <div><p className="text-xs text-muted">Scotty Coins</p><p className="font-bold">0 SC</p></div>
          </div>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active Bots", "0", Bot],
          ["Academy Progress", "0%", GraduationCap],
          ["Community Activity", "0", Users],
          ["Security", "Protected", ShieldCheck],
        ].map(([label, value, Icon]) => {
          const I = Icon as typeof Bot;
          return <div key={label as string} className="rounded-2xl border border-border bg-card p-5">
            <I size={19} className="text-brand-500" />
            <p className="mt-4 text-sm text-muted">{label as string}</p>
            <p className="mt-1 text-2xl font-bold">{value as string}</p>
          </div>;
        })}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Quick actions</h2>
          <Link href="/settings" className="text-sm text-brand-500">Customize</Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map(([title, href, Icon]) => {
            const I = Icon as typeof Bot;
            return <Link key={title as string} href={href as string} className="group rounded-2xl border border-border bg-card p-5 hover:border-brand-500/40">
              <div className="flex items-center justify-between">
                <I size={21} className="text-brand-500" />
                <ArrowRight size={18} className="text-muted transition group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
              <p className="mt-6 font-semibold">{title as string}</p>
            </Link>;
          })}
        </div>
      </section>
    </div>
  );
}