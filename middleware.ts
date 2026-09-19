import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/ai",
  "/bots",
  "/developer",
  "/academy",
  "/marketplace",
  "/community",
  "/coins",
  "/referrals",
  "/cloud",
  "/security",
  "/pro",
  "/admin",
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Security headers. CSP is intentionally report-friendly and avoids
  // breaking existing third-party integrations until they are configured.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
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
  const isProtected = protectedPrefixes.some((prefix) =>
    path === prefix || path.startsWith(`${prefix}/`)
  );
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
