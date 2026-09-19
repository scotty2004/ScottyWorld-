 "use client";

import { useEffect, useState } from "react";

export default function FAQPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { fetch("/api/faq").then(r => r.json()).then(d => setItems(d.items || [])); }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-semibold">FAQ</h1>
      <div className="mt-6 space-y-3">
        {items.map(item => (
          <details key={item.id} className="rounded-2xl border bg-card p-5">
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
        {!items.length && <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">FAQ content can be managed from the Control Center.</div>}
      </div>
    </main>
  );
}
