"use client";
import { Bot, Code2, LayoutTemplate, Package, Palette, Plug, Smartphone, Wrench, type LucideIcon } from "lucide-react";

const ICON: Record<string, LucideIcon> = { BOT: Bot, TEMPLATE: LayoutTemplate, CODE: Code2, TOOL: Wrench, AI_TOOL: Wrench, THEME: Palette, APP: Smartphone, PLUGIN: Plug, DEV_RESOURCE: Package };

export function Cover({ url, type, size = 56 }: { url: string | null; type: string; size?: number }) {
  const I = ICON[type] ?? Package;
  return url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt="" className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} /> : (
    <span className="grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 text-white" style={{ width: size, height: size }}><I size={size * 0.45} /></span>
  );
}

