'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { CANONICAL_AUTHORS, resolveCanonicalAuthor } from '@/lib/taxonomy';
import type { SignalSummary } from '@/lib/types';

export default function AuthorProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? 'bendee983';
  const author = resolveCanonicalAuthor(slug) ?? CANONICAL_AUTHORS[1]!;

  const [signals, setSignals] = useState<SignalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/signals?limit=25`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data.signals)) {
          setSignals(data.signals);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1040px] px-4 py-10 sm:px-8" data-testid="author-profile-page">
        <div className="border-b border-[var(--border)] pb-8">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-mono text-2xl font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] sm:text-3xl">
              {author.name.toUpperCase()}
            </h1>
            <button
              type="button"
              onClick={() => setFollowing((f) => !f)}
              className={`rounded-xs border px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${
                following
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                  : 'border-[var(--border-strong)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
              }`}
            >
              {following ? 'FOLLOWING' : 'FOLLOW'}
            </button>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {author.bio}
          </p>

          <div className="mt-6 flex flex-wrap gap-8">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                FOCUS AREAS
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {author.focusAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                LINKS
              </div>
              <div className="mt-2 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em]">
                <a
                  href={author.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-primary)] hover:text-[var(--accent)]"
                >
                  WEBSITE
                </a>
                <span className="text-[var(--text-muted)]">•</span>
                <a
                  href={author.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-primary)] hover:text-[var(--accent)]"
                >
                  X
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-b border-[var(--border)] pb-3 font-mono text-xs uppercase tracking-[0.14em]">
          <span className="text-[var(--text-primary)]">EDITORIAL</span>
          <span className="text-[var(--text-muted)]">LATEST</span>
        </div>

        <div className="mt-4 divide-y divide-[var(--border)]">
          {loading ? (
            <div className="py-12 text-center font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Loading articles by {author.name}...
            </div>
          ) : signals.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
              No articles indexed yet.
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
                  <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    <span>{author.name.toUpperCase()}</span>
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
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  {s.upvoteCount || 1}
                </span>
              </article>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
