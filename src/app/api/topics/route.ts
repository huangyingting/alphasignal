import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureCanonicalTaxonomy } from '@/lib/taxonomy';

export async function GET(req: Request) {
  await ensureCanonicalTaxonomy(prisma);

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') ?? 'all').trim();

  let dateFilter: { gte: Date } | undefined;
  if (period === '24h' || period === '7d' || period === '30d') {
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    dateFilter = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
  }

  const [topics, companies] = await Promise.all([
    prisma.topic.findMany({
      orderBy: { slug: 'asc' },
      include: {
        subtopics: {
          orderBy: { slug: 'asc' },
          include: {
            signals: {
              where: dateFilter ? { signal: { publishedAt: dateFilter } } : undefined,
              select: { id: true },
            },
          },
        },
        signals: {
          where: dateFilter ? { signal: { publishedAt: dateFilter } } : undefined,
          select: { id: true },
        },
      },
    }),
    prisma.company.findMany({
      include: {
        signals: {
          where: dateFilter ? { signal: { publishedAt: dateFilter } } : undefined,
          select: { id: true },
        },
      },
    }),
  ]);

  const formattedTopics = topics.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    signalCount: t.signals.length,
    subtopics: t.subtopics.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      signalCount: s.signals.length,
    })),
  }));

  const sortedCompanies = companies
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      domain: c.domain,
      signalCount: c.signals.length,
    }))
    .sort((a, b) => b.signalCount - a.signalCount || a.name.localeCompare(b.name));

  return NextResponse.json({
    topics: formattedTopics,
    companies: sortedCompanies,
  });
}
