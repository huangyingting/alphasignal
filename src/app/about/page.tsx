'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export default function AboutPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[920px] px-4 py-12 sm:px-8" data-testid="about-page">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          AI IS NOT JUST ACCELERATING
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--text-primary)] sm:text-5xl">
          It is compounding
        </h1>

        <p className="mt-6 text-base leading-relaxed text-[var(--text-secondary)]">
          Five years ago, you could follow AI by reading a handful of papers a month and checking Twitter on Fridays. One person could hold the field in their head.
        </p>

        <blockquote className="my-8 border-l-2 border-[var(--accent)] pl-5 font-serif text-2xl text-[var(--text-primary)]">
          280,000 research papers on arXiv in 2025. Over a million new repositories on GitHub. Four million models and datasets on Hugging Face.
        </blockquote>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">
          <section className="border-t border-[var(--border)] pt-6">
            <span className="font-mono text-xs text-[var(--accent)]">01</span>
            <h2 className="mt-1 font-serif text-2xl text-[var(--text-primary)]">
              The intelligence layer
            </h2>
            <p className="mt-3">
              AlphaSignal is the intelligence layer between everything happening in AI and the engineers, researchers, and technical leaders who build with it. We monitor every major repository, preprint server, benchmark leaderboard, and lab announcement in real time.
            </p>
          </section>

          <section className="border-t border-[var(--border)] pt-6">
            <span className="font-mono text-xs text-[var(--accent)]">02</span>
            <h2 className="mt-1 font-serif text-2xl text-[var(--text-primary)]">
              The foundation
            </h2>
            <p className="mt-3">
              Every day, our ranking pipeline ingests thousands of candidate signals across GitHub, arXiv, Hugging Face, and engineering blogs, scoring them by technical novelty, reproducible benchmarks, and community traction.
            </p>
          </section>

          <section className="border-t border-[var(--border)] pt-6">
            <span className="font-mono text-xs text-[var(--accent)]">03</span>
            <h2 className="mt-1 font-serif text-2xl text-[var(--text-primary)]">
              What this means
            </h2>
            <p className="mt-3">
              Instead of drowning in hype threads, you get structured technical signal: what happened, why it matters, primary sources, and how it fits into your stack.
            </p>
          </section>
        </div>

        <div className="mt-10 rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl text-[var(--text-primary)]">
                Join 200,000+ AI engineers and researchers
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Explore the live feed or read our Editorial Newsroom standards.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="rounded-xs border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--bg-primary)]"
              >
                Explore Feed
              </Link>
              <Link
                href="/editorial-team"
                className="rounded-xs border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Editorial Team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
