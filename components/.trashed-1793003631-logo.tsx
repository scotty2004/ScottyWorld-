import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="swg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b82f6" /><stop offset="1" stopColor="#1d3fd0" /></linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#swg)" />
      <path d="M31.5 15.5c-1.6-2-4-3-7-3-4.2 0-7 2.1-7 5.2 0 3 2.3 4.3 6.6 5.4 3.4.9 4.4 1.5 4.4 2.9 0 1.5-1.6 2.4-3.8 2.4-2.6 0-4.5-1-5.9-2.8l-3.3 3c1.9 2.6 4.9 4 9 4 4.6 0 7.7-2.2 7.7-5.8 0-3.1-2.2-4.6-6.7-5.7-3.1-.8-4.2-1.3-4.2-2.6 0-1.2 1.2-2 3.2-2 2 0 3.5.7 4.7 2.2l3.1-3Z" fill="#fff" />
    </svg>
  );
}

export function Logo({ compact = false, href = "/dashboard", light = false }: { compact?: boolean; href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="ScottyWorld home">
      <LogoMark />
      {!compact && (
        <span className="text-[19px] font-bold tracking-tight">
          <span className={light ? "text-white" : "text-foreground"}>Scotty</span><span className="text-brand-500">World</span>
        </span>
      )}
    </Link>
  );
}
