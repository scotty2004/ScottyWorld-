import { db } from "../db";
import { hashToken, signJwt, verifyJwt } from "../security/tokens";

export async function createPasswordReset(userId: string) {
  const raw = signJwt({ userId, purpose: "password-reset" }, 30 * 60);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.passwordResetToken.deleteMany({ where: { userId } });
  await db.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return raw;
}

export async function consumePasswordReset(raw: string) {
  const claims = verifyJwt<{ userId: string; purpose: string }>(raw);
  if (!claims || claims.purpose !== "password-reset" || !claims.userId) return null;

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });

  if (!record || record.userId !== claims.userId || record.expiresAt < new Date()) return null;

  await db.passwordResetToken.delete({ where: { id: record.id } });
  return record.userId;
}
