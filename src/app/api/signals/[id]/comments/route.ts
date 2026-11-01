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
    select: { id: true, slug: true, title: true, submittedById: true },
  });
  if (!signal) {
    return jsonError('Signal not found.', 404);
  }

  try {
    const body = (await req.json()) as {
      body?: string;
      parentId?: string | null;
    };
    const text = (body.body ?? '').trim();
    if (!text || text.length < 2) {
      return jsonError('Comment cannot be empty.', 400);
    }
    if (text.length > 4000) {
      return jsonError('Comment must be under 4,000 characters.', 400);
    }

    let parentComment: { id: string; userId: string } | null = null;
    if (body.parentId) {
      parentComment = await prisma.comment.findFirst({
        where: { id: body.parentId, signalId },
        select: { id: true, userId: true },
      });
      if (!parentComment) {
        return jsonError('Parent comment not found.', 404);
      }
    }

    const created = await prisma.comment.create({
      data: {
        signalId,
        userId: auth.user.id,
        parentId: parentComment?.id ?? null,
        body: text,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, role: true },
        },
      },
    });

    const notifyTargetUserId = parentComment?.userId ?? signal.submittedById;
    if (notifyTargetUserId && notifyTargetUserId !== auth.user.id) {
      await prisma.notification.create({
        data: {
          userId: notifyTargetUserId,
          title: parentComment ? 'New reply to your comment' : 'New comment on your signal',
          body: `${auth.user.name ?? 'A member'} commented on "${signal.title.slice(0, 80)}"`,
          href: `/?signal=${encodeURIComponent(signal.id)}`,
        },
      });
    }

    return NextResponse.json(
      {
        comment: {
          id: created.id,
          parentId: created.parentId,
          body: created.body,
          createdAt: created.createdAt.toISOString(),
          author: {
            id: created.user.id,
            name: created.user.name ?? 'Member',
            username: created.user.username ?? 'member',
            role: created.user.role,
          },
          upvoteCount: 0,
          viewerUpvoted: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to post comment.';
    return jsonError(message, 400);
  }
}

export async function PATCH(
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
  const body = (await req.json()) as { commentId?: string };
  if (!body.commentId) {
    return jsonError('commentId is required.', 400);
  }

  const comment = await prisma.comment.findFirst({
    where: { id: body.commentId, signalId },
  });
  if (!comment) {
    return jsonError('Comment not found.', 404);
  }

  const existing = await prisma.commentUpvote.findUnique({
    where: {
      userId_commentId: {
        userId: auth.user.id,
        commentId: comment.id,
      },
    },
  });

  let upvoted: boolean;
  if (existing) {
    await prisma.commentUpvote.delete({ where: { id: existing.id } });
    upvoted = false;
  } else {
    await prisma.commentUpvote.create({
      data: {
        userId: auth.user.id,
        signalId,
        commentId: comment.id,
      },
    });
    upvoted = true;
  }

  const upvoteCount = await prisma.commentUpvote.count({
    where: { commentId: comment.id },
  });

  return NextResponse.json({
    commentId: comment.id,
    upvoted,
    upvoteCount,
  });
}
