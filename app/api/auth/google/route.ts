import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { GoogleAuthError, signInWithGoogleCredential } from "@/lib/auth/google";

// Popup-style sign-in (credential posted as JSON). The buttons now use the redirect flow in
// /api/auth/google/callback, which is more reliable on phones; this stays for compatibility.
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`google-auth:${ip}`, 15, 60_000).allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { credential } = await request.json().catch(() => ({ credential: "" }));
    await signInWithGoogleCredential(typeof credential === "string" ? credential : "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GoogleAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GOOGLE_AUTH_FAILED", (err as Error).message);
    return NextResponse.json({ error: "Unable to sign in with Google." }, { status: 502 });
  }
}
