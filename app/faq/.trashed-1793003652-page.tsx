"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Search } from "lucide-react";
import { Chips, Empty, ListSkeleton, Page, SubHeader } from "@/components/ui";
import { useApi } from "@/lib/client";

type Item = { id: string; question: string; answer: string; category: string | null };

export default function FaqPage() {
  const { data, loading } = useApi<{ items: Item[] }>("/api/faq");
  const [q, setQ] = useState(""); const [cat, setCat] = useState("all"); const [open, setOpen] = useState<string | null>(null);
  const items = data?.items ?? [];
  const cats = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))] as string[], [items]);
  const shown = items.filter((i) => (cat === "all" || i.category === cat) && (!q || (i.question + i.answer).toLowerCase().includes(q.toLowerCase())));

  return (
    <Page>
      <SubHeader title="FAQ" backHref="/support" />
      <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles…" className="sw-input !pl-11" /></div>
      {cats.length > 0 && <div className="mt-3"><Chips items={[{ id: "all", label: "All" }, ...cats.map((c) => ({ id: c, label: c }))]} value={cat} onChange={setCat} /></div>}
      <div className="mt-4">
        {loading ? <ListSkeleton /> : shown.length === 0 ? <Empty icon={<HelpCircle size={26} />} title="No answers found" text="Try different words, or contact support." action={<Link href="/support" className="sw-btn">Contact support</Link>} /> : (
          <div className="sw-card divide-y divide-border overflow-hidden">
            {shown.map((i) => (
              <div key={i.id}>
                <button onClick={() => setOpen(open === i.id ? null : i.id)} className="flex w-full items-center gap-3 px-4 py-4 text-left"><span className="flex-1 font-semibold">{i.question}</span><ChevronDown size={18} className={`shrink-0 text-subtle transition ${open === i.id ? "rotate-180" : ""}`} /></button>
                {open === i.id && <p className="whitespace-pre-wrap px-4 pb-4 text-[14.5px] leading-relaxed text-subtle">{i.answer}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-sm text-subtle">Still need help? <Link href="/support" className="font-bold text-brand-600">Contact support</Link></p>
    </Page>
  );
}
