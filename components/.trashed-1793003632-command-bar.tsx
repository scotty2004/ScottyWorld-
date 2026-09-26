"use client";

import { Command, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const items = [
  ["Ask Scotty AI", "/ai"],
  ["Open Dashboard", "/dashboard"],
  ["My Bots", "/bots"],
  ["Developer Tools", "/developer"],
  ["Academy", "/academy"],
  ["Marketplace", "/marketplace"],
  ["Community", "/community"],
  ["Security Center", "/security"],
  ["Settings", "/settings"],
];

export function CommandBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = items.filter(([label]) => label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-[12vh] max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="text-muted" />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask Scotty or search ScottyWorld..." className="h-14 flex-1 bg-transparent outline-none" />
          <button onClick={() => setOpen(false)} aria-label="Close search"><X size={18} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map(([label, href]) => (
            <button key={href} onClick={() => { setOpen(false); router.push(href); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-background">
              <Command size={16} className="text-brand-500" />
              {label}
            </button>
          ))}
          {!filtered.length && <p className="p-5 text-center text-sm text-muted">No matching ScottyWorld destinations.</p>}
        </div>
      </div>
    </div>
  );
}