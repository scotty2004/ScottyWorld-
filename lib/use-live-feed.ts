"use client";
import { useCallback, useState } from "react";
import { useRealtime, type Tick } from "@/components/realtime";

/** Counts new posts pushed from the server so the feed can show a "N new posts" pill. */
export function useNewPostsPill() {
  const [count, setCount] = useState(0);
  const onTick = useCallback((t: Tick) => { if (t.newPosts > 0) setCount((c) => c + t.newPosts); }, []);
  useRealtime(onTick);
  return { count, clear: () => setCount(0) };
}
