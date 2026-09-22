import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { isOwnerAccount } from "@/lib/admin/owner";

export const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "SUPPORT",
  "CONTENT_MANAGER",
  "FINANCE_MANAGER",
];

/**
 * Admin access is limited to the hardcoded owner account (see lib/admin/owner.ts).
 * The `roles` argument is kept so existing callers still compile, but it no longer widens access.
 */
export async function requireAdmin(_roles: UserRole[] = ADMIN_ROLES) {
  const user = await getCurrentUser();
  if (!user || !isOwnerAccount(user)) {
    throw new Error("ADMIN_FORBIDDEN");
  }
  return user;
}
