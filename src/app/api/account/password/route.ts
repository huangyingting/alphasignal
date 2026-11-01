import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { changeAccountPassword } from '@/lib/account-admission';
import {
  clientIpKey,
  consumeRateLimit,
  jsonError,
  requireAuthenticatedUser,
  verifyRequestOrigin,
} from '@/lib/api';

export async function POST(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  if (!consumeRateLimit(`password-change:${auth.user.id}`, 8, 15 * 60_000)) {
    return jsonError('Too many password change attempts. Please wait.', 429);
  }

  try {
    const body = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
    await changeAccountPassword(prisma, {
      userId: auth.user.id,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword ?? '',
      ipAddress: clientIpKey(req),
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to change password.';
    return jsonError(message, 400);
  }
}
