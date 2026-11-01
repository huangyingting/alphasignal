import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  ensureCanonicalTaxonomy,
  normalizeTaxonomySlug,
  resolveCanonicalAuthor,
} from '@/lib/taxonomy';
import { persistSignalCandidate } from '@/lib/ingest';
import {
  getOptionalSessionUser,
  jsonError,
  requireAuthenticatedUser,
  requireWriteAccess,
  safeExternalHref,
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
  await ensureCanonicalTaxonomy(prisma);
  const viewer = await getOptionalSessionUser();
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get('q') ?? '').trim();
  const category = (searchParams.get('category') ?? 'All').trim();
  const rawTopicSlug = (searchParams.get('topic') ?? '').trim().toLowerCase();
  const rawSubtopicSlug = (searchParams.get('subtopic') ?? '').trim().toLowerCase();
  const topicSlug = rawTopicSlug ? normalizeTaxonomySlug(rawTopicSlug) : '';
  const subtopicSlug = rawSubtopicSlug ? normalizeTaxonomySlug(rawSubtopicSlug) : '';
  const companySlug = (searchParams.get('company') ?? '').trim().toLowerCase();
  const authorParam = (searchParams.get('author') ?? '').trim();
  const feedId = (searchParams.get('feedId') ?? '').trim();
  const period = (searchParams.get('period') ?? 'all').trim();
  const sort = (searchParams.get('sort') ?? 'latest').trim();
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 60), 1), 150);

  const andConditions: Prisma.SignalWhereInput[] = [];

  if (category && category !== 'All' && category !== 'For You') {
    andConditions.push({ category });
  }

  if (period === '24h' || period === '7d' || period === '30d') {
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    andConditions.push({ publishedAt: { gte: cutoff } });
  }

  if (topicSlug) {
    andConditions.push({
      topics: {
        some: {
          topic: { slug: { in: [topicSlug, rawTopicSlug] } },
          ...(subtopicSlug
            ? { subtopic: { slug: { in: [subtopicSlug, rawSubtopicSlug] } } }
            : {}),
        },
      },
    });
  } else if (subtopicSlug) {
    andConditions.push({
      topics: {
        some: {
          subtopic: { slug: { in: [subtopicSlug, rawSubtopicSlug] } },
        },
      },
    });
  }

  if (companySlug) {
    andConditions.push({
      companies: {
        some: {
          company: { slug: companySlug },
        },
      },
    });
  }

  if (authorParam) {
    const canonicalAuthor = resolveCanonicalAuthor(authorParam);
    const authorMatchers: Prisma.SignalWhereInput[] = [
      { authorHandle: { contains: authorParam } },
      { authorName: { contains: authorParam } },
    ];
    if (canonicalAuthor) {
      authorMatchers.push({ authorName: { contains: canonicalAuthor.name } });
      authorMatchers.push({ authorHandle: { contains: canonicalAuthor.slug } });
    }
    andConditions.push({ OR: authorMatchers });
  }

  if (q) {
    andConditions.push({
      OR: [
        { title: { contains: q } },
        { summary: { contains: q } },
        { whatHappened: { contains: q } },
        { whyItMatters: { contains: q } },
        { sourceName: { contains: q } },
        { topics: { some: { topic: { slug: { contains: q.toLowerCase() } } } } },
        { companies: { some: { company: { name: { contains: q } } } } },
      ],
    });
  }

  if (feedId && viewer) {
    const customFeed = await prisma.customFeed.findFirst({
      where: { id: feedId, userId: viewer.id },
      include: { filters: true },
    });

    if (customFeed && customFeed.filters.length > 0) {
      const includes = customFeed.filters.filter((f) => f.mode !== 'EXCLUDE');
      const excludes = customFeed.filters.filter((f) => f.mode === 'EXCLUDE');

      if (includes.length > 0) {
        const orIncludes: Prisma.SignalWhereInput[] = [];
        for (const f of includes) {
          const val = f.value.trim();
          if (!val) continue;
          if (f.filterType === 'TOPIC') {
            orIncludes.push({ topics: { some: { topic: { slug: val.toLowerCase() } } } });
          } else if (f.filterType === 'SUBTOPIC') {
            orIncludes.push({ topics: { some: { subtopic: { slug: val.toLowerCase() } } } });
          } else if (f.filterType === 'COMPANY') {
            orIncludes.push({ companies: { some: { company: { slug: val.toLowerCase() } } } });
          } else if (f.filterType === 'SOURCE') {
            orIncludes.push({ sourceType: val.toLowerCase() });
            orIncludes.push({ sourceName: { contains: val } });
          } else if (f.filterType === 'KEYWORD') {
            orIncludes.push({ title: { contains: val } });
            orIncludes.push({ summary: { contains: val } });
            orIncludes.push({ whatHappened: { contains: val } });
          }
        }
        if (orIncludes.length > 0) {
          andConditions.push({ OR: orIncludes });
        }
      }

      for (const f of excludes) {
        const val = f.value.trim();
        if (!val) continue;
        if (f.filterType === 'TOPIC') {
          andConditions.push({ NOT: { topics: { some: { topic: { slug: val.toLowerCase() } } } } });
        } else if (f.filterType === 'SUBTOPIC') {
          andConditions.push({ NOT: { topics: { some: { subtopic: { slug: val.toLowerCase() } } } } });
        } else if (f.filterType === 'COMPANY') {
          andConditions.push({ NOT: { companies: { some: { company: { slug: val.toLowerCase() } } } } });
        } else if (f.filterType === 'SOURCE') {
          andConditions.push({ NOT: { sourceName: { contains: val } } });
        } else if (f.filterType === 'KEYWORD') {
          andConditions.push({
            NOT: {
              OR: [
                { title: { contains: val } },
                { summary: { contains: val } },
                { whatHappened: { contains: val } },
              ],
            },
          });
        }
      }
    }
  }

  const where: Prisma.SignalWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const signals = await prisma.signal.findMany({
    where,
    orderBy:
      sort === 'score'
        ? [{ metricsValue: 'desc' }, { publishedAt: 'desc' }]
        : [{ publishedAt: 'desc' }],
    take: limit,
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
      _count: {
        select: {
          upvotes: true,
          comments: true,
          bookmarks: true,
        },
      },
    },
  });

  let viewerUpvotedSet = new Set<string>();
  let viewerBookmarkedSet = new Set<string>();

  if (viewer && signals.length > 0) {
    const signalIds = signals.map((s) => s.id);
    const [upvotes, bookmarks] = await Promise.all([
      prisma.signalUpvote.findMany({
        where: { userId: viewer.id, signalId: { in: signalIds } },
        select: { signalId: true },
      }),
      prisma.bookmark.findMany({
        where: { userId: viewer.id, signalId: { in: signalIds } },
        select: { signalId: true },
      }),
    ]);
    viewerUpvotedSet = new Set(upvotes.map((u) => u.signalId));
    viewerBookmarkedSet = new Set(bookmarks.map((b) => b.signalId));
  }

  const formatted = signals.map((signal) => ({
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
    viewerUpvoted: viewerUpvotedSet.has(signal.id),
    viewerBookmarked: viewerBookmarkedSet.has(signal.id),
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
  }));

  return NextResponse.json({
    signals: formatted,
    total: formatted.length,
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
      title?: string;
      summary?: string;
      whatHappened?: string;
      whyItMatters?: string;
      keyInsights?: string[];
      category?: 'Top News' | 'Top Papers' | 'Top Repos' | 'Top Posts';
      sourceType?: 'github' | 'arxiv' | 'news' | 'social' | 'rss';
      sourceName?: string;
      originalUrl?: string;
      metricsLabel?: string;
      metricsValue?: number;
      authorName?: string;
      authorHandle?: string;
      topics?: string[];
      companies?: string[];
    };

    const title = (body.title ?? '').trim();
    const originalUrl = safeExternalHref(body.originalUrl);
    if (!title || title.length < 4) {
      return jsonError('Signal title must be at least 4 characters.', 400);
    }
    if (!originalUrl) {
      return jsonError('A valid HTTP/HTTPS source URL is required.', 400);
    }

    const summary = (body.summary ?? title).trim();
    const whatHappened = (body.whatHappened ?? summary).trim();
    const whyItMatters = (
      body.whyItMatters ??
      'Provides actionable technical signal for AI researchers and engineering teams.'
    ).trim();

    let sourceName = (body.sourceName ?? '').trim();
    if (!sourceName) {
      try {
        sourceName = new URL(originalUrl).hostname.replace(/^www\./, '');
      } catch {
        sourceName = 'Web';
      }
    }

    const signal = await persistSignalCandidate(prisma, {
      externalId: `manual:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      title,
      summary,
      whatHappened,
      whyItMatters,
      keyInsights: Array.isArray(body.keyInsights)
        ? body.keyInsights.filter((k) => typeof k === 'string' && k.trim().length > 0)
        : [summary],
      category: body.category ?? 'Top News',
      sourceType: body.sourceType ?? 'news',
      sourceName,
      originalUrl,
      metricsLabel: body.metricsLabel ?? 'SIGNAL',
      metricsValue: typeof body.metricsValue === 'number' ? body.metricsValue : 1,
      authorName: body.authorName ?? auth.user.name ?? 'Contributor',
      authorHandle: body.authorHandle ?? (auth.user.username ? `@${auth.user.username}` : undefined),
      explicitTopics: body.topics,
      explicitCompanies: body.companies,
      submittedById: auth.user.id,
    });

    return NextResponse.json({ signal }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create signal.';
    return jsonError(message, 400);
  }
}
