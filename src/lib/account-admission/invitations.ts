import type { PrismaClient, UserRole } from '@prisma/client';
import { PASSWORD_HASH_ALGORITHM, hashPassword, validatePasswordStrength } from './password';
import { normalizeEmail } from './policy';
import { createOpaqueToken, hashOpaqueToken } from './token';
import { recordAuditLog } from './audit';

export const DEFAULT_INVITATION_TTL_HOURS = 72;

export type IssueInvitationInput = {
  email: string;
  role?: UserRole;
  createdByUserId?: string | null;
  expiresInHours?: number;
  now?: Date;
  ipAddress?: string | null;
};

export type IssuedInvitation = {
  invitation: {
    id: string;
    email: string;
    normalizedEmail: string;
    role: UserRole;
    expiresAt: Date;
    createdAt: Date;
  };
  rawToken: string;
};

export type InvitationLookupResult =
  | {
      status: 'valid';
      invitation: {
        id: string;
        email: string;
        normalizedEmail: string;
        role: UserRole;
        expiresAt: Date;
      };
    }
  | { status: 'invalid' | 'expired' | 'revoked' | 'accepted' };

function isValidEmailAddress(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateDefaultUsername(email: string, name?: string | null): string {
  const base = (name || email.split('@')[0] || 'member')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 18) || 'member';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${suffix}`;
}

export async function issueAccountInvitation(
  prisma: PrismaClient,
  input: IssueInvitationInput
): Promise<IssuedInvitation> {
  const now = input.now ?? new Date();
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail || !isValidEmailAddress(normalizedEmail)) {
    throw new Error('A valid email address is required to issue an invitation.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, admittedAt: true, disabledAt: true },
  });

  if (existingUser?.admittedAt && !existingUser.disabledAt) {
    throw new Error('This email address already belongs to an active admitted account.');
  }

  const ttlHours = Math.min(Math.max(input.expiresInHours ?? DEFAULT_INVITATION_TTL_HOURS, 1), 24 * 30);
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
  const rawToken = createOpaqueToken(32);
  const tokenHash = hashOpaqueToken(rawToken);
  const role: UserRole = input.role ?? 'MEMBER';

  const invitation = await prisma.$transaction(async (tx) => {
    await tx.accountInvitation.updateMany({
      where: {
        normalizedEmail,
        acceptedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        revokedByUserId: input.createdByUserId ?? null,
      },
    });

    return tx.accountInvitation.create({
      data: {
        email: normalizedEmail,
        normalizedEmail,
        role,
        tokenHash,
        expiresAt,
        createdByUserId: input.createdByUserId ?? null,
      },
      select: {
        id: true,
        email: true,
        normalizedEmail: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  });

  await recordAuditLog(prisma, {
    action: 'INVITATION_ISSUED',
    actorUserId: input.createdByUserId ?? null,
    entityType: 'AccountInvitation',
    entityId: invitation.id,
    ipAddress: input.ipAddress ?? null,
    metadata: {
      email: invitation.normalizedEmail,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
    },
  });

  return { invitation, rawToken };
}

export async function rotateAccountInvitation(
  prisma: PrismaClient,
  input: {
    invitationId: string;
    actorUserId?: string | null;
    expiresInHours?: number;
    now?: Date;
    ipAddress?: string | null;
  }
): Promise<IssuedInvitation> {
  const now = input.now ?? new Date();
  const existing = await prisma.accountInvitation.findUnique({
    where: { id: input.invitationId },
  });
  if (!existing) {
    throw new Error('Invitation not found.');
  }
  if (existing.acceptedAt) {
    throw new Error('Accepted invitations cannot be rotated.');
  }

  const ttlHours = Math.min(Math.max(input.expiresInHours ?? DEFAULT_INVITATION_TTL_HOURS, 1), 24 * 30);
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
  const rawToken = createOpaqueToken(32);
  const tokenHash = hashOpaqueToken(rawToken);

  const invitation = await prisma.$transaction(async (tx) => {
    await tx.accountInvitation.update({
      where: { id: existing.id },
      data: {
        revokedAt: now,
        revokedByUserId: input.actorUserId ?? null,
      },
    });

    return tx.accountInvitation.create({
      data: {
        email: existing.email,
        normalizedEmail: existing.normalizedEmail,
        role: existing.role,
        tokenHash,
        expiresAt,
        createdByUserId: input.actorUserId ?? existing.createdByUserId ?? null,
      },
      select: {
        id: true,
        email: true,
        normalizedEmail: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  });

  await recordAuditLog(prisma, {
    action: 'INVITATION_ROTATED',
    actorUserId: input.actorUserId ?? null,
    entityType: 'AccountInvitation',
    entityId: invitation.id,
    ipAddress: input.ipAddress ?? null,
    metadata: {
      previousInvitationId: existing.id,
      email: invitation.normalizedEmail,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
    },
  });

  return { invitation, rawToken };
}

export async function revokeAccountInvitation(
  prisma: PrismaClient,
  input: {
    invitationId: string;
    revokedByUserId?: string | null;
    now?: Date;
    ipAddress?: string | null;
  }
) {
  const now = input.now ?? new Date();
  const existing = await prisma.accountInvitation.findUnique({
    where: { id: input.invitationId },
  });
  if (!existing) {
    throw new Error('Invitation not found.');
  }
  if (existing.acceptedAt) {
    throw new Error('Accepted invitations cannot be revoked.');
  }

  const updated = await prisma.accountInvitation.update({
    where: { id: input.invitationId },
    data: {
      revokedAt: existing.revokedAt ?? now,
      revokedByUserId: input.revokedByUserId ?? existing.revokedByUserId ?? null,
    },
  });

  await recordAuditLog(prisma, {
    action: 'INVITATION_REVOKED',
    actorUserId: input.revokedByUserId ?? null,
    entityType: 'AccountInvitation',
    entityId: updated.id,
    ipAddress: input.ipAddress ?? null,
    metadata: {
      email: updated.normalizedEmail,
      role: updated.role,
    },
  });

  return updated;
}

export async function inspectAccountInvitationToken(
  prisma: PrismaClient,
  rawToken: string,
  now: Date = new Date()
): Promise<InvitationLookupResult> {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length < 16) {
    return { status: 'invalid' };
  }

  const tokenHash = hashOpaqueToken(rawToken);
  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      normalizedEmail: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
    },
  });

  if (!invitation) return { status: 'invalid' };
  if (invitation.revokedAt) return { status: 'revoked' };
  if (invitation.acceptedAt) return { status: 'accepted' };
  if (invitation.expiresAt.getTime() <= now.getTime()) return { status: 'expired' };

  return {
    status: 'valid',
    invitation: {
      id: invitation.id,
      email: invitation.email,
      normalizedEmail: invitation.normalizedEmail,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    },
  };
}

export async function acceptAccountInvitationWithPassword(
  prisma: PrismaClient,
  input: {
    rawToken: string;
    name?: string | null;
    username?: string | null;
    password: string;
    now?: Date;
    ipAddress?: string | null;
  }
) {
  const now = input.now ?? new Date();
  const passwordError = validatePasswordStrength(input.password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const lookup = await inspectAccountInvitationToken(prisma, input.rawToken, now);
  if (lookup.status !== 'valid') {
    throw new Error(`Invitation is ${lookup.status}.`);
  }

  const passwordHash = await hashPassword(input.password);
  const trimmedName = (input.name ?? '').trim();
  const desiredUsername = (input.username ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  const user = await prisma.$transaction(async (tx) => {
    const consumeResult = await tx.accountInvitation.updateMany({
      where: {
        id: lookup.invitation.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        acceptedAt: now,
      },
    });

    if (consumeResult.count !== 1) {
      throw new Error('Invitation is no longer valid.');
    }

    const existingUser = await tx.user.findUnique({
      where: { email: lookup.invitation.normalizedEmail },
    });

    const displayName =
      trimmedName ||
      existingUser?.name ||
      lookup.invitation.normalizedEmail.split('@')[0] ||
      'Member';

    let finalUsername = existingUser?.username || desiredUsername;
    if (finalUsername) {
      const conflict = await tx.user.findUnique({ where: { username: finalUsername } });
      if (conflict && conflict.id !== existingUser?.id) {
        finalUsername = generateDefaultUsername(lookup.invitation.normalizedEmail, displayName);
      }
    } else {
      finalUsername = generateDefaultUsername(lookup.invitation.normalizedEmail, displayName);
    }

    const admittedUser = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: displayName,
            username: finalUsername,
            emailVerified: existingUser.emailVerified ?? now,
            role: lookup.invitation.role,
            admissionSource: 'INVITATION',
            invitedAt: existingUser.invitedAt ?? now,
            admittedAt: now,
            disabledAt: null,
          },
        })
      : await tx.user.create({
          data: {
            email: lookup.invitation.normalizedEmail,
            name: displayName,
            username: finalUsername,
            emailVerified: now,
            role: lookup.invitation.role,
            admissionSource: 'INVITATION',
            invitedAt: now,
            admittedAt: now,
          },
        });

    await tx.passwordCredential.upsert({
      where: { userId: admittedUser.id },
      update: {
        passwordHash,
        algorithm: PASSWORD_HASH_ALGORITHM,
      },
      create: {
        userId: admittedUser.id,
        passwordHash,
        algorithm: PASSWORD_HASH_ALGORITHM,
      },
    });

    await tx.emailPreference.upsert({
      where: { userId: admittedUser.id },
      update: {},
      create: {
        userId: admittedUser.id,
        dailyDigest: true,
        weeklyTopPapers: true,
        productAlerts: false,
      },
    });

    await tx.accountInvitation.update({
      where: { id: lookup.invitation.id },
      data: {
        acceptedByUserId: admittedUser.id,
      },
    });

    return admittedUser;
  });

  await recordAuditLog(prisma, {
    action: 'INVITATION_ACCEPTED',
    actorUserId: user.id,
    targetUserId: user.id,
    entityType: 'AccountInvitation',
    entityId: lookup.invitation.id,
    ipAddress: input.ipAddress ?? null,
    metadata: {
      email: user.email,
      role: user.role,
    },
  });

  return user;
}

export async function bootstrapAdminAccount(
  prisma: PrismaClient,
  input: {
    email: string;
    name?: string | null;
    password: string;
    role?: UserRole;
    now?: Date;
  }
) {
  const now = input.now ?? new Date();
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail || !isValidEmailAddress(normalizedEmail)) {
    throw new Error('A valid administrator email address is required.');
  }

  const passwordError = validatePasswordStrength(input.password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const passwordHash = await hashPassword(input.password);
  const displayName = (input.name ?? '').trim() || normalizedEmail.split('@')[0] || 'Administrator';
  const role: UserRole = input.role ?? 'ADMIN';

  const user = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: normalizedEmail } });
    const username = existing?.username || generateDefaultUsername(normalizedEmail, displayName);

    const upserted = await tx.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: displayName,
        emailVerified: now,
        role,
        admissionSource: 'BOOTSTRAP',
        invitedAt: now,
        admittedAt: now,
        disabledAt: null,
      },
      create: {
        email: normalizedEmail,
        name: displayName,
        username,
        emailVerified: now,
        role,
        admissionSource: 'BOOTSTRAP',
        invitedAt: now,
        admittedAt: now,
      },
    });

    await tx.passwordCredential.upsert({
      where: { userId: upserted.id },
      update: {
        passwordHash,
        algorithm: PASSWORD_HASH_ALGORITHM,
      },
      create: {
        userId: upserted.id,
        passwordHash,
        algorithm: PASSWORD_HASH_ALGORITHM,
      },
    });

    await tx.emailPreference.upsert({
      where: { userId: upserted.id },
      update: {},
      create: {
        userId: upserted.id,
        dailyDigest: true,
        weeklyTopPapers: true,
        productAlerts: false,
      },
    });

    return upserted;
  });

  await recordAuditLog(prisma, {
    action: 'ADMIN_BOOTSTRAPPED',
    actorUserId: user.id,
    targetUserId: user.id,
    entityType: 'User',
    entityId: user.id,
    metadata: {
      email: user.email,
      role: user.role,
    },
  });

  return user;
}

export async function updateAccountRoleOrStatus(
  prisma: PrismaClient,
  input: {
    actorUserId: string;
    targetUserId: string;
    role?: UserRole;
    disabled?: boolean;
    now?: Date;
    ipAddress?: string | null;
  }
) {
  const now = input.now ?? new Date();
  const target = await prisma.user.findUnique({
    where: { id: input.targetUserId },
  });
  if (!target) {
    throw new Error('Target user not found.');
  }

  if (input.actorUserId === input.targetUserId && input.disabled === true) {
    throw new Error('Administrators cannot disable their own account.');
  }
  if (input.actorUserId === input.targetUserId && input.role && input.role !== 'ADMIN') {
    throw new Error('Administrators cannot demote their own account.');
  }

  const nextRole = input.role ?? target.role;
  const nextDisabledAt =
    input.disabled === undefined ? target.disabledAt : input.disabled ? now : null;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: target.id },
      data: {
        role: nextRole,
        disabledAt: nextDisabledAt,
        sessionInvalidAfter: now,
      },
    });

    if (nextDisabledAt) {
      await tx.session.deleteMany({ where: { userId: target.id } });
    }

    return user;
  });

  if (input.role && input.role !== target.role) {
    await recordAuditLog(prisma, {
      action: 'USER_ROLE_UPDATED',
      actorUserId: input.actorUserId,
      targetUserId: target.id,
      entityType: 'User',
      entityId: target.id,
      ipAddress: input.ipAddress ?? null,
      metadata: {
        previousRole: target.role,
        newRole: nextRole,
      },
    });
  }

  if (input.disabled !== undefined && Boolean(target.disabledAt) !== Boolean(nextDisabledAt)) {
    await recordAuditLog(prisma, {
      action: 'USER_STATUS_UPDATED',
      actorUserId: input.actorUserId,
      targetUserId: target.id,
      entityType: 'User',
      entityId: target.id,
      ipAddress: input.ipAddress ?? null,
      metadata: {
        disabled: Boolean(nextDisabledAt),
      },
    });
  }

  return updated;
}
