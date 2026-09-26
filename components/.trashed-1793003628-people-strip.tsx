"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, Skeleton } from "./ui";
import { api, compact, useApi } from "@/lib/client";
import { toast } from "./toast";

type Person = { username: string; displayName: string; avatarUrl: string | null; bio: string | null; followers: number };

export function PeopleYouMayKnow() {
  const { data, loading } = useApi<{ people: Person[] }>("/api/people");
  const [done, setDone] = useState<Record<string, boolean>>({});

  async function follow(u: string) {
    setDone((d) => ({ ...d, [u]: true }));
    try { await api(`/api/community/follow/${u}`, { method: "POST" }); } catch (e) { setDone((d) => ({ ...d, [u]: false })); toast((e as Error).message, "err"); }
  }

  if (loading) return <div className="flex gap-3 overflow-hidden">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-36 shrink-0" />)}</div>;
  if (!data?.people.length) return <p className="sw-card px-4 py-6 text-center text-sm text-subtle">No suggestions yet — more people are joining every day.</p>;

  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {data.people.map((p) => (
        <div key={p.username} className="sw-card flex w-36 shrink-0 flex-col items-center p-4 text-center">
          <Link href={`/u/${p.username}`} className="flex flex-col items-center">
            <Avatar name={p.displayName} src={p.avatarUrl} size={56} />
            <p className="mt-2 w-full truncate text-sm font-bold">{p.displayName}</p>
            <p className="w-full truncate text-xs text-subtle">@{p.username}</p>
          </Link>
          <p className="mt-1 text-[11px] text-subtle">{compact(p.followers)} followers</p>
          <button onClick={() => follow(p.username)} disabled={done[p.username]} className={`mt-3 w-full rounded-lg py-1.5 text-xs font-bold ${done[p.username] ? "bg-soft text-subtle" : "bg-brand-600 text-white"}`}>{done[p.username] ? "Following" : "Follow"}</button>
        </div>
      ))}
    </div>
  );
}
