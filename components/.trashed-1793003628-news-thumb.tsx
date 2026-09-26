"use client";
import { Newspaper } from "lucide-react";

export function NewsThumb({ url, title, className = "" }: { url: string | null; title: string; className?: string }) {
  return url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt="" className={`object-cover ${className}`} /> : (
    <div className={`grid place-items-center bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 p-3 text-center ${className}`}><Newspaper className="text-white/80" size={28} /><span className="sr-only">{title}</span></div>
  );
}

