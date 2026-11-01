import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { updateAccountRoleOrStatus } from '@/lib/account-admission';
import {
  clientIpKey,
  jsonError,
  requireAdminUser,
  verifyRequestOrigin,
} from '@/lib/api';

const VALID_ROLES = new Set<UserRole>(['ADMIN', 'OPERATOR', 'MEMBER', 'VIEWER']);

export async function PATCH(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const ip = clientIpKey(req);

  try {
    const body = (await req.json()) as {
      userId?: string;
      role?: UserRole;
      disabled?: boolean;
    };

    if (!body.userId) {
      return jsonError('userId is required.', 400);
    }

    const role = body.role && VALID_ROLES.has(body.role) ? body.role : undefined;
    const updated = await updateAccountRoleOrStatus(prisma, {
      actorUserId: auth.user.id,
      targetUserId: body.userId,
      role,
      disabled: typeof body.disabled === 'boolean' ? body.disabled : undefined,
      ipAddress: ip,
    });

    return NextResponse.json({
      status: 'updated',
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        disabledAt: updated.disabledAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update account.';
    return jsonError(message, 400);
  }
}
