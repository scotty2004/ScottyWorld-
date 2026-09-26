"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Page, SubHeader } from "@/components/ui";
import { LEGAL } from "@/lib/legal";
import pkg from "../../../package.json";

export default function AboutPage() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Page>
      <SubHeader title="About" backHref="/settings" />
      <div className="sw-card flex flex-col items-center px-4 py-8 text-center"><LogoMark size={64} /><p className="mt-3 text-xl font-extrabold">Scotty<span className="text-brand-500">World</span></p><p className="text-sm text-subtle">The all-in-one tech ecosystem</p><p className="mt-2 rounded-full bg-soft px-3 py-1 text-xs font-semibold">Version {pkg.version}</p></div>
      <div className="sw-card mt-4 divide-y divide-border overflow-hidden">
        {Object.entries(LEGAL).map(([k, v]) => (
          <div key={k}>
            <button onClick={() => setOpen(open === k ? null : k)} className="flex w-full items-center justify-between px-4 py-4 text-left font-semibold">{v.title}<ChevronDown size={18} className={`text-subtle transition ${open === k ? "rotate-180" : ""}`} /></button>
            {open === k && <p className="whitespace-pre-wrap px-4 pb-5 text-[14px] leading-relaxed text-subtle">{v.body}</p>}
          </div>
        ))}
      </div>
    </Page>
  );
}
