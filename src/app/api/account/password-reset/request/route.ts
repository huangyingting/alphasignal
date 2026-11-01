import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issuePasswordReset } from '@/lib/account-admission';
import { deliverTransactionalEmail } from '@/lib/email-delivery';
import { clientIpKey, consumeRateLimit, jsonError, verifyRequestOrigin } from '@/lib/api';

export async function POST(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const ip = clientIpKey(req);
  if (!consumeRateLimit(`pw-reset-req:${ip}`, 8, 15 * 60_000)) {
    return jsonError('Too many password reset requests. Try again later.', 429);
  }

  try {
    const body = (await req.json()) as { email?: string };
    const issued = await issuePasswordReset(prisma, body.email ?? '', new Date(), ip);

    if (issued) {
      const origin =
        req.headers.get('origin') ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000';
      const resetUrl = `${origin.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(issued.rawToken)}`;
      await deliverTransactionalEmail({
        to: issued.email,
        subject: 'AlphaSignal Password Reset',
        text: `Reset your AlphaSignal password using this one-time link (valid for 60 minutes): ${resetUrl}`,
      });
    }

    return NextResponse.json({
      status: 'ok',
      message:
        'If an active invited account matches that email address, password reset instructions have been issued.',
    });
  } catch {
    return jsonError('Unable to process password reset request.', 400);
  }
}
