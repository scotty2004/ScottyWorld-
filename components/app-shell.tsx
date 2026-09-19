"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { navigation } from "../lib/navigation";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { CommandBar } from "./command-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 lg:px-6">
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-border lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"}>
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
          <Logo />
          <button onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))} className="ml-auto hidden max-w-xl flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm text-muted hover:text-foreground lg:flex">
            <Search size={17} /> Ask Scotty or search ScottyWorld...
            <kbd className="ml-auto rounded-md border border-border px-2 py-0.5 text-xs">Ctrl K</kbd>
          </button>
          <ThemeToggle />
          <Link href="/login" className="hidden rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 sm:block">Sign in</Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-16 left-0 z-40 w-72 overflow-y-auto border-r border-border bg-background p-4 transition-transform lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:w-64 lg:translate-x-0`}>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-brand-500/10 font-semibold text-brand-500" : "text-muted hover:bg-card hover:text-foreground"}`}>
                <Icon size={18} strokeWidth={1.8} />{item.label}
              </Link>;
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <CommandBar />
    </div>
  );
}