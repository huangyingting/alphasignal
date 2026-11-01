import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonError,
  requireAuthenticatedUser,
  requireWriteAccess,
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

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const folder = (searchParams.get('folder') ?? '').trim();
  const tab = (searchParams.get('tab') ?? 'bookmarks').trim().toLowerCase();

  const allUserBookmarks = await prisma.bookmark.findMany({
    where: { userId: auth.user.id },
    select: { folder: true },
  });
  const folderSet = new Set<string>(['READING LIST']);
  for (const b of allUserBookmarks) {
    if (b.folder && b.folder !== 'default') {
      folderSet.add(b.folder);
    }
  }
  const lists = Array.from(folderSet);

  if (tab === 'upvotes') {
    const upvotes = await prisma.signalUpvote.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        signal: {
          include: {
            topics: {
              include: {
                topic: { select: { slug: true, name: true } },
                subtopic: { select: { slug: true, name: true } },
              },
            },
            companies: {
              include: {
                company: { select: { slug: true, name: true, domain: true } },
              },
            },
            _count: {
              select: { upvotes: true, comments: true, bookmarks: true },
            },
          },
        },
      },
    });

    const filteredUpvotes = upvotes.filter((u) => {
      if (!q) return true;
      const s = u.signal;
      return (
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.whatHappened.toLowerCase().includes(q) ||
        s.sourceName.toLowerCase().includes(q)
      );
    });

    return NextResponse.json({
      lists,
      bookmarks: filteredUpvotes.map((u) => ({
        id: u.id,
        folder: 'UPVOTES',
        note: null,
        createdAt: u.createdAt.toISOString(),
        signal: {
          id: u.signal.id,
          slug: u.signal.slug,
          title: u.signal.title,
          summary: u.signal.summary,
          whatHappened: u.signal.whatHappened,
          whyItMatters: u.signal.whyItMatters,
          keyInsights: parseKeyInsights(u.signal.keyInsightsJson),
          category: u.signal.category,
          sourceType: u.signal.sourceType,
          sourceName: u.signal.sourceName,
          originalUrl: u.signal.originalUrl,
          metricsLabel: u.signal.metricsLabel,
          metricsValue: u.signal.metricsValue,
          publishedAt: u.signal.publishedAt.toISOString(),
          upvoteCount: u.signal._count.upvotes,
          commentCount: u.signal._count.comments,
          viewerUpvoted: true,
          viewerBookmarked: false,
          topics: u.signal.topics.map((st) => ({
            topicSlug: st.topic.slug,
            topicName: st.topic.name,
            subtopicSlug: st.subtopic?.slug ?? null,
            subtopicName: st.subtopic?.name ?? null,
          })),
          companies: u.signal.companies.map((sc) => ({
            slug: sc.company.slug,
            name: sc.company.name,
            domain: sc.company.domain,
          })),
        },
      })),
    });
  }

  const normalizedFolder =
    folder === 'READING LIST' ? { in: ['default', 'READING LIST'] } : folder;

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: auth.user.id,
      ...(folder && folder !== 'all' ? { folder: normalizedFolder } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      signal: {
        include: {
          topics: {
            include: {
              topic: { select: { slug: true, name: true } },
              subtopic: { select: { slug: true, name: true } },
            },
          },
          companies: {
            include: {
              company: { select: { slug: true, name: true, domain: true } },
            },
          },
          _count: {
            select: { upvotes: true, comments: true, bookmarks: true },
          },
        },
      },
    },
  });

  const filtered = bookmarks.filter((b) => {
    if (!q) return true;
    const s = b.signal;
    return (
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.whatHappened.toLowerCase().includes(q) ||
      s.sourceName.toLowerCase().includes(q) ||
      (b.note ?? '').toLowerCase().includes(q)
    );
  });

  return NextResponse.json({
    lists,
    bookmarks: filtered.map((b) => ({
      id: b.id,
      folder: b.folder,
      note: b.note,
      createdAt: b.createdAt.toISOString(),
      signal: {
        id: b.signal.id,
        slug: b.signal.slug,
        title: b.signal.title,
        summary: b.signal.summary,
        whatHappened: b.signal.whatHappened,
        whyItMatters: b.signal.whyItMatters,
        keyInsights: parseKeyInsights(b.signal.keyInsightsJson),
        category: b.signal.category,
        sourceType: b.signal.sourceType,
        sourceName: b.signal.sourceName,
        originalUrl: b.signal.originalUrl,
        metricsLabel: b.signal.metricsLabel,
        metricsValue: b.signal.metricsValue,
        publishedAt: b.signal.publishedAt.toISOString(),
        upvoteCount: b.signal._count.upvotes,
        commentCount: b.signal._count.comments,
        viewerBookmarked: true,
        topics: b.signal.topics.map((st) => ({
          topicSlug: st.topic.slug,
          topicName: st.topic.name,
          subtopicSlug: st.subtopic?.slug ?? null,
          subtopicName: st.subtopic?.name ?? null,
        })),
        companies: b.signal.companies.map((sc) => ({
          slug: sc.company.slug,
          name: sc.company.name,
          domain: sc.company.domain,
        })),
      },
    })),
  });
}

export async function POST(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const writeError = requireWriteAccess(auth.user);
  if (writeError) return writeError;

  try {
    const body = (await req.json()) as {
      signalId?: string;
      folder?: string;
      note?: string;
      toggle?: boolean;
    };

    const signalId = (body.signalId ?? '').trim();
    if (!signalId) {
      return jsonError('signalId is required.', 400);
    }

    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      select: { id: true },
    });
    if (!signal) {
      return jsonError('Signal not found.', 404);
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_signalId: {
          userId: auth.user.id,
          signalId,
        },
      },
    });

    if (existing && body.toggle !== false) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false });
    }

    const saved = await prisma.bookmark.upsert({
      where: {
        userId_signalId: {
          userId: auth.user.id,
          signalId,
        },
      },
      update: {
        folder: (body.folder ?? existing?.folder ?? 'default').trim() || 'default',
        note: body.note !== undefined ? body.note : existing?.note ?? null,
      },
      create: {
        userId: auth.user.id,
        signalId,
        folder: (body.folder ?? 'default').trim() || 'default',
        note: body.note ?? null,
      },
    });

    return NextResponse.json({
      bookmarked: true,
      bookmark: saved,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update bookmark.';
    return jsonError(message, 400);
  }
}
