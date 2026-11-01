import type { PrismaClient } from '@prisma/client';

export type AuditAction =
  | 'ADMIN_BOOTSTRAPPED'
  | 'INVITATION_ISSUED'
  | 'INVITATION_ROTATED'
  | 'INVITATION_REVOKED'
  | 'INVITATION_ACCEPTED'
  | 'LOGIN_SUCCEEDED'
  | 'LOGIN_REJECTED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'USER_ROLE_UPDATED'
  | 'USER_STATUS_UPDATED';

export type RecordAuditInput = {
  action: AuditAction;
  actorUserId?: string | null;
  targetUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAuditLog(
  prisma: Pick<PrismaClient, 'auditLog'>,
  input: RecordAuditInput
) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId ?? null,
        targetUserId: input.targetUserId ?? null,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        ipAddress: input.ipAddress ?? null,
        metadataJson: JSON.stringify(input.metadata ?? {}),
      },
    });
  } catch {
    return null;
  }
}
