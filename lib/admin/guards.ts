import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

export const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "SUPPORT",
  "CONTENT_MANAGER",
  "FINANCE_MANAGER",
];

export async function requireAdmin(roles: UserRole[] = ADMIN_ROLES) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) {
    throw new Error("ADMIN_FORBIDDEN");
  }
  return user;
}
