import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="ScottyWorld home">
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-brand-500 shadow-glow">
        <svg viewBox="0 0 40 40" className="h-7 w-7 text-white" fill="none" aria-hidden="true">
          <path d="M27.5 7.5 13 16l14.5 8.5L13 32.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 13.5 32 20l-12 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".65"/>
        </svg>
      </span>
      {!compact && <span className="text-lg font-bold tracking-tight">ScottyWorld</span>}
    </Link>
  );
}