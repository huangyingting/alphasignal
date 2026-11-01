import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  acceptAccountInvitationWithPassword,
  inspectAccountInvitationToken,
} from '@/lib/account-admission';
import { clientIpKey, consumeRateLimit, jsonError, verifyRequestOrigin } from '@/lib/api';

export async function GET(req: Request) {
  const ip = clientIpKey(req);
  if (!consumeRateLimit(`invite-inspect:${ip}`, 30, 10 * 60_000)) {
    return jsonError('Too many requests. Please wait before trying again.', 429);
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') ?? '';
  const result = await inspectAccountInvitationToken(prisma, token);
  if (result.status !== 'valid') {
    return NextResponse.json({ status: result.status }, { status: 200 });
  }

  return NextResponse.json({
    status: 'valid',
    invitation: {
      email: result.invitation.email,
      role: result.invitation.role,
      expiresAt: result.invitation.expiresAt.toISOString(),
    },
  });
}

export async function POST(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const ip = clientIpKey(req);
  if (!consumeRateLimit(`invite-accept:${ip}`, 10, 15 * 60_000)) {
    return jsonError('Too many invitation activation attempts. Try again later.', 429);
  }

  try {
    const body = (await req.json()) as {
      token?: string;
      name?: string;
      username?: string;
      password?: string;
    };
    const user = await acceptAccountInvitationWithPassword(prisma, {
      rawToken: body.token ?? '',
      name: body.name ?? null,
      username: body.username ?? null,
      password: body.password ?? '',
      ipAddress: ip,
    });

    return NextResponse.json({
      status: 'accepted',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to activate invitation.';
    return jsonError(message, 400);
  }
}
