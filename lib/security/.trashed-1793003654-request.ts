import { headers } from "next/headers";
import { rateLimit } from "@/lib/security/rate-limit";

export async function requestKey(prefix: string) {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = h.get("x-real-ip");
  return `${prefix}:${forwarded || real || "unknown"}`;
}

export async function enforceRateLimit(prefix: string, limit = 60, windowMs = 60_000) {
  const result = rateLimit(await requestKey(prefix), limit, windowMs);
  if (!result.allowed) {
    throw new Error("RATE_LIMITED");
  }
  return result;
}
