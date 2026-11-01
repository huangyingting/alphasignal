'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { CANONICAL_TOPICS, normalizeTaxonomySlug } from '@/lib/taxonomy';
import type { SignalSummary } from '@/lib/types';

const TYPE_FILTERS = [
  { label: 'ALL', category: 'All' },
  { label: 'NEWS', category: 'Top News' },
  { label: 'PAPERS', category: 'Top Papers' },
  { label: 'MODELS', category: 'Models' },
  { label: 'REPOS', category: 'Trending Repos' },
] as const;

export default function TopicFeedPage() {
  const params = useParams<{ slug: string; subtopic?: string }>();
  const rawTopicSlug = params?.slug ?? 'agents';
  const rawSubtopicSlug = params?.subtopic ?? '';

  const canonicalTopic =
    CANONICAL_TOPICS.find(
      (t) => normalizeTaxonomySlug(t.slug) === normalizeTaxonomySlug(rawTopicSlug)
    ) ?? CANONICAL_TOPICS[0]!;

  const [signals, setSignals] = useState<SignalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>('ALL');
  const [sort, setSort] = useState<'latest' | 'score'>('latest');
  const [following, setFollowing] = useState(false);

  const loadSignals = useCallback(async () => {
    setLoading(true);
    try {
      const typeObj = TYPE_FILTERS.find((t) => t.label === activeType);
      const query = new URLSearchParams({
        topic: canonicalTopic.slug,
        sort,
      });
      if (rawSubtopicSlug) {
        query.set('subtopic', normalizeTaxonomySlug(rawSubtopicSlug));
      }
      if (typeObj && typeObj.category !== 'All') {
        query.set('category', typeObj.category);
      }
      const res = await fetch(`/api/signals?${query.toString()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setSignals(Array.isArray(data.signals) ? data.signals : []);
      }
    } finally {
      setLoading(false);
    }
  }, [canonicalTopic.slug, rawSubtopicSlug, activeType, sort]);

  useEffect(() => {
    void loadSignals();
  }, [loadSignals]);

  const toggleFollow = async () => {
    const next = !following;
    setFollowing(next);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        const current: string[] = data.personalization?.followedTopics ?? [];
        const updated = next
          ? Array.from(new Set([...current, canonicalTopic.slug]))
          : current.filter((t) => t !== canonicalTopic.slug);
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalization: { followedTopics: updated },
          }),
        });
      }
    } catch {
      // Local follow fallback for unauthenticated visitors
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8">
        <div className="border-b border-[var(--border)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] sm:text-3xl">
                {canonicalTopic.name.toUpperCase()}
                {rawSubtopicSlug
                  ? ` / ${rawSubtopicSlug.replace(/[-_]/g, ' ').toUpperCase()}`
                  : ''}
              </h1>
              <button
                type="button"
                onClick={toggleFollow}
                data-testid="topic-follow-button"
                title="You will receive a notification for every post above 1000 upvotes"
                className={`rounded-xs border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.15em] transition ${
                  following
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                    : 'border-[var(--border-strong)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--text-primary)]'
                }`}
              >
                {following ? 'FOLLOWING' : 'FOLLOW'}
              </button>
            </div>
            <Link
              href="/topics"
              className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ← ALL TOPICS
            </Link>
          </div>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {canonicalTopic.description}
          </p>

          {/* Subtopic filter pills matching 08-topic-agents.png & 38-subtopic-feed.png */}
          <div className="mt-5 flex flex-wrap gap-1.5">
            <Link
              href={`/topic/${canonicalTopic.slug.replace(/_/g, '-')}`}
              className={`rounded-xs border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${
                !rawSubtopicSlug
                  ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                  : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              ALL {canonicalTopic.name.toUpperCase()}
            </Link>
            {canonicalTopic.subtopics.map((sub) => {
              const isSelected =
                normalizeTaxonomySlug(rawSubtopicSlug) ===
                normalizeTaxonomySlug(sub.slug);
              return (
                <Link
                  key={sub.slug}
                  href={`/topic/${canonicalTopic.slug.replace(/_/g, '-')}/${sub.slug.replace(/_/g, '-')}`}
                  className={`rounded-xs border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${
                    isSelected
                      ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {sub.name.toUpperCase()}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Type filter tabs + Sort */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((tf) => (
              <button
                key={tf.label}
                type="button"
                onClick={() => setActiveType(tf.label)}
                className={`rounded-xs border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${
                  activeType === tf.label
                    ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
            <button
              type="button"
              onClick={() => setSort('latest')}
              className={
                sort === 'latest'
                  ? 'text-[var(--text-primary)] underline underline-offset-4'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }
            >
              LATEST
            </button>
            <span className="text-[var(--text-muted)]">/</span>
            <button
              type="button"
              onClick={() => setSort('score')}
              className={
                sort === 'score'
                  ? 'text-[var(--text-primary)] underline underline-offset-4'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }
            >
              UPVOTES
            </button>
          </div>
        </div>

        {/* Signals feed */}
        <div className="mt-6 divide-y divide-[var(--border)]">
          {loading ? (
            <div className="py-12 text-center font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Loading topic feed...
            </div>
          ) : signals.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
              No signals indexed for this topic filter yet.
            </div>
          ) : (
            signals.map((s) => (
              <article
                key={s.id}
                className="flex items-start justify-between gap-4 py-4"
              >
                <div>
                  <Link
                    href={`/news/${s.slug}`}
                    className="font-serif text-lg text-[var(--text-primary)] hover:text-[var(--accent)]"
                  >
                    {s.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                    {s.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    <span>{s.sourceName}</span>
                    <span>·</span>
                    <span>{canonicalTopic.name.toUpperCase()}</span>
                    <span>·</span>
                    <span>
                      {new Date(s.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 font-mono text-xs text-[var(--text-primary)]">
                  {(s.metricsValue + s.upvoteCount).toLocaleString()}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
