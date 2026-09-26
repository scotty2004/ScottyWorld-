import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { ensureAccountNumber, ensureReferralCode } from "@/lib/coins/service";

type GoogleTokenInfo = {
  aud: string;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  exp: string;
};

export class GoogleAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) { super(message); this.status = status; }
}

function slugifyUsername(seed: string) {
  return seed.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) || "scotty";
}

async function uniqueUsername(seed: string) {
  const base = slugifyUsername(seed);
  let candidate = base;
  let suffix = 0;
  // Small bounded loop — collisions on a fresh signup are rare.
  while (await db.user.findUnique({ where: { username: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}${suffix}`.slice(0, 30);
    if (suffix > 50) { candidate = `${base}${Date.now()}`.slice(0, 30); break; }
  }
  return candidate;
}

/**
 * Verifies a Google ID token (credential), finds / creates / links the ScottyWorld account and starts a session.
 * Shared by the redirect callback and the legacy popup endpoint.
 */
export async function signInWithGoogleCredential(credential: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new GoogleAuthError("Google sign-in is not configured.", 503);
  if (!credential) throw new GoogleAuthError("Missing Google credential.", 400);

  // Google verifies the signature and expiry for us.
  let verifyResponse: Response;
  try {
    verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  } catch {
    throw new GoogleAuthError("Couldn't reach Google to verify your sign-in. Please try again.", 504);
  }
  if (!verifyResponse.ok) throw new GoogleAuthError("Invalid Google credential.", 401);

  const info = (await verifyResponse.json()) as GoogleTokenInfo;
  if (info.aud !== clientId) throw new GoogleAuthError("Google credential audience mismatch. Check GOOGLE_CLIENT_ID.", 401);
  const exp = Number(info.exp);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) throw new GoogleAuthError("Google credential expired. Please try again.", 401);
  if (!info.email || (info.email_verified !== true && info.email_verified !== "true")) throw new GoogleAuthError("Google account email is not verified.", 401);

  const email = info.email.toLowerCase();
  let user = await db.user.findFirst({ where: { OR: [{ googleId: info.sub }, { email }] } });

  if (!user) {
    const username = await uniqueUsername(info.name || email.split("@")[0]);
    user = await db.user.create({
      data: { email, googleId: info.sub, displayName: info.name || email.split("@")[0], username, emailVerified: new Date(), profile: { create: {} } },
    });
    // same extras a normal sign-up gets: wallet number + referral code
    await ensureAccountNumber(user.id).catch(() => null);
    await ensureReferralCode(user.id, username).catch(() => null);
  } else if (!user.googleId) {
    // Existing email/password account signing in with Google for the first time — link instead of duplicating.
    user = await db.user.update({ where: { id: user.id }, data: { googleId: info.sub, emailVerified: user.emailVerified ?? new Date() } });
  } else if (!user.emailVerified) {
    user = await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  }

  await createSession(user.id);
  return user;
}
