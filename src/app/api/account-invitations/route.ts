import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { issueAccountInvitation } from '@/lib/account-admission';
import {
  clientIpKey,
  consumeRateLimit,
  jsonError,
  requireAdminUser,
  verifyRequestOrigin,
} from '@/lib/api';

const VALID_ROLES = new Set<UserRole>(['ADMIN', 'OPERATOR', 'MEMBER', 'VIEWER']);

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const [invitations, users, auditLogs] = await Promise.all([
    prisma.accountInvitation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        normalizedEmail: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        createdAt: true,
        createdByUser: { select: { id: true, email: true, name: true } },
        acceptedByUser: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        admissionSource: true,
        invitedAt: true,
        admittedAt: true,
        disabledAt: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        actorUser: { select: { id: true, email: true, name: true } },
        targetUser: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    invitations,
    users,
    auditLogs,
  });
}

export async function POST(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const ip = clientIpKey(req);
  if (!consumeRateLimit(`invite-issue:${auth.user.id}`, 30, 15 * 60_000)) {
    return jsonError('Rate limit exceeded for issuing invitations.', 429);
  }

  try {
    const body = (await req.json()) as {
      email?: string;
      role?: UserRole;
      expiresInHours?: number;
    };
    const role = body.role && VALID_ROLES.has(body.role) ? body.role : 'MEMBER';
    const issued = await issueAccountInvitation(prisma, {
      email: body.email ?? '',
      role,
      createdByUserId: auth.user.id,
      expiresInHours:
        typeof body.expiresInHours === 'number' ? body.expiresInHours : undefined,
      ipAddress: ip,
    });

    const origin =
      req.headers.get('origin') ??
      process.env.NEXTAUTH_URL ??
      'http://localhost:3000';
    const inviteUrl = `${origin.replace(/\/$/, '')}/invite/${encodeURIComponent(issued.rawToken)}`;

    return NextResponse.json(
      {
        invitation: issued.invitation,
        rawToken: issued.rawToken,
        inviteUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to issue invitation.';
    return jsonError(message, 400);
  }
}
