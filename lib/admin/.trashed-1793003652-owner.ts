/**
 * The ONE account allowed into the admin Control Center. Hardcoded on purpose:
 * no role, database flag or setting can grant admin access to anyone else.
 * The email must also be verified (Google sign-in verifies it automatically), so nobody can
 * claim this address by simply registering with it.
 */
export const OWNER_EMAIL = "maposacourage41@gmail.com";

export function isOwnerAccount(user: { email: string; emailVerified?: Date | string | null } | null | undefined) {
  return Boolean(user && user.emailVerified && user.email.trim().toLowerCase() === OWNER_EMAIL);
}
