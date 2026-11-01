import type { PrismaClient } from '@prisma/client';
import { classifySignalContent, ensureCanonicalTaxonomy } from './taxonomy';

export type RawSignalCandidate = {
  externalId: string;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  keyInsights: string[];
  category: 'Top News' | 'Top Papers' | 'Top Repos' | 'Top Posts';
  sourceType: 'github' | 'arxiv' | 'news' | 'social' | 'rss';
  sourceName: string;
  originalUrl: string;
  metricsLabel?: string;
  metricsValue?: number;
  authorName?: string;
  authorHandle?: string;
  publishedAt?: Date;
  explicitTopics?: string[];
  explicitCompanies?: string[];
  submittedById?: string | null;
};

function slugifyTitle(title: string, suffix: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 68);
  const cleanSuffix = suffix.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase();
  return `${base || 'signal'}-${cleanSuffix || Date.now().toString(36)}`;
}

export async function persistSignalCandidate(
  prisma: PrismaClient,
  candidate: RawSignalCandidate
) {
  await ensureCanonicalTaxonomy(prisma);

  const classification = classifySignalContent({
    title: candidate.title,
    summary: `${candidate.summary} ${candidate.whatHappened} ${candidate.whyItMatters}`,
    sourceType: candidate.sourceType,
    explicitTopics: candidate.explicitTopics,
    explicitCompanies: candidate.explicitCompanies,
  });

  const slug = slugifyTitle(candidate.title, candidate.externalId);
  const publishedAt = candidate.publishedAt ?? new Date();

  const signal = await prisma.signal.upsert({
    where: { externalId: candidate.externalId },
    update: {
      title: candidate.title,
      summary: candidate.summary,
      whatHappened: candidate.whatHappened,
      whyItMatters: candidate.whyItMatters,
      keyInsightsJson: JSON.stringify(candidate.keyInsights),
      category: candidate.category,
      sourceType: candidate.sourceType,
      sourceName: candidate.sourceName,
      originalUrl: candidate.originalUrl,
      metricsLabel: candidate.metricsLabel ?? null,
      metricsValue: candidate.metricsValue ?? 0,
      authorName: candidate.authorName ?? null,
      authorHandle: candidate.authorHandle ?? null,
    },
    create: {
      slug,
      externalId: candidate.externalId,
      title: candidate.title,
      summary: candidate.summary,
      whatHappened: candidate.whatHappened,
      whyItMatters: candidate.whyItMatters,
      keyInsightsJson: JSON.stringify(candidate.keyInsights),
      category: candidate.category,
      sourceType: candidate.sourceType,
      sourceName: candidate.sourceName,
      originalUrl: candidate.originalUrl,
      metricsLabel: candidate.metricsLabel ?? null,
      metricsValue: candidate.metricsValue ?? 0,
      authorName: candidate.authorName ?? null,
      authorHandle: candidate.authorHandle ?? null,
      publishedAt,
      submittedById: candidate.submittedById ?? null,
    },
  });

  for (const t of classification.topics) {
    const topic = await prisma.topic.findUnique({ where: { slug: t.topicSlug } });
    if (!topic) continue;
    const subtopic = t.subtopicSlug
      ? await prisma.subtopic.findUnique({
          where: { topicId_slug: { topicId: topic.id, slug: t.subtopicSlug } },
        })
      : null;

    const existingLink = await prisma.signalTopic.findFirst({
      where: {
        signalId: signal.id,
        topicId: topic.id,
        subtopicId: subtopic?.id ?? null,
      },
    });
    if (!existingLink) {
      await prisma.signalTopic.create({
        data: {
          signalId: signal.id,
          topicId: topic.id,
          subtopicId: subtopic?.id ?? null,
        },
      });
    }
  }

  for (const companySlug of classification.companies) {
    const company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) continue;
    await prisma.signalCompany.upsert({
      where: {
        signalId_companyId: {
          signalId: signal.id,
          companyId: company.id,
        },
      },
      update: {},
      create: {
        signalId: signal.id,
        companyId: company.id,
      },
    });
  }

  return signal;
}

async function fetchLiveGitHubRepos(limit = 5): Promise<RawSignalCandidate[]> {
  const sinceDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=(llm+OR+agent+OR+mcp+OR+inference)+pushed:>${sinceDate}+stars:>100&sort=stars&order=desc&per_page=${limit}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'AlphaSignal-Ingestion-Engine/1.0',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    items?: Array<{
      id: number;
      full_name: string;
      description: string | null;
      html_url: string;
      stargazers_count: number;
      forks_count: number;
      language: string | null;
      pushed_at: string;
      owner?: { login?: string };
      topics?: string[];
    }>;
  };

  return (payload.items ?? []).slice(0, limit).map((repo) => {
    const desc = (repo.description ?? 'Open-source AI engineering repository.').trim();
    return {
      externalId: `gh:${repo.id}`,
      title: `${repo.full_name}: ${desc.slice(0, 110)}`,
      summary: desc,
      whatHappened: `${repo.full_name} reached ${repo.stargazers_count.toLocaleString()} stars and ${repo.forks_count.toLocaleString()} forks on GitHub. Built primarily in ${repo.language ?? 'Python/TypeScript'}, the repository provides ${desc}`,
      whyItMatters: `Rapid open-source traction around ${repo.full_name} gives engineering teams a reproducible implementation reference and production-ready building blocks without proprietary lock-in.`,
      keyInsights: [
        `Repository: ${repo.full_name} (${repo.stargazers_count.toLocaleString()} stars, ${repo.forks_count.toLocaleString()} forks)`,
        `Primary language: ${repo.language ?? 'Multi-language'}`,
        `Tagged ecosystem topics: ${(repo.topics ?? []).slice(0, 5).join(', ') || 'ai, llm, agents'}`,
      ],
      category: 'Top Repos',
      sourceType: 'github',
      sourceName: 'GitHub',
      originalUrl: repo.html_url,
      metricsLabel: 'STARS',
      metricsValue: repo.stargazers_count,
      authorName: repo.owner?.login ?? undefined,
      authorHandle: repo.owner?.login ? `@${repo.owner.login}` : undefined,
      publishedAt: new Date(repo.pushed_at || Date.now()),
    };
  });
}

async function fetchLiveArxivPapers(limit = 5): Promise<RawSignalCandidate[]> {
  const url = `https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=${limit}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'AlphaSignal-Ingestion-Engine/1.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return [];
  const xml = await response.text();
  const entries = xml.split('<entry>').slice(1, limit + 1);

  return entries
    .map((entry): RawSignalCandidate | null => {
      const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
      const authorMatches = Array.from(entry.matchAll(/<name>([\s\S]*?)<\/name>/g)).map((m) =>
        m[1].trim()
      );

      if (!idMatch || !titleMatch || !summaryMatch) return null;
      const rawUrl = idMatch[1].trim();
      const arxivId = rawUrl.split('/abs/').pop() ?? rawUrl;
      const title = titleMatch[1].replace(/\s+/g, ' ').trim();
      const abstract = summaryMatch[1].replace(/\s+/g, ' ').trim();
      const sentences = abstract.split(/(?<=[.!?])\s+/);
      const firstHalf = sentences.slice(0, 2).join(' ') || abstract.slice(0, 280);
      const secondHalf = sentences.slice(2, 4).join(' ') || abstract.slice(280, 560) || firstHalf;

      return {
        externalId: `arxiv:${arxivId}`,
        title,
        summary: firstHalf.slice(0, 280),
        whatHappened: firstHalf,
        whyItMatters: secondHalf,
        keyInsights: [
          `arXiv Identifier: ${arxivId}`,
          `Lead Authors: ${authorMatches.slice(0, 3).join(', ') || 'Research Consortium'}`,
          sentences[0] ?? abstract.slice(0, 140),
        ],
        category: 'Top Papers',
        sourceType: 'arxiv',
        sourceName: 'arXiv',
        originalUrl: rawUrl.replace('http://', 'https://'),
        metricsLabel: 'PAPER',
        metricsValue: Math.max(10, authorMatches.length * 12),
        authorName: authorMatches[0] ?? 'arXiv Authors',
        publishedAt: publishedMatch ? new Date(publishedMatch[1].trim()) : new Date(),
      };
    })
    .filter((item): item is RawSignalCandidate => item !== null);
}

async function fetchLiveHackerNewsSignals(limit = 5): Promise<RawSignalCandidate[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=LLM+OR+Anthropic+OR+OpenAI+OR+Claude+OR+GPU&tags=story&hitsPerPage=${limit}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'AlphaSignal-Ingestion-Engine/1.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    hits?: Array<{
      objectID: string;
      title: string;
      url?: string;
      points?: number;
      num_comments?: number;
      author?: string;
      created_at?: string;
    }>;
  };

  return (payload.hits ?? [])
    .filter((hit) => Boolean(hit.title && hit.url))
    .slice(0, limit)
    .map((hit) => {
      const targetUrl = hit.url!;
      let domain = 'news.ycombinator.com';
      try {
        domain = new URL(targetUrl).hostname.replace(/^www\./, '');
      } catch {
        // ignore URL parse error
      }
      const points = hit.points ?? 1;
      const comments = hit.num_comments ?? 0;

      return {
        externalId: `hn:${hit.objectID}`,
        title: hit.title,
        summary: `Published via ${domain} — ${points} community points and ${comments} technical discussion comments.`,
        whatHappened: `${hit.title} was published on ${domain} and surfaced across technical engineering feeds, accumulating ${points} points and ${comments} discussion threads.`,
        whyItMatters: `High velocity across developer channels signals immediate relevance for practitioners tracking production LLM infrastructure, model capabilities, and developer workflows.`,
        keyInsights: [
          `Primary source domain: ${domain}`,
          `Community engagement: ${points} points, ${comments} discussion comments`,
          `Submitted by @${hit.author ?? 'contributor'}`,
        ],
        category: domain.includes('x.com') || domain.includes('twitter.com') ? 'Top Posts' : 'Top News',
        sourceType: 'news',
        sourceName: domain,
        originalUrl: targetUrl,
        metricsLabel: 'SCORE',
        metricsValue: points,
        authorName: hit.author ?? domain,
        authorHandle: hit.author ? `@${hit.author}` : undefined,
        publishedAt: hit.created_at ? new Date(hit.created_at) : new Date(),
      };
    });
}

export async function compileEmailReportFromSignals(
  prisma: PrismaClient,
  options?: { subject?: string; editionDate?: Date }
) {
  const latestSignals = await prisma.signal.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 8,
    include: {
      topics: { include: { topic: true, subtopic: true } },
      companies: { include: { company: true } },
    },
  });

  if (latestSignals.length === 0) {
    return null;
  }

  const editionDate = options?.editionDate ?? new Date();
  const dateSlug = editionDate.toISOString().slice(0, 10);
  const topHeadline = latestSignals[0].title;
  const subject = options?.subject ?? `AlphaSignal Daily: ${topHeadline.slice(0, 72)}`;
  const summary = latestSignals
    .slice(0, 3)
    .map((s) => s.title)
    .join(' • ');

  const htmlSections = latestSignals
    .map(
      (s) => `
      <div style="border-bottom:1px solid #222222;padding:16px 0;">
        <div style="font-family:monospace;font-size:11px;color:#737373;text-transform:uppercase;">
          ${s.category} • ${s.sourceName}
        </div>
        <h3 style="margin:6px 0;color:#ededed;font-size:18px;">${s.title}</h3>
        <p style="margin:6px 0;color:#c5c5c5;font-size:14px;line-height:1.5;">${s.whatHappened}</p>
        <p style="margin:6px 0;color:#999999;font-size:13px;line-height:1.5;"><strong>Why it matters:</strong> ${s.whyItMatters}</p>
      </div>`
    )
    .join('\n');

  return prisma.emailReport.upsert({
    where: { slug: `edition-${dateSlug}` },
    update: {
      subject,
      summary,
      htmlContent: `<div style="background:#030303;color:#ededed;padding:24px;">${htmlSections}</div>`,
      signalIds: JSON.stringify(latestSignals.map((s) => s.id)),
    },
    create: {
      slug: `edition-${dateSlug}`,
      subject,
      editionDate,
      summary,
      htmlContent: `<div style="background:#030303;color:#ededed;padding:24px;">${htmlSections}</div>`,
      signalIds: JSON.stringify(latestSignals.map((s) => s.id)),
    },
  });
}

export async function ingestLiveSignals(
  prisma: PrismaClient,
  options?: {
    sources?: Array<'github' | 'arxiv' | 'hn'>;
    limitPerSource?: number;
    compileReport?: boolean;
    submittedById?: string | null;
  }
) {
  await ensureCanonicalTaxonomy(prisma);
  const sources = options?.sources ?? ['github', 'arxiv', 'hn'];
  const limit = Math.min(Math.max(options?.limitPerSource ?? 4, 1), 10);

  const tasks: Promise<RawSignalCandidate[]>[] = [];
  if (sources.includes('github')) tasks.push(fetchLiveGitHubRepos(limit).catch(() => []));
  if (sources.includes('arxiv')) tasks.push(fetchLiveArxivPapers(limit).catch(() => []));
  if (sources.includes('hn')) tasks.push(fetchLiveHackerNewsSignals(limit).catch(() => []));

  const batches = await Promise.all(tasks);
  const candidates = batches.flat();
  const persisted = [];

  for (const candidate of candidates) {
    const saved = await persistSignalCandidate(prisma, {
      ...candidate,
      submittedById: options?.submittedById ?? null,
    });
    persisted.push(saved);
  }

  let report = null;
  if (options?.compileReport && persisted.length > 0) {
    report = await compileEmailReportFromSignals(prisma);
  }

  return {
    ingestedCount: persisted.length,
    signals: persisted,
    report,
  };
}
