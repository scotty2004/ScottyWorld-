import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Everything is private by default. Only these paths work without a session.
const PUBLIC_EXACT = new Set(["/", "/login", "/register", "/forgot-password", "/verify-email", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/sw.js", "/security.txt"]);
const PUBLIC_PREFIX = ["/api/", "/r/", "/reset", "/_next/", "/icon", "/apple-icon"];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Security headers. CSP is intentionally report-friendly and avoids
  // breaking existing third-party integrations until they are configured.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // "same-origin" breaks the Google sign-in popup (it can't hand the credential back)
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // The actual user/role authorization remains server-side in layouts/API
  // handlers. This only prevents accidental unauthenticated navigation when
  // no session cookie exists.
  const isProtected = !PUBLIC_EXACT.has(path) && !PUBLIC_PREFIX.some((p) => path.startsWith(p));
  if (isProtected && !request.cookies.get("scottyworld_session")?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
