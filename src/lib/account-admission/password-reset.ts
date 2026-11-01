import type { PrismaClient } from '@prisma/client';
import { PASSWORD_HASH_ALGORITHM, hashPassword, validatePasswordStrength, verifyPassword } from './password';
import { evaluateLoginEligibility, normalizeEmail } from './policy';
import { createOpaqueToken, hashOpaqueToken } from './token';
import { recordAuditLog } from './audit';

export const PASSWORD_RESET_TTL_MINUTES = 60;

export async function issuePasswordReset(
  prisma: PrismaClient,
  email: string,
  now = new Date(),
  ipAddress?: string | null
): Promise<{ email: string; rawToken: string; expiresAt: Date } | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, admittedAt: true, disabledAt: true },
  });
  const eligibility = evaluateLoginEligibility(user, now);
  if (!user || !user.email || !eligibility.allowed) {
    return null;
  }

  const rawToken = createOpaqueToken(32);
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

  const created = await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    });
    return tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  await recordAuditLog(prisma, {
    action: 'PASSWORD_RESET_REQUESTED',
    actorUserId: user.id,
    targetUserId: user.id,
    entityType: 'PasswordResetToken',
    entityId: created.id,
    ipAddress: ipAddress ?? null,
    metadata: { email: user.email },
  });

  return { email: user.email, rawToken, expiresAt };
}

export async function completePasswordReset(
  prisma: PrismaClient,
  rawToken: string,
  newPassword: string,
  now = new Date(),
  ipAddress?: string | null
): Promise<void> {
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    throw new Error(passwordError);
  }
  if (!rawToken || rawToken.trim().length < 16) {
    throw new Error('Password reset link is invalid or expired.');
  }

  const tokenHash = hashOpaqueToken(rawToken);
  const passwordHash = await hashPassword(newPassword);

  const userId = await prisma.$transaction(async (tx) => {
    const resetToken = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, admittedAt: true, disabledAt: true },
        },
      },
    });
    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= now.getTime() ||
      !evaluateLoginEligibility(resetToken.user, now).allowed
    ) {
      throw new Error('Password reset link is invalid or expired.');
    }

    const consumed = await tx.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) {
      throw new Error('Password reset link is invalid or expired.');
    }

    await tx.passwordCredential.upsert({
      where: { userId: resetToken.userId },
      update: { passwordHash, algorithm: PASSWORD_HASH_ALGORITHM },
      create: { userId: resetToken.userId, passwordHash, algorithm: PASSWORD_HASH_ALGORITHM },
    });

    await tx.user.update({
      where: { id: resetToken.userId },
      data: { sessionInvalidAfter: now },
    });

    await tx.session.deleteMany({
      where: { userId: resetToken.userId },
    });

    return resetToken.userId;
  });

  await recordAuditLog(prisma, {
    action: 'PASSWORD_RESET_COMPLETED',
    actorUserId: userId,
    targetUserId: userId,
    entityType: 'User',
    entityId: userId,
    ipAddress: ipAddress ?? null,
  });
}

export async function changeAccountPassword(
  prisma: PrismaClient,
  input: {
    userId: string;
    currentPassword?: string;
    newPassword: string;
    now?: Date;
    ipAddress?: string | null;
  }
): Promise<void> {
  const now = input.now ?? new Date();
  const passwordError = validatePasswordStrength(input.newPassword);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    include: { passwordCredential: true },
  });
  if (!user || !evaluateLoginEligibility(user, now).allowed) {
    throw new Error('Account is not eligible to change password.');
  }

  if (user.passwordCredential) {
    if (!input.currentPassword) {
      throw new Error('Current password is required.');
    }
    const ok = await verifyPassword(input.currentPassword, user.passwordCredential.passwordHash);
    if (!ok) {
      throw new Error('Current password is incorrect.');
    }
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction([
    prisma.passwordCredential.upsert({
      where: { userId: user.id },
      update: { passwordHash, algorithm: PASSWORD_HASH_ALGORITHM },
      create: { userId: user.id, passwordHash, algorithm: PASSWORD_HASH_ALGORITHM },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { sessionInvalidAfter: now },
    }),
  ]);

  await recordAuditLog(prisma, {
    action: 'PASSWORD_CHANGED',
    actorUserId: user.id,
    targetUserId: user.id,
    entityType: 'User',
    entityId: user.id,
    ipAddress: input.ipAddress ?? null,
  });
}
