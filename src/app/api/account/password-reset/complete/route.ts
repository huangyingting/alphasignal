import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { completePasswordReset } from '@/lib/account-admission';
import { clientIpKey, consumeRateLimit, jsonError, verifyRequestOrigin } from '@/lib/api';

export async function POST(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const ip = clientIpKey(req);
  if (!consumeRateLimit(`pw-reset-complete:${ip}`, 8, 15 * 60_000)) {
    return jsonError('Too many password reset attempts. Try again later.', 429);
  }

  try {
    const body = (await req.json()) as {
      token?: string;
      newPassword?: string;
    };
    await completePasswordReset(
      prisma,
      body.token ?? '',
      body.newPassword ?? '',
      new Date(),
      ip
    );

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reset password.';
    return jsonError(message, 400);
  }
}
