import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "../db";

const COOKIE_NAME = "scottyworld_session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);

  const h = await headers();
  await db.session.create({
    data: { userId, tokenHash, expiresAt, userAgent: h.get("user-agent")?.slice(0, 300) ?? null },
  });

  // A Secure cookie is silently dropped by the browser on plain http, which
  // makes login "succeed" and then bounce straight back to /login. Only mark
  // it Secure when the request really came in over https.
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const secure = proto ? proto === "https" : process.env.NODE_ENV === "production" && siteUrl.startsWith("https://");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { profile: true } } },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  // keep "last active" fresh without a write on every request
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    void db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }

  return session.user;
}

export async function getCurrentSessionId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, select: { id: true } });
  return s?.id ?? null;
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await db.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(COOKIE_NAME);
}
