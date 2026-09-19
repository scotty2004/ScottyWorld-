import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export async function writeAdminAudit(input: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: unknown;
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata as any,
    },
  });
}

export function can(roles: UserRole[], allowed: UserRole[]) {
  return roles.some((r) => allowed.includes(r));
}
