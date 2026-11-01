import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getOptionalSessionUser,
  jsonError,
  requireAuthenticatedUser,
  verifyRequestOrigin,
} from '@/lib/api';

function parseKeyInsights(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const viewer = await getOptionalSessionUser();

  const signal = await prisma.signal.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      topics: {
        include: {
          topic: { select: { id: true, slug: true, name: true } },
          subtopic: { select: { id: true, slug: true, name: true } },
        },
      },
      companies: {
        include: {
          company: { select: { id: true, slug: true, name: true, domain: true } },
        },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true, username: true, role: true },
          },
          _count: {
            select: { upvotes: true },
          },
          upvotes: viewer
            ? {
                where: { userId: viewer.id },
                select: { id: true },
              }
            : false,
        },
      },
      _count: {
        select: {
          upvotes: true,
          comments: true,
          bookmarks: true,
        },
      },
    },
  });

  if (!signal) {
    return jsonError('Signal not found.', 404);
  }

  let viewerUpvoted = false;
  let viewerBookmarked = false;

  if (viewer) {
    const [up, bm] = await Promise.all([
      prisma.signalUpvote.findUnique({
        where: { userId_signalId: { userId: viewer.id, signalId: signal.id } },
      }),
      prisma.bookmark.findUnique({
        where: { userId_signalId: { userId: viewer.id, signalId: signal.id } },
      }),
    ]);
    viewerUpvoted = Boolean(up);
    viewerBookmarked = Boolean(bm);
  }

  return NextResponse.json({
    signal: {
      id: signal.id,
      slug: signal.slug,
      title: signal.title,
      summary: signal.summary,
      whatHappened: signal.whatHappened,
      whyItMatters: signal.whyItMatters,
      keyInsights: parseKeyInsights(signal.keyInsightsJson),
      category: signal.category,
      sourceType: signal.sourceType,
      sourceName: signal.sourceName,
      originalUrl: signal.originalUrl,
      metricsLabel: signal.metricsLabel,
      metricsValue: signal.metricsValue,
      authorName: signal.authorName,
      authorHandle: signal.authorHandle,
      publishedAt: signal.publishedAt.toISOString(),
      upvoteCount: signal._count.upvotes,
      commentCount: signal._count.comments,
      bookmarkCount: signal._count.bookmarks,
      viewerUpvoted,
      viewerBookmarked,
      topics: signal.topics.map((st) => ({
        topicSlug: st.topic.slug,
        topicName: st.topic.name,
        subtopicSlug: st.subtopic?.slug ?? null,
        subtopicName: st.subtopic?.name ?? null,
      })),
      companies: signal.companies.map((sc) => ({
        slug: sc.company.slug,
        name: sc.company.name,
        domain: sc.company.domain,
      })),
      comments: signal.comments.map((c) => ({
        id: c.id,
        parentId: c.parentId,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.user.id,
          name: c.user.name ?? 'Member',
          username: c.user.username ?? 'member',
          role: c.user.role,
        },
        upvoteCount: c._count.upvotes,
        viewerUpvoted: Array.isArray(c.upvotes) && c.upvotes.length > 0,
      })),
    },
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const existing = await prisma.signal.findUnique({ where: { id } });
  if (!existing) {
    return jsonError('Signal not found.', 404);
  }

  if (auth.user.role !== 'ADMIN' && existing.submittedById !== auth.user.id) {
    return jsonError('Forbidden.', 403);
  }

  await prisma.signal.delete({ where: { id } });
  return NextResponse.json({ status: 'deleted' });
}
