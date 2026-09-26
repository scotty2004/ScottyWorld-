"use client";
import type { ReactNode } from "react";

export function AdminHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-extrabold">{title}</h1>{sub && <p className="text-sm text-subtle">{sub}</p>}</div>{right}</div>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="sw-card overflow-x-auto">
      <table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-subtle">{head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">{children}</tbody></table>
    </div>
  );
}
export const Td = ({ children, className = "" }: { children: ReactNode; className?: string }) => <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
