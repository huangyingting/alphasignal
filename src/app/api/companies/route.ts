import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  CANONICAL_COMPANIES,
  CANONICAL_TOPICS,
  ensureCanonicalTaxonomy,
  normalizeTaxonomySlug,
  resolveCanonicalCompany,
} from '@/lib/taxonomy';

export async function GET(req: Request) {
  await ensureCanonicalTaxonomy(prisma);

  const { searchParams } = new URL(req.url);
  const rawTopic = (searchParams.get('topic') ?? '').trim().toLowerCase();
  const topicFilter =
    rawTopic && rawTopic !== 'all' ? normalizeTaxonomySlug(rawTopic) : '';

  const companies = await prisma.company.findMany({
    include: {
      signals: {
        include: {
          signal: {
            select: {
              id: true,
              metricsValue: true,
              topics: {
                include: {
                  topic: { select: { slug: true } },
                },
              },
              _count: {
                select: { upvotes: true },
              },
            },
          },
        },
      },
    },
  });

  const rows = companies
    .map((c) => {
      const canonical = resolveCanonicalCompany(c.slug);
      const matchingSignals = c.signals.filter((sc) => {
        if (!topicFilter) return true;
        const signalTopics = sc.signal.topics.map((t) =>
          normalizeTaxonomySlug(t.topic.slug)
        );
        const focusMatch = (canonical?.focusAreas ?? []).some(
          (fa) => normalizeTaxonomySlug(fa) === topicFilter
        );
        return signalTopics.includes(topicFilter) || focusMatch;
      });

      const computedLikes = matchingSignals.reduce(
        (sum, sc) => sum + sc.signal.metricsValue + sc.signal._count.upvotes * 25,
        0
      );

      const topicMatchesCanonical =
        !topicFilter ||
        (canonical?.focusAreas ?? []).some(
          (fa) => normalizeTaxonomySlug(fa) === topicFilter
        ) ||
        matchingSignals.length > 0;

      return {
        id: c.id,
        slug: c.slug,
        name: canonical?.name ?? c.name,
        domain: c.domain ?? canonical?.domain ?? '',
        bio: canonical?.bio ?? '',
        xUrl: canonical?.xUrl ?? '',
        focusAreas: canonical?.focusAreas ?? [],
        signalCount: matchingSignals.length,
        likes: computedLikes,
        topicMatchesCanonical,
      };
    })
    .filter((row) => row.topicMatchesCanonical)
    .sort(
      (a, b) =>
        b.likes - a.likes ||
        b.signalCount - a.signalCount ||
        a.name.localeCompare(b.name)
    )
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));

  return NextResponse.json({
    companies: rows,
    totalCount: CANONICAL_COMPANIES.length,
    topics: CANONICAL_TOPICS.map((t) => ({
      slug: t.slug,
      name: t.name.toUpperCase(),
    })),
  });
}
