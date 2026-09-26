"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

type T = { id: number; text: string; kind: "ok" | "err" };
const EVT = "sw:toast";

export const toast = (text: string, kind: "ok" | "err" = "ok") => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT, { detail: { text, kind } }));
};

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const { text, kind } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setItems((p) => [...p.slice(-2), { id, text, kind }]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 3200);
    };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-md animate-fade-up items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-float dark:bg-white dark:text-slate-900">
          {t.kind === "ok" ? <CheckCircle2 size={17} className="text-emerald-400" /> : <AlertCircle size={17} className="text-red-400" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
