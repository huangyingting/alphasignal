'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

type LeaderboardRow = {
  id: string;
  rank: number;
  slug: string;
  name: string;
  domain: string;
  bio: string;
  signalCount: number;
  likes: number;
  focusAreas: string[];
};

type TopicOption = {
  slug: string;
  name: string;
};

export default function CompanyLeaderboardPage() {
  const [companies, setCompanies] = useState<LeaderboardRow[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const param = activeTopic === 'ALL' ? '' : `?topic=${encodeURIComponent(activeTopic.toLowerCase())}`;
    fetch(`/api/companies${param}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data.companies)) setCompanies(data.companies);
        if (Array.isArray(data.topics)) setTopics(data.topics);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTopic]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <h1 className="font-serif text-4xl text-[var(--text-primary)]">Leaderboard</h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {companies.length} COMPANIES
            </p>
          </div>
          <a
            href="mailto:alpha@alphasignal.ai?subject=Get%20Listed%20on%20AlphaSignal"
            className="rounded-xs border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-primary)] hover:border-[var(--text-primary)]"
          >
            GET LISTED
          </a>
        </div>

        {/* Topic filter pills matching 07-company-leaderboard.png */}
        <div className="mt-6 flex flex-wrap gap-1.5" role="tablist" aria-label="Leaderboard topics">
          <button
            type="button"
            onClick={() => setActiveTopic('ALL')}
            className={`rounded-xs border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
              activeTopic === 'ALL'
                ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            ALL
          </button>
          {topics.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setActiveTopic(t.slug.toUpperCase())}
              className={`rounded-xs border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
                activeTopic === t.slug.toUpperCase()
                  ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                  : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Ranked table */}
        <div className="mt-8 overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="grid grid-cols-12 border-b border-[var(--border)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)] sm:px-6">
            <div className="col-span-2 sm:col-span-1">RANK</div>
            <div className="col-span-7 sm:col-span-8">COMPANY</div>
            <div className="col-span-3 text-right">LIKES</div>
          </div>

          {loading ? (
            <div className="p-10 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Loading company leaderboard...
            </div>
          ) : companies.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--text-secondary)]">
              No companies matched the selected topic filter.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {companies.map((c) => (
                <Link
                  key={c.slug}
                  href={`/company/${c.slug}`}
                  data-testid="leaderboard-row"
                  className="grid grid-cols-12 items-center px-4 py-3.5 transition hover:bg-[var(--bg-tertiary)] sm:px-6"
                >
                  <div className="col-span-2 font-mono text-xs text-[var(--text-muted)] sm:col-span-1">
                    #{c.rank}
                  </div>
                  <div className="col-span-7 flex items-center gap-3 sm:col-span-8">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-[var(--border)] bg-[var(--bg-primary)] font-mono text-xs font-semibold text-[var(--text-primary)]">
                      {c.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-[var(--text-primary)]">
                        {c.name}
                      </div>
                      <div className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        {c.focusAreas.slice(0, 3).join(' · ')}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 text-right font-mono text-xs text-[var(--text-primary)]">
                    {c.likes.toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
