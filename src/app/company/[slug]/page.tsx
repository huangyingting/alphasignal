'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import type { SignalSummary } from '@/lib/types';

type CompanyDetail = {
  slug: string;
  name: string;
  domain: string;
  bio: string;
  xUrl: string;
  websiteUrl: string;
  focusAreas: string[];
  monthlyActivity: { month: string; count: number }[];
};

const TYPE_TABS = ['ALL', 'NEWS', 'MODELS', 'REPOS'] as const;

export default function CompanyProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? 'openai';

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [signals, setSignals] = useState<SignalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<(typeof TYPE_TABS)[number]>('ALL');
  const [sort, setSort] = useState<'latest' | 'upvotes'>('latest');
  const [following, setFollowing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/companies/${encodeURIComponent(slug)}?category=${activeType}&sort=${sort}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setCompany(data.company);
        setSignals(Array.isArray(data.signals) ? data.signals : []);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, activeType, sort]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleFollow = async () => {
    const next = !following;
    setFollowing(next);
    try {
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const current: string[] =
          settingsData.personalization?.followedCompanies ?? [];
        const updated = next
          ? Array.from(new Set([...current, slug]))
          : current.filter((c) => c !== slug);
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalization: { followedCompanies: updated },
          }),
        });
      }
    } catch {
      // Unauthenticated viewers retain local toggle state
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8">
        {company ? (
          <>
            <div className="grid grid-cols-1 gap-8 border-b border-[var(--border)] pb-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="font-mono text-2xl font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] sm:text-3xl">
                    {company.name}
                  </h1>
                  <button
                    type="button"
                    onClick={toggleFollow}
                    data-testid="company-follow-button"
                    className={`rounded-xs border px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] transition ${
                      following
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                        : 'border-[var(--border-strong)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--text-primary)]'
                    }`}
                  >
                    {following ? 'FOLLOWING' : 'FOLLOW'}
                  </button>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {company.bio}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      FOCUS AREAS
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {company.focusAreas.map((area) => (
                        <Link
                          key={area}
                          href={`/topic/${area.toLowerCase().replace(/\s+/g, '-')}`}
                          className="rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          {area}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      LINKS
                    </div>
                    <div className="mt-2 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.14em]">
                      <a
                        href={company.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-primary)] hover:text-[var(--accent)] hover:underline"
                      >
                        WEBSITE
                      </a>
                      <span className="text-[var(--text-muted)]">•</span>
                      <a
                        href={company.xUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-primary)] hover:text-[var(--accent)] hover:underline"
                      >
                        X
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 12-month activity histogram */}
              <div className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-5 lg:col-span-5">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <span>LAST 12 MONTHS</span>
                  <span>2026</span>
                </div>
                <div className="mt-6 grid grid-cols-12 items-end gap-1.5 h-24">
                  {company.monthlyActivity.map((item, idx) => {
                    const maxCount = Math.max(
                      1,
                      ...company.monthlyActivity.map((m) => m.count)
                    );
                    const pct = Math.max(12, Math.round((item.count / maxCount) * 100));
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <div className="flex h-16 w-full items-end justify-center rounded-xs bg-[var(--bg-primary)] p-0.5">
                          <div
                            style={{ height: `${pct}%` }}
                            className={`w-full rounded-xs ${
                              item.count > 0
                                ? 'bg-[var(--accent)]'
                                : 'bg-[var(--border)]'
                            }`}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Type filter & sort */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div className="flex flex-wrap gap-1.5">
                {TYPE_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveType(tab)}
                    className={`rounded-xs border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${
                      activeType === tab
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {tab}
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
                  onClick={() => setSort('upvotes')}
                  className={
                    sort === 'upvotes'
                      ? 'text-[var(--text-primary)] underline underline-offset-4'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }
                >
                  UPVOTES
                </button>
              </div>
            </div>

            {/* Signals list */}
            <div className="mt-6 divide-y divide-[var(--border)]">
              {loading ? (
                <div className="py-12 text-center font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Loading signals for {company.name}...
                </div>
              ) : signals.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
                  No signals indexed for {company.name} in this category yet.
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
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        <span>{company.name.toUpperCase()}</span>
                        <span>·</span>
                        <span>{s.topics[0]?.topicName?.toUpperCase() ?? 'LLMS'}</span>
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
          </>
        ) : (
          <div className="py-16 text-center font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {loading ? 'Loading company profile...' : 'Company not found.'}
          </div>
        )}
      </div>
    </AppShell>
  );
}
