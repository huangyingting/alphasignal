'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { CANONICAL_AUTHORS } from '@/lib/taxonomy';

export default function EditorialTeamPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1040px] px-4 py-12 sm:px-8" data-testid="editorial-team-page">
        <h1 className="font-serif text-4xl text-[var(--text-primary)]">
          Editorial Team
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Meet the engineers, researchers, and editors behind AlphaSignal&apos;s coverage.
        </p>

        {/* Team Grid matching 16-editorial-team.png */}
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {CANONICAL_AUTHORS.map((member) => (
            <Link
              key={member.slug}
              href={`/author/${member.slug}`}
              className="group rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-4 transition hover:border-[var(--text-primary)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xs border border-[var(--border)] bg-[var(--bg-primary)] font-mono text-sm font-semibold text-[var(--text-primary)]">
                {member.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </div>
              <div className="mt-4 font-serif text-lg text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                {member.name}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {member.role}
              </div>
            </Link>
          ))}
        </div>

        {/* Editorial Standards matching deep-inspect.json /editorial-team */}
        <section className="mt-14 border-t border-[var(--border)] pt-10">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Editorial standards
          </p>
          <h2 className="mt-1 font-serif text-3xl text-[var(--text-primary)]">
            AlphaSignal Newsroom
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
            The AlphaSignal Newsroom publishes reporting and analysis on AI models, developer tools, research, infrastructure, companies, benchmarks, product releases, and major industry developments.
          </p>

          <div className="mt-8 divide-y divide-[var(--border)] border-t border-[var(--border)]">
            <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <span className="font-mono text-xs text-[var(--accent)]">01</span>
                <h3 className="mt-1 font-serif text-xl text-[var(--text-primary)]">
                  Editorial responsibility
                </h3>
              </div>
              <div className="text-sm leading-relaxed text-[var(--text-secondary)] sm:col-span-8">
                Editorial oversight of the AlphaSignal Newsroom sits with Ben Dickson, Editorial Lead. AlphaSignal is responsible for the sourcing, accuracy, publication, updates, and corrections of newsroom coverage.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <span className="font-mono text-xs text-[var(--accent)]">02</span>
                <h3 className="mt-1 font-serif text-xl text-[var(--text-primary)]">
                  How we source stories
                </h3>
              </div>
              <div className="text-sm leading-relaxed text-[var(--text-secondary)] sm:col-span-8">
                We report from primary sources first — the original document, dataset, research preprint (arXiv), model card, or on-the-record statement — and verify before we publish.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <span className="font-mono text-xs text-[var(--accent)]">03</span>
                <h3 className="mt-1 font-serif text-xl text-[var(--text-primary)]">
                  Editorial independence
                </h3>
              </div>
              <div className="text-sm leading-relaxed text-[var(--text-secondary)] sm:col-span-8">
                AlphaSignal&apos;s editorial coverage is produced independently from advertising and commercial partnerships. Sponsored or paid content is clearly identified as such.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <span className="font-mono text-xs text-[var(--accent)]">04</span>
                <h3 className="mt-1 font-serif text-xl text-[var(--text-primary)]">
                  Corrections &amp; Contact
                </h3>
              </div>
              <div className="text-sm leading-relaxed text-[var(--text-secondary)] sm:col-span-8">
                Reach the newsroom directly for editorial questions, tips, and corrections at{' '}
                <a
                  href="mailto:editorial@alphasignal.ai"
                  className="font-mono text-[var(--accent)] hover:underline"
                >
                  editorial@alphasignal.ai
                </a>
                .
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
