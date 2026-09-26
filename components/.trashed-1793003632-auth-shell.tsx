import Link from "next/link";
import { Logo } from "./logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="hero-glow flex min-h-dvh flex-col text-white">
      <div className="mesh-line flex flex-1 flex-col">
        <header className="mx-auto w-full max-w-6xl px-5 py-4"><Logo light href="/" /></header>
        <main className="mx-auto flex w-full max-w-md flex-1 items-center px-5 pb-10">
          <div className="w-full rounded-3xl border border-blue-400/20 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <h1 className="text-2xl font-extrabold">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
          </div>
        </main>
        <p className="pb-6 text-center text-xs text-slate-500"><Link href="/" className="hover:text-slate-300">← Back to ScottyWorld</Link></p>
      </div>
    </div>
  );
}

export const authInput = "w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";
export const authBtn = "w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-bold text-white shadow-glow transition active:scale-[.99] disabled:opacity-60";
