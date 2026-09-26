import crypto from "node:crypto";

export function hashIdentifier(value: string | null | undefined) {
  if (!value) return null;
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}
