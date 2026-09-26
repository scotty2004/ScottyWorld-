import { UserRole } from "@prisma/client";
import { getCurrentUser } from "./session";
import { isOwnerAccount } from "@/lib/admin/owner";

export type Permission =
  | "admin.dashboard"
  | "users.manage"
  | "bots.manage"
  | "marketplace.manage"
  | "academy.manage"
  | "news.manage"
  | "coins.manage"
  | "payments.manage"
  | "reports.manage"
  | "security.manage";

const permissions: Record<UserRole, Permission[]> = {
  USER: [],
  SUPER_ADMIN: [
    "admin.dashboard", "users.manage", "bots.manage", "marketplace.manage",
    "academy.manage", "news.manage", "coins.manage", "payments.manage",
    "reports.manage", "security.manage",
  ],
  ADMIN: ["admin.dashboard", "users.manage", "bots.manage", "marketplace.manage", "academy.manage", "news.manage", "reports.manage", "security.manage"],
  MODERATOR: ["admin.dashboard", "reports.manage"],
  SUPPORT: ["admin.dashboard", "users.manage"],
  CONTENT_MANAGER: ["admin.dashboard", "academy.manage", "news.manage"],
  FINANCE_MANAGER: ["admin.dashboard", "coins.manage", "payments.manage"],
};

export function hasPermission(role: UserRole, permission: Permission) {
  return permissions[role]?.includes(permission) ?? false;
}

export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  // admin permissions belong to the hardcoded owner account only
  if (!user || !isOwnerAccount(user)) return null;
  return user;
}
