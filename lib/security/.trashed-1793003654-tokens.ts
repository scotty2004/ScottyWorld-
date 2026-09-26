import { createHash, createHmac, randomBytes } from "crypto";

export function createRawToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

/**
 * Signs a stateless JWT-style token using JWT_SECRET. Used for
 * email-verification and password-reset links: the JWT itself carries an
 * expiry that's checked before ever touching the database, and the raw
 * token is additionally hashed and stored server-side so it can still be
 * revoked / consumed exactly once.
 */
export function signJwt(payload: Record<string, unknown>, expiresInSeconds: number) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_NOT_CONFIGURED");

  const header = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(body));
  const signature = base64url(
    createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest()
  );

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt<T = Record<string, unknown>>(token: string): T | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;

  const expected = base64url(
    createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest()
  );
  if (expected.length !== signature.length) return null;

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as T & { exp?: number };
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
