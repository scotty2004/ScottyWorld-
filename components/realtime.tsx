"use client";
import { useEffect, useSyncExternalStore } from "react";

export type Tick = { newPosts: number; commentPostIds: string[]; likePostIds: string[]; dmFrom: string[]; unreadDm: number; unreadNotif: number; incomingCall?: { id: string; video: boolean; from: { username: string; displayName: string; avatarUrl: string | null } } | null };
type Listener = (t: Tick) => void;

let es: EventSource | null = null;
let state = { unreadDm: 0, unreadNotif: 0, connected: false };
const stateSubs = new Set<() => void>();
const listeners = new Set<Listener>();

function emit() { stateSubs.forEach((f) => f()); }

function connect() {
  if (es || typeof window === "undefined") return;
  es = new EventSource("/api/realtime");
  es.addEventListener("tick", (e) => {
    const t = JSON.parse((e as MessageEvent).data) as Tick;
    if (t.unreadDm !== state.unreadDm || t.unreadNotif !== state.unreadNotif || !state.connected) {
      state = { unreadDm: t.unreadDm, unreadNotif: t.unreadNotif, connected: true };
      emit();
    }
    listeners.forEach((l) => l(t));
  });
  es.onerror = () => { /* EventSource reconnects on its own after the server recycles the stream */ };
}

/** Live badges (messages / notifications). Mount once in the shell. */
export function useRealtimeState() {
  useEffect(() => { connect(); }, []);
  return useSyncExternalStore(
    (cb) => { stateSubs.add(cb); return () => stateSubs.delete(cb); },
    () => state,
    () => state,
  );
}

/** Subscribe to every live tick (new posts, comment/like activity, incoming DMs). */
export function useRealtime(onTick: Listener) {
  useEffect(() => {
    connect();
    listeners.add(onTick);
    return () => { listeners.delete(onTick); };
  }, [onTick]);
}

export function setUnread(partial: Partial<typeof state>) { state = { ...state, ...partial }; emit(); }
