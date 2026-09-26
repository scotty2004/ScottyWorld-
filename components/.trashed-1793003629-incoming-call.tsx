"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar } from "./ui";
import { useRealtime, type Tick } from "./realtime";
import { api } from "@/lib/client";

/** Mounted once in the app shell. Shows a full-width banner the instant a RINGING call for this
 *  user shows up in the realtime tick, with Accept / Decline — like an incoming-call screen. */
export function IncomingCallBanner() {
  const router = useRouter();
  const [call, setCall] = useState<{ id: string; video: boolean; from: { username: string; displayName: string; avatarUrl: string | null } } | null>(null);
  const dismissed = useRef<Set<string>>(new Set());

  const onTick = useCallback((t: Tick) => {
    if (t.incomingCall && !dismissed.current.has(t.incomingCall.id)) setCall(t.incomingCall);
    else if (!t.incomingCall) setCall(null);
  }, []);
  useRealtime(onTick);

  if (!call) return null;

  async function decline() {
    if (!call) return;
    dismissed.current.add(call.id);
    try { await api(`/api/calls/${call.id}/action`, { method: "POST", json: { action: "decline" } }); } catch {}
    setCall(null);
  }
  function accept() {
    if (!call) return;
    dismissed.current.add(call.id);
    router.push(`/messages/${call.from.username}/call?id=${call.id}`);
    setCall(null);
  }

  return (
    <div className="fixed inset-x-3 top-3 z-[100] flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-float">
      <Avatar name={call.from.displayName} src={call.from.avatarUrl} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{call.from.displayName}</p>
        <p className="flex items-center gap-1 text-xs text-subtle">{call.video ? <Video size={13} /> : <Phone size={13} />} Incoming {call.video ? "video" : "voice"} call…</p>
      </div>
      <button onClick={decline} aria-label="Decline" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-500 text-white"><PhoneOff size={18} /></button>
      <button onClick={accept} aria-label="Accept" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"><Phone size={18} /></button>
    </div>
  );
}
