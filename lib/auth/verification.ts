import { db } from "../db";
import { hashToken, signJwt, verifyJwt } from "../security/tokens";

export async function createEmailVerification(userId: string) {
  const raw = signJwt({ userId, purpose: "verify-email" }, 24 * 60 * 60);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.emailVerificationToken.deleteMany({ where: { userId } });
  await db.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return raw;
}

export async function verifyEmailToken(raw: string) {
  const claims = verifyJwt<{ userId: string; purpose: string }>(raw);
  if (!claims || claims.purpose !== "verify-email" || !claims.userId) return false;

  const tokenHash = hashToken(raw);
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.userId !== claims.userId || record.expiresAt < new Date()) return false;

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    db.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);

  return true;
}
