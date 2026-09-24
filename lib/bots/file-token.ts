import crypto from "crypto";

const TTL_MS = 10 * 60_000; // 10 minutes — just long enough for the panel to fetch the file right after pairing starts

function secret() {
  // Reuses the runtime secret so there's nothing extra to configure; falls back to a dev-only value.
  return process.env.BOT_RUNTIME_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-insecure-secret";
}

export function signBotFileToken(botId: string): string {
  const expires = Date.now() + TTL_MS;
  const payload = `${botId}.${expires}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyBotFileToken(botId: string, token: string | null): boolean {
  if (!token) return false;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return false;
  let payload: string;
  try { payload = Buffer.from(encoded, "base64url").toString("utf8"); } catch { return false; }
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  const [id, expiresStr] = payload.split(".");
  return id === botId && Number(expiresStr) > Date.now();
}
