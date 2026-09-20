"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Bot, Store, ShieldCheck, GraduationCap, Newspaper, Coins, CreditCard, Radio, FileClock, Settings, MessagesSquare, ListChecks, Landmark, LifeBuoy } from "lucide-react";
import { LogoMark } from "@/components/logo";

const items = [
  ["Dashboard", "/admin", LayoutDashboard], ["Task reviews", "/admin/tasks", ListChecks], ["Deposits", "/admin/deposits", Landmark], ["Support", "/admin/support", LifeBuoy],
  ["Users", "/admin/users", Users], ["Bots", "/admin/bots", Bot], ["Marketplace", "/admin/marketplace", Store], ["Community", "/admin/community", MessagesSquare],
  ["Academy", "/admin/academy", GraduationCap], ["News", "/admin/news", Newspaper], ["Coins", "/admin/coins", Coins], ["Payments", "/admin/payments", CreditCard],
  ["Channels", "/admin/channels", Radio], ["Security", "/admin/security", ShieldCheck], ["Audit logs", "/admin/audit-logs", FileClock], ["Settings", "/admin/settings", Settings],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const on = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2 font-bold tracking-tight"><LogoMark size={28} /> <span>Control Center</span></Link>
          <Link href="/dashboard" className="text-sm font-semibold text-brand-600">← Back to app</Link>
        </div>
        {/* phones: horizontal tab strip */}
        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
          {items.map(([label, href, Icon]) => <Link key={href} href={href} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${on(href) ? "bg-brand-600 text-white" : "bg-soft text-subtle"}`}><Icon size={14} />{label}</Link>)}
        </nav>
      </header>
      <div className="mx-auto flex max-w-[1500px] gap-5 px-4 py-5">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1">
            {items.map(([label, href, Icon]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${on(href) ? "bg-brand-600 text-white" : "text-subtle hover:bg-soft hover:text-foreground"}`}><Icon className="h-4 w-4" />{label}</Link>)}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
