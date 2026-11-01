import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ensureCanonicalTaxonomy,
  resolveCanonicalCompany,
} from '@/lib/taxonomy';
import { getOptionalSessionUser, jsonError } from '@/lib/api';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  await ensureCanonicalTaxonomy(prisma);
  const { slug } = await context.params;
  const viewer = await getOptionalSessionUser();
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get('category') ?? 'ALL').trim().toUpperCase();
  const sort = (searchParams.get('sort') ?? 'latest').trim().toLowerCase();

  const canonical = resolveCanonicalCompany(slug);
  const targetSlug = canonical?.slug ?? slug.trim().toLowerCase();

  const company = await prisma.company.findFirst({
    where: {
      OR: [{ slug: targetSlug }, { slug: slug.trim().toLowerCase() }],
    },
  });

  if (!company && !canonical) {
    return jsonError('Company not found.', 404);
  }

  const companySignals = await prisma.signal.findMany({
    where: {
      companies: {
        some: {
          company: { slug: company?.slug ?? targetSlug },
        },
      },
      ...(category !== 'ALL'
        ? {
            category:
              category === 'NEWS'
                ? 'Top News'
                : category === 'MODELS'
                ? 'Models'
                : category === 'REPOS'
                ? 'Trending Repos'
                : category === 'PAPERS'
                ? 'Top Papers'
                : undefined,
          }
        : {}),
    },
    orderBy:
      sort === 'upvotes' || sort === 'score'
        ? [{ metricsValue: 'desc' }, { publishedAt: 'desc' }]
        : [{ publishedAt: 'desc' }],
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
  });

  const monthCounts = new Array<number>(12).fill(0);
  for (const s of companySignals) {
    const m = s.publishedAt.getUTCMonth();
    monthCounts[m] = (monthCounts[m] ?? 0) + 1;
  }

  let viewerUpvotedIds = new Set<string>();
  let viewerBookmarkedIds = new Set<string>();
  if (viewer && companySignals.length > 0) {
    const ids = companySignals.map((s) => s.id);
    const [upvotes, bookmarks] = await Promise.all([
      prisma.signalUpvote.findMany({
        where: { userId: viewer.id, signalId: { in: ids } },
        select: { signalId: true },
      }),
      prisma.bookmark.findMany({
        where: { userId: viewer.id, signalId: { in: ids } },
        select: { signalId: true },
      }),
    ]);
    viewerUpvotedIds = new Set(upvotes.map((u) => u.signalId));
    viewerBookmarkedIds = new Set(bookmarks.map((b) => b.signalId));
  }

  const derivedFocusAreas = Array.from(
    new Set([
      ...(canonical?.focusAreas ?? []),
      ...companySignals.flatMap((s) =>
        s.topics.flatMap((t) => [
          t.topic.name.toUpperCase(),
          ...(t.subtopic ? [t.subtopic.name.replace(/_/g, ' ').toUpperCase()] : []),
        ])
      ),
    ])
  ).slice(0, 8);

  return NextResponse.json({
    company: {
      slug: company?.slug ?? canonical?.slug ?? targetSlug,
      name: canonical?.name ?? company?.name ?? targetSlug.toUpperCase(),
      domain: company?.domain ?? canonical?.domain ?? '',
      bio:
        canonical?.bio ??
        `${company?.name ?? targetSlug} builds AI models, infrastructure, and developer tools tracked across AlphaSignal.`,
      xUrl: canonical?.xUrl ?? 'https://x.com/AlphaSignalAI',
      websiteUrl:
        company?.domain || canonical?.domain
          ? `https://${company?.domain ?? canonical?.domain}`
          : 'https://alphasignal.ai',
      focusAreas:
        derivedFocusAreas.length > 0
          ? derivedFocusAreas
          : ['LLMS', 'AGENTS', 'OPEN_SOURCE'],
      monthlyActivity: MONTH_LABELS.map((label, idx) => ({
        month: label,
        count: monthCounts[idx] ?? 0,
      })),
    },
    signals: companySignals.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      category: s.category,
      sourceType: s.sourceType,
      sourceName: s.sourceName,
      originalUrl: s.originalUrl,
      metricsLabel: s.metricsLabel,
      metricsValue: s.metricsValue,
      publishedAt: s.publishedAt.toISOString(),
      upvoteCount: s._count.upvotes,
      commentCount: s._count.comments,
      viewerUpvoted: viewerUpvotedIds.has(s.id),
      viewerBookmarked: viewerBookmarkedIds.has(s.id),
      topics: s.topics.map((st) => ({
        topicSlug: st.topic.slug,
        topicName: st.topic.name,
        subtopicSlug: st.subtopic?.slug ?? null,
        subtopicName: st.subtopic?.name ?? null,
      })),
      companies: s.companies.map((sc) => ({
        slug: sc.company.slug,
        name: sc.company.name,
        domain: sc.company.domain,
      })),
    })),
  });
}
