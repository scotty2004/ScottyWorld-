"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Loader2, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/* ---------- Avatar ---------- */
const PALETTE = ["#2563eb", "#7c3aed", "#0891b2", "#db2777", "#ea580c", "#059669", "#4f46e5", "#0d9488"];
export function Avatar({ name, src, size = 40, ring, online, className = "" }: { name: string; src?: string | null; size?: number; ring?: boolean; online?: boolean; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  const color = PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span className={`grid h-full w-full place-items-center overflow-hidden rounded-full font-semibold text-white ${ring ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-card" : ""}`} style={{ background: src ? undefined : color, fontSize: size * 0.38 }}>
        {src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt="" className="h-full w-full object-cover" /> : initials}
      </span>
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />}
    </span>
  );
}

/* ---------- Layout ---------- */
export function Page({ children, width = "md", className = "" }: { children: ReactNode; width?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const w = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" }[width];
  return <div className={`mx-auto w-full ${w} px-4 pb-8 pt-4 lg:px-6 lg:pt-6 ${className}`}>{children}</div>;
}

export function SubHeader({ title, back = true, right, backHref }: { title: string; back?: boolean; right?: ReactNode; backHref?: string }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-30 -mx-4 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-xl lg:static lg:mx-0 lg:mb-2 lg:h-auto lg:border-0 lg:bg-transparent lg:px-0 lg:py-2 lg:backdrop-blur-none">
      {back && (
        <button onClick={() => (backHref ? router.push(backHref) : router.back())} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-soft lg:hidden">
          <ArrowLeft size={22} />
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-bold lg:text-2xl">{title}</h1>
      {right}
    </div>
  );
}

export function Section({ title, href, action, children, className = "" }: { title: string; href?: string; action?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`mt-6 ${className}`}>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {href && <Link href={href} className="text-sm font-semibold text-brand-600">{action || "View all"}</Link>}
      </div>
      {children}
    </section>
  );
}

/* ---------- Feedback ---------- */
export const Spinner = ({ size = 20 }: { size?: number }) => <Loader2 size={size} className="animate-spin text-brand-500" />;

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-soft ${className}`} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="sw-card flex flex-col items-center px-6 py-10 text-center">
      {icon && <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">{icon}</div>}
      <p className="font-bold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-subtle">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {message}{onRetry && <button onClick={onRetry} className="ml-2 font-semibold underline">Retry</button>}
    </div>
  );
}

/* ---------- Controls ---------- */
export function Tabs<T extends string>({ items, value, onChange }: { items: Array<{ id: T; label: string; badge?: number }>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto border-b border-border px-4">
      {items.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={`relative flex items-center gap-1.5 whitespace-nowrap py-3 text-sm font-semibold transition ${value === t.id ? "text-brand-600" : "text-subtle hover:text-foreground"}`}>
          {t.label}
          {!!t.badge && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{t.badge}</span>}
          {value === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({ items, value, onChange }: { items: Array<{ id: T; label: string }>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {items.map((c) => <button key={c.id} onClick={() => onChange(c.id)} className={`sw-chip ${value === c.id ? "sw-chip-active" : "hover:bg-soft"}`}>{c.label}</button>)}
    </div>
  );
}

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"} disabled:opacity-50`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "red" | "slate" | "purple" }) {
  const t = {
    blue: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
    purple: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${t}`}>{children}</span>;
}

/** Row used by settings / menu / help lists (icon + title + subtitle + chevron). */
export function Row({ icon, title, sub, href, onClick, right, danger, badge }: { icon?: ReactNode; title: string; sub?: string; href?: string; onClick?: () => void; right?: ReactNode; danger?: boolean; badge?: number }) {
  const body = (
    <>
      {icon && <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${danger ? "bg-red-50 text-red-600 dark:bg-red-500/15" : "bg-brand-50 text-brand-600 dark:bg-brand-500/15"}`}>{icon}</span>}
      <span className="min-w-0 flex-1 text-left">
        <span className={`block text-[15px] font-semibold ${danger ? "text-red-600" : ""}`}>{title}</span>
        {sub && <span className="block truncate text-[13px] text-subtle">{sub}</span>}
      </span>
      {!!badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{badge}</span>}
      {right ?? (href || onClick ? <ChevronRight size={18} className="shrink-0 text-subtle" /> : null)}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-3.5 transition hover:bg-soft active:bg-soft";
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button onClick={onClick} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

export const RowGroup = ({ children }: { children: ReactNode }) => <div className="sw-card divide-y divide-border overflow-hidden">{children}</div>;

/* ---------- Bottom sheet ---------- */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center lg:items-center" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[92dvh] w-full max-w-lg animate-fade-up overflow-y-auto rounded-t-3xl border border-border bg-card p-5 pb-8 shadow-2xl lg:rounded-3xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border lg:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-soft"><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-subtle">{hint}</span>}
    </label>
  );
}
