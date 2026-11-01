import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonError,
  requireAuthenticatedUser,
  requireWriteAccess,
  verifyRequestOrigin,
} from '@/lib/api';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const writeError = requireWriteAccess(auth.user);
  if (writeError) return writeError;

  const { id: signalId } = await context.params;
  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
    select: { id: true },
  });
  if (!signal) {
    return jsonError('Signal not found.', 404);
  }

  const existing = await prisma.signalUpvote.findUnique({
    where: {
      userId_signalId: {
        userId: auth.user.id,
        signalId,
      },
    },
  });

  let upvoted: boolean;
  if (existing) {
    await prisma.signalUpvote.delete({ where: { id: existing.id } });
    upvoted = false;
  } else {
    await prisma.signalUpvote.create({
      data: {
        userId: auth.user.id,
        signalId,
      },
    });
    upvoted = true;
  }

  const upvoteCount = await prisma.signalUpvote.count({
    where: { signalId },
  });

  return NextResponse.json({
    upvoted,
    upvoteCount,
  });
}
