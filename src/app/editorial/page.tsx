'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { SignalDetailModal } from '@/components/SignalDetailModal';
import type { SignalSummary } from '@/lib/types';

const EDITORIAL_TABS = ['ALL', 'DEEP DIVE', 'TUTORIAL', 'OPINION'] as const;

export default function EditorialPage() {
  const [signals, setSignals] = useState<SignalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<(typeof EDITORIAL_TABS)[number]>('ALL');
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  const loadSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/signals?limit=80', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.signals)) {
        setSignals(data.signals);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSignals();
  }, [loadSignals]);

  const classifyEditorialFormat = (s: SignalSummary): 'DEEP DIVE' | 'TUTORIAL' | 'OPINION' => {
    const text = `${s.title} ${s.summary}`.toLowerCase();
    if (text.includes('how to') || text.includes('guide') || text.includes('tutorial') || s.category === 'Trending Repos') {
      return 'TUTORIAL';
    }
    if (text.includes('why ') || text.includes('what belongs') || text.includes('opinion') || text.includes('should')) {
      return 'OPINION';
    }
    return 'DEEP DIVE';
  };

  const filteredSignals = useMemo(() => {
    if (activeTab === 'ALL') return signals;
    return signals.filter((s) => classifyEditorialFormat(s) === activeTab);
  }, [signals, activeTab]);

  const handleUpvote = async (signalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/signals/${signalId}/upvote`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setSignals((prev) =>
        prev.map((s) =>
          s.id === signalId
            ? { ...s, upvoteCount: data.upvoteCount, viewerUpvoted: data.upvoted }
            : s
        )
      );
    }
  };

  const featuredLead = filteredSignals[0] ?? null;
  const secondaryHighlights = filteredSignals.slice(1, 5);
  const rightColumnStories = filteredSignals.slice(5, 9);
  const archiveStories = filteredSignals.slice(9);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8" data-testid="editorial-page">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
              ALPHASIGNAL NEWSROOM
            </p>
            <h1 className="mt-1 font-serif text-3xl text-[var(--text-primary)] sm:text-4xl">
              Editorial
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Editorial format">
            {EDITORIAL_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xs border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
                  activeTab === tab
                    ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Loading editorial coverage...
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-10 text-center">
            <p className="font-serif text-xl text-[var(--text-primary)]">
              No editorial articles published in this view yet.
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Ingest live signals from the home feed or publish an editorial piece to populate this newsroom view.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/"
                className="rounded-xs border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--bg-primary)]"
              >
                Go to Latest Feed
              </Link>
              <Link
                href="/editorial-team"
                className="rounded-xs border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Editorial Standards
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 border-b border-[var(--border)] pb-10 lg:grid-cols-12">
              {/* Left column */}
              <div className="space-y-6 lg:col-span-3 lg:border-r lg:border-[var(--border)] lg:pr-6">
                {secondaryHighlights.map((item) => {
                  const format = classifyEditorialFormat(item);
                  const authorSlug = (item.authorHandle ?? 'bendee983').replace(/^@/, '');
                  return (
                    <article
                      key={item.id}
                      className="border-b border-[var(--border)] pb-5 last:border-b-0"
                    >
                      <Link
                        href={`/news/${item.slug}`}
                        className="font-serif text-lg leading-snug text-[var(--text-primary)] hover:text-[var(--accent)]"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {item.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        <Link
                          href={`/author/${authorSlug}`}
                          className="text-[var(--text-secondary)] hover:underline"
                        >
                          {item.authorName ?? 'BEN DICKSON'}
                        </Link>
                        <span>·</span>
                        <span>{format}</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Center hero */}
              <div className="lg:col-span-6 lg:px-4">
                {featuredLead ? (
                  <article className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">
                      <span>{classifyEditorialFormat(featuredLead)}</span>
                      <button
                        type="button"
                        onClick={(e) => handleUpvote(featuredLead.id, e)}
                        className="rounded-xs border border-[var(--border)] px-2.5 py-1 text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                      >
                        ▲ {featuredLead.metricsValue + featuredLead.upvoteCount}
                      </button>
                    </div>
                    <h2 className="mt-3 font-serif text-2xl leading-tight text-[var(--text-primary)] sm:text-3xl">
                      <Link href={`/news/${featuredLead.slug}`} className="hover:text-[var(--accent)]">
                        {featuredLead.title}
                      </Link>
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {featuredLead.whatHappened || featuredLead.summary}
                    </p>
                    {featuredLead.keyInsights.length > 0 && (
                      <ul className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4 text-xs text-[var(--text-secondary)]">
                        {featuredLead.keyInsights.slice(0, 3).map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-mono text-[var(--accent)]">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      <div>
                        <Link
                          href={`/author/${(featuredLead.authorHandle ?? 'bendee983').replace(/^@/, '')}`}
                          className="text-[var(--text-primary)] hover:underline"
                        >
                          {featuredLead.authorName ?? 'BEN DICKSON'}
                        </Link>
                        <span className="mx-2">·</span>
                        <span>{classifyEditorialFormat(featuredLead)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSignalId(featuredLead.id)}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          QUICK DRAWER
                        </button>
                        <Link
                          href={`/news/${featuredLead.slug}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          READ ARTICLE →
                        </Link>
                      </div>
                    </div>
                  </article>
                ) : null}
              </div>

              {/* Right column */}
              <div className="space-y-6 lg:col-span-3 lg:border-l lg:border-[var(--border)] lg:pl-6">
                {rightColumnStories.map((item) => {
                  const format = classifyEditorialFormat(item);
                  const authorSlug = (item.authorHandle ?? 'adham-khaled').replace(/^@/, '');
                  return (
                    <article
                      key={item.id}
                      className="border-b border-[var(--border)] pb-5 last:border-b-0"
                    >
                      <Link
                        href={`/news/${item.slug}`}
                        className="font-serif text-lg leading-snug text-[var(--text-primary)] hover:text-[var(--accent)]"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {item.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        <Link
                          href={`/author/${authorSlug}`}
                          className="text-[var(--text-secondary)] hover:underline"
                        >
                          {item.authorName ?? 'ADHAM KHALED'}
                        </Link>
                        <span>·</span>
                        <span>{format}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {archiveStories.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {archiveStories.map((item) => {
                  const primaryTopic = item.topics[0]?.topicName?.toUpperCase() ?? 'LLMS';
                  return (
                    <article
                      key={item.id}
                      className="flex flex-col justify-between rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          <span>{primaryTopic}</span>
                          <button
                            type="button"
                            onClick={(e) => handleUpvote(item.id, e)}
                            className="hover:text-[var(--text-primary)]"
                          >
                            ▲ {item.upvoteCount || 1}
                          </button>
                        </div>
                        <h3 className="mt-2 font-serif text-lg leading-snug text-[var(--text-primary)]">
                          <Link href={`/news/${item.slug}`} className="hover:text-[var(--accent)]">
                            {item.title}
                          </Link>
                        </h3>
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                          {item.summary}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        <span>{item.authorName ?? 'BEN DICKSON'}</span>
                        <span>·</span>
                        <span>
                          {new Date(item.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                          })}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <SignalDetailModal
        signalId={selectedSignalId}
        onClose={() => setSelectedSignalId(null)}
      />
    </AppShell>
  );
}
