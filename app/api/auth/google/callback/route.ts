import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { GoogleAuthError, signInWithGoogleCredential } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

/** Public origin of the site (works behind proxies / Docker where request.url is an internal address). */
function siteOrigin(request: NextRequest) {
  const env = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) { try { return new URL(env).origin; } catch { /* fall through */ } }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

function back(request: NextRequest, path: string, error?: string) {
  const url = new URL(path, siteOrigin(request));
  if (error) url.searchParams.set("google_error", error); // a short code, never free text
  // 303 so the browser follows with a GET after Google's POST
  return NextResponse.redirect(url, 303);
}

/**
 * Google redirects the browser here (POST, form-encoded) after the user picks an account.
 * No popup and no postMessage, so it doesn't hang in mobile browsers.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`google-auth:${ip}`, 15, 60_000).allowed) return back(request, "/login", "rate");

  try {
    const form = await request.formData();
    const credential = String(form.get("credential") || "");
    const csrfBody = String(form.get("g_csrf_token") || "");
    const csrfCookie = request.cookies.get("g_csrf_token")?.value || "";
    // Google's double-submit CSRF check: the cookie and the body value must match.
    if (!csrfBody || !csrfCookie || csrfBody !== csrfCookie) {
      return back(request, "/login", "csrf");
    }
    await signInWithGoogleCredential(credential);
    return back(request, "/dashboard");
  } catch (err) {
    if (err instanceof GoogleAuthError) return back(request, "/login", err.status === 503 ? "config" : err.status === 504 ? "network" : "invalid");
    console.error("GOOGLE_CALLBACK_FAILED", (err as Error).message);
    return back(request, "/login", "failed");
  }
}

// Someone opened the callback URL directly
export async function GET(request: NextRequest) {
  return back(request, "/login");
}
