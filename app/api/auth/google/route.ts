import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";

type GoogleTokenInfo = {
  aud: string;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  exp: string;
};

function slugifyUsername(seed: string) {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24) || "scotty";
  return base;
}

async function uniqueUsername(seed: string) {
  const base = slugifyUsername(seed);
  let candidate = base;
  let suffix = 0;

  // Small bounded loop — collisions on a fresh signup are rare, and this
  // never runs unbounded against user input.
  while (await db.user.findUnique({ where: { username: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}${suffix}`.slice(0, 30);
    if (suffix > 50) {
      candidate = `${base}${Date.now()}`.slice(0, 30);
      break;
    }
  }

  return candidate;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`google-auth:${ip}`, 15, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 503 });

  try {
    const { credential } = await request.json();
    if (typeof credential !== "string" || !credential) {
      return NextResponse.json({ error: "Missing Google credential." }, { status: 400 });
    }

    // Verify the ID token's signature and claims with Google directly,
    // rather than decoding it locally — this avoids having to fetch and
    // cache Google's JWKS ourselves for a login path that only needs to
    // run occasionally.
    const verifyResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: "Invalid Google credential." }, { status: 401 });
    }

    const info = (await verifyResponse.json()) as GoogleTokenInfo;

    if (info.aud !== clientId) {
      return NextResponse.json({ error: "Google credential audience mismatch." }, { status: 401 });
    }
    const exp = Number(info.exp);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: "Google credential expired." }, { status: 401 });
    }
    if (!info.email || (info.email_verified !== true && info.email_verified !== "true")) {
      return NextResponse.json({ error: "Google account email is not verified." }, { status: 401 });
    }

    const email = info.email.toLowerCase();

    let user = await db.user.findFirst({
      where: { OR: [{ googleId: info.sub }, { email }] },
    });

    if (!user) {
      const username = await uniqueUsername(info.name || email.split("@")[0]);
      user = await db.user.create({
        data: {
          email,
          googleId: info.sub,
          displayName: info.name || email.split("@")[0],
          username,
          emailVerified: new Date(),
          profile: { create: {} },
        },
      });
    } else if (!user.googleId) {
      // Existing email/password account signing in with Google for the
      // first time — link the accounts instead of creating a duplicate.
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId: info.sub, emailVerified: user.emailVerified ?? new Date() },
      });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("GOOGLE_AUTH_FAILED", (err as Error).message);
    return NextResponse.json({ error: "Unable to sign in with Google." }, { status: 502 });
  }
}
