"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Bot, Store, ShieldCheck, GraduationCap,
  Newspaper, Coins, CreditCard, Radio, FileClock, Settings, MessagesSquare
} from "lucide-react";

const items = [
  ["Dashboard","/admin",LayoutDashboard],
  ["Users","/admin/users",Users],
  ["Bots","/admin/bots",Bot],
  ["Marketplace","/admin/marketplace",Store],
  ["Community","/admin/community",MessagesSquare],
  ["Academy","/admin/academy",GraduationCap],
  ["News","/admin/news",Newspaper],
  ["Coins","/admin/coins",Coins],
  ["Payments","/admin/payments",CreditCard],
  ["Channels","/admin/channels",Radio],
  ["Security","/admin/security",ShieldCheck],
  ["Audit Logs","/admin/audit-logs",FileClock],
  ["Settings","/admin/settings",Settings],
] as const;

export function AdminShell({children}:{children:React.ReactNode}) {
  const path=usePathname();
  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3">
        <Link href="/admin" className="font-bold tracking-tight">SCOTTYWORLD <span className="text-muted-foreground">CONTROL CENTER</span></Link>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Back to platform</Link>
      </div>
    </header>
    <div className="mx-auto flex max-w-[1500px] gap-5 px-4 py-5">
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="sticky top-20 space-y-1">
          {items.map(([label,href,Icon])=><Link key={href} href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${path===href?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <Icon className="h-4 w-4"/>{label}
          </Link>)}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  </div>
}
