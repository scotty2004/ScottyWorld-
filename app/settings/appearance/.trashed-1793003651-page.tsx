"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { Page, SubHeader } from "@/components/ui";
import { api } from "@/lib/client";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pick = (t: "light" | "dark") => { setTheme(t); void api("/api/account", { method: "PATCH", json: { theme: t } }).catch(() => null); };
  const opts = [{ id: "light" as const, label: "Light", icon: Sun, sample: "bg-white border-slate-200" }, { id: "dark" as const, label: "Dark", icon: Moon, sample: "bg-slate-900 border-slate-700" }];
  return (
    <Page>
      <SubHeader title="Appearance" backHref="/settings" />
      <div className="grid grid-cols-2 gap-3">
        {opts.map((o) => { const on = mounted && theme === o.id; const I = o.icon; return (
          <button key={o.id} onClick={() => pick(o.id)} className={`sw-card p-3 text-left transition ${on ? "!border-brand-600 ring-2 ring-brand-600/25" : ""}`}>
            <div className={`h-24 rounded-xl border p-2 ${o.sample}`}><div className={`h-3 w-1/2 rounded ${o.id === "dark" ? "bg-slate-700" : "bg-slate-200"}`} /><div className="mt-2 h-8 rounded bg-brand-600/80" /></div>
            <p className="mt-3 flex items-center gap-2 font-semibold"><I size={17} />{o.label}{on && <Check size={16} className="ml-auto text-brand-600" />}</p>
          </button>); })}
      </div>
    </Page>
  );
}
