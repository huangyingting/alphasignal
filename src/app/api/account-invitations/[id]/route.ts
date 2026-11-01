import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  revokeAccountInvitation,
  rotateAccountInvitation,
} from '@/lib/account-admission';
import {
  clientIpKey,
  jsonError,
  requireAdminUser,
  verifyRequestOrigin,
} from '@/lib/api';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const ip = clientIpKey(req);

  try {
    const body = (await req.json()) as {
      action?: 'revoke' | 'rotate';
      expiresInHours?: number;
    };

    if (body.action === 'rotate') {
      const rotated = await rotateAccountInvitation(prisma, {
        invitationId: id,
        actorUserId: auth.user.id,
        expiresInHours: body.expiresInHours,
        ipAddress: ip,
      });
      const origin =
        req.headers.get('origin') ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000';
      const inviteUrl = `${origin.replace(/\/$/, '')}/invite/${encodeURIComponent(rotated.rawToken)}`;

      return NextResponse.json({
        status: 'rotated',
        invitation: rotated.invitation,
        rawToken: rotated.rawToken,
        inviteUrl,
      });
    }

    const revoked = await revokeAccountInvitation(prisma, {
      invitationId: id,
      revokedByUserId: auth.user.id,
      ipAddress: ip,
    });

    return NextResponse.json({
      status: 'revoked',
      invitation: {
        id: revoked.id,
        email: revoked.email,
        revokedAt: revoked.revokedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update invitation.';
    return jsonError(message, 400);
  }
}
