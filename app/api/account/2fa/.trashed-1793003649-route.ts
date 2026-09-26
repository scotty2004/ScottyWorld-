import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { generateSecret, otpauthUri, verifyTotp } from "@/lib/security/totp";
import { verifyPassword } from "@/lib/auth/password";

/** POST {action:"setup"} → secret + otpauth URI. POST {action:"enable", code} → turns 2FA on. POST {action:"disable", password} */
export async function POST(req: Request) {
  const user = await me();
  if (!user) return unauth();
  const body = await req.json().catch(() => ({}));

  if (body.action === "setup") {
    if (user.twoFactorEnabled) return bad("Two-factor authentication is already on.");
    const secret = generateSecret();
    await db.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });
    return NextResponse.json({ secret, uri: otpauthUri(secret, user.email) });
  }
  if (body.action === "enable") {
    if (!user.twoFactorSecret) return bad("Start setup first.");
    if (!verifyTotp(user.twoFactorSecret, String(body.code || ""))) return bad("That code isn't right. Check your authenticator app.");
    await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    return NextResponse.json({ enabled: true });
  }
  if (body.action === "disable") {
    if (!user.passwordHash || !(await verifyPassword(String(body.password || ""), user.passwordHash))) return bad("Password is incorrect.", 401);
    await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    return NextResponse.json({ enabled: false });
  }
  return bad("Unknown action.");
}
