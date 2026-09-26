"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { TABS, MENU_GROUPS } from "@/lib/navigation";
import { Logo } from "./logo";
import { Avatar } from "./ui";
import { Toaster } from "./toast";
import { useRealtimeState } from "./realtime";
import { IncomingCallBanner } from "./incoming-call";

export type ShellUser = { displayName: string; username: string; avatarUrl: string | null } | null;

/** Routes that render without the app chrome (marketing + auth + admin has its own shell). */
const BARE = ["/", "/login", "/register", "/forgot-password", "/verify-email"];
const isBare = (p: string) => BARE.includes(p) || p.startsWith("/admin") || p.startsWith("/reset");

/** Routes where the phone bottom bar is hidden so the composer/chat can use the full screen. */
const NO_TABS = [/^\/messages$/, /^\/messages\/[^/]+$/, /^\/messages\/[^/]+\/call$/, /^\/ai$/, /^\/community\/create$/, /^\/community\/post\/[^/]+$/];

/** Tab roots show the big header on phones. Every other page brings its own back-arrow header. */
const TAB_ROOTS = ["/dashboard", "/community", "/developer", "/menu"];

export function AppShell({ children, user }: { children: React.ReactNode; user: ShellUser }) {
  const pathname = usePathname();
  if (isBare(pathname) || !user) return <>{children}<Toaster /></>;
  return <Chrome pathname={pathname} user={user}>{children}</Chrome>;
}

/** Only mounted for signed-in app pages, so the live connection is never opened for visitors. */
function Chrome({ children, user, pathname }: { children: React.ReactNode; user: NonNullable<ShellUser>; pathname: string }) {
  const live = useRealtimeState();

  const showTabs = !NO_TABS.some((r) => r.test(pathname));
  const showTop = TAB_ROOTS.includes(pathname);
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <IncomingCallBanner />
      {/* top bar — big on tab roots (phones), always on desktop */}
      <header className={`${showTop ? "" : "hidden lg:block"} sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl safe-top`}>
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 lg:h-16 lg:px-6">
          <Logo />
          <Link href="/search" className="ml-6 hidden max-w-md flex-1 items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-subtle hover:border-brand-500/50 lg:flex">
            <Search size={17} /> Search ScottyWorld…
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/search" aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft lg:hidden"><Search size={21} /></Link>
            <Link href="/notifications" aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-soft">
              <Bell size={21} />
              {live.unreadNotif > 0 && <span className="absolute right-1 top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-background">{live.unreadNotif > 9 ? "9+" : live.unreadNotif}</span>}
            </Link>
            <Link href="/profile" aria-label="Your profile" className="ml-1"><Avatar name={user.displayName} src={user.avatarUrl} size={34} /></Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-border px-3 py-4 lg:block">
          <nav className="space-y-5">
            <div className="space-y-0.5">
              {TABS.filter((t) => t.href !== "/menu").map((t) => {
                const I = t.icon;
                return <Link key={t.href} href={t.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active(t.href) ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200" : "text-subtle hover:bg-soft hover:text-foreground"}`}><I size={19} />{t.label === "Hub" ? "Developer Hub" : t.label}</Link>;
              })}
            </div>
            {MENU_GROUPS.map((g) => (
              <div key={g.title}>
                <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-subtle/80">{g.title}</p>
                <div className="space-y-0.5">
                  {g.items.map((it) => {
                    const I = it.icon;
                    const badge = it.href === "/messages" ? live.unreadDm : it.href === "/notifications" ? live.unreadNotif : 0;
                    return (
                      <Link key={it.href} href={it.href} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${active(it.href) ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200" : "text-subtle hover:bg-soft hover:text-foreground"}`}>
                        <I size={18} strokeWidth={1.9} /><span className="flex-1">{it.label}</span>
                        {badge > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{badge}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className={`min-w-0 flex-1 ${showTabs ? "pb-24 lg:pb-0" : ""}`}>{children}</main>
      </div>

      {/* phone bottom navigation */}
      {showTabs && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl lg:hidden" aria-label="Primary">
          <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
            {TABS.map((t) => {
              const I = t.icon;
              const on = active(t.href) || (t.href === "/menu" && MENU_GROUPS.some((g) => g.items.some((i) => active(i.href))) && !TABS.some((x) => x.href !== "/menu" && active(x.href)));
              const badge = t.href === "/menu" ? live.unreadDm : 0;
              return (
                <li key={t.href}>
                  <Link href={t.href} className={`relative flex h-full flex-col items-center justify-center gap-1 text-[10.5px] font-semibold ${on ? "text-brand-600" : "text-subtle"}`}>
                    <I size={22} strokeWidth={on ? 2.3 : 1.8} />
                    {t.label}
                    {badge > 0 && <span className="absolute right-[26%] top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-card" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      <Toaster />
    </div>
  );
}
