'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[920px] px-4 py-16 text-center sm:px-8" data-testid="newsletter-page">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          DAILY BRIEFING · 200,000+ AI ENGINEERS
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[var(--text-primary)] sm:text-5xl">
          Stay on top of the latest AI News / Papers / Repos / Models
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          AlphaSignal tracks every breakthrough paper, repository, model release, and engineering deep dive in real time — delivered in a 5-minute daily technical briefing.
        </p>

        {subscribed ? (
          <div className="mx-auto mt-8 max-w-md rounded-sm border border-[var(--accent)] bg-[var(--bg-secondary)] p-6">
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
              SUBSCRIPTION CONFIRMED
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              {email} has been added to the daily AI briefing dispatch.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)]"
            />
            <button
              type="submit"
              className="rounded-xs border border-[var(--text-primary)] bg-[var(--text-primary)] px-6 py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--bg-primary)]"
            >
              SUBSCRIBE
            </button>
          </form>
        )}

        <div className="mt-12 flex justify-center gap-6 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
          <Link href="/archive" className="hover:text-[var(--text-primary)]">
            Browse Issue Archive →
          </Link>
          <Link href="/topics" className="hover:text-[var(--text-primary)]">
            Explore 21 AI Topics →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
