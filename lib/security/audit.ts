import { db } from "../db";

export async function writeSecurityEvent(data: {
  userId?: string;
  event: string;
  metadata?: Record<string, unknown>;
}) {
  await db.securityEvent.create({
    data: {
      userId: data.userId,
      event: data.event,
      metadata: data.metadata ?? {},
    },
  });
}

export async function writeAuditLog(data: {
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      actorId: data.actorId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      metadata: data.metadata ?? {},
    },
  });
}