'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import type { SignalDetail, SignalSummary } from '@/lib/types';

export default function NewsArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const [signal, setSignal] = useState<SignalDetail | null>(null);
  const [nextReads, setNextReads] = useState<SignalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [takeawaysOpen, setTakeawaysOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [newListPrompt, setNewListPrompt] = useState(false);
  const [customListName, setCustomListName] = useState('');

  const loadArticle = useCallback(async () => {
    setLoading(true);
    try {
      const [detailRes, feedRes] = await Promise.all([
        fetch(`/api/signals/${encodeURIComponent(slug)}`, { cache: 'no-store' }),
        fetch('/api/signals?limit=6', { cache: 'no-store' }),
      ]);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setSignal(detailData.signal);
      }
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        if (Array.isArray(feedData.signals)) {
          setNextReads(
            feedData.signals.filter((s: SignalSummary) => s.slug !== slug).slice(0, 4)
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadArticle();
  }, [loadArticle]);

  const handleUpvote = async () => {
    if (!signal) return;
    const res = await fetch(`/api/signals/${signal.id}/upvote`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setSignal((prev) =>
        prev
          ? { ...prev, upvoteCount: data.upvoteCount, viewerUpvoted: data.upvoted }
          : prev
      );
    }
  };

  const handleBookmark = async (folder?: string) => {
    if (!signal) return;
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signalId: signal.id,
        folder: folder || 'READING LIST',
        toggle: !folder,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSignal((prev) =>
        prev ? { ...prev, viewerBookmarked: data.bookmarked } : prev
      );
      setNewListPrompt(false);
      setCustomListName('');
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      void navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signal || !commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/signals/${signal.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody }),
      });
      if (res.ok) {
        setCommentBody('');
        await loadArticle();
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const tocSections = [
    { id: 'introduction', label: 'Introduction' },
    { id: 'what-happened', label: 'Technical Breakdown' },
    { id: 'why-it-matters', label: 'Why It Matters for Engineers' },
    { id: 'sources', label: 'Primary Sources' },
    { id: 'comments', label: 'Comments' },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8" data-testid="news-article-page">
        {loading ? (
          <div className="py-16 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Loading article...
          </div>
        ) : !signal ? (
          <div className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-10 text-center">
            <h1 className="font-serif text-2xl text-[var(--text-primary)]">
              Article not found
            </h1>
            <Link
              href="/"
              className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.14em] text-[var(--accent)] hover:underline"
            >
              ← Return to Latest Feed
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Sticky Left Table of Contents matching 10-news-*.png */}
            <aside className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-24 space-y-2 border-l border-[var(--border)] pl-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  ON THIS PAGE
                </div>
                {tocSections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block py-1 text-xs text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                  >
                    {sec.label}
                  </a>
                ))}
              </div>
            </aside>

            {/* Main Article Column */}
            <div className="lg:col-span-9">
              <header id="introduction" className="border-b border-[var(--border)] pb-6">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {signal.companies[0] ? (
                    <Link
                      href={`/company/${signal.companies[0].slug}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {signal.companies[0].name.toUpperCase()}
                    </Link>
                  ) : (
                    <span>{signal.sourceName.toUpperCase()}</span>
                  )}
                  <span>·</span>
                  <span>
                    {new Date(signal.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h1 className="mt-3 font-serif text-3xl leading-tight text-[var(--text-primary)] sm:text-4xl">
                  {signal.title}
                </h1>
                <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
                  {signal.summary}
                </p>

                {/* Metadata Grid matching 10-news-*.png */}
                <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-[var(--border)] py-4 font-mono text-[11px] uppercase tracking-[0.14em] sm:grid-cols-5">
                  <div>
                    <dt className="text-[var(--text-muted)]">AUTHOR</dt>
                    <dd className="mt-1 text-[var(--text-primary)]">
                      BY {signal.authorName ?? 'ALPHASIGNAL NEWSROOM'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">READ</dt>
                    <dd className="mt-1 text-[var(--text-primary)]">5 MIN</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">TYPE</dt>
                    <dd className="mt-1 text-[var(--text-primary)]">
                      {signal.category.toUpperCase()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">TOPIC</dt>
                    <dd className="mt-1 text-[var(--text-primary)]">
                      {signal.topics.map((t) => t.topicName.toUpperCase()).join(' · ') || 'LLMS'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">SUBTOPIC</dt>
                    <dd className="mt-1 text-[var(--text-primary)]">
                      {signal.topics[0]?.subtopicName?.replace(/_/g, ' ').toUpperCase() ??
                        'FOUNDATION MODELS'}
                    </dd>
                  </div>
                </dl>

                {/* Action bar: Upvote, Bookmark (+Create new list), Share (Copy link) */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUpvote}
                      aria-label="Upvote"
                      className={`rounded-xs border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition ${
                        signal.viewerUpvoted
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                          : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--text-primary)]'
                      }`}
                    >
                      ▲ {(signal.metricsValue + signal.upvoteCount).toLocaleString()}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBookmark()}
                      aria-label="Bookmark"
                      className={`rounded-xs border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition ${
                        signal.viewerBookmarked
                          ? 'border-[var(--accent)] text-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {signal.viewerBookmarked ? '★ BOOKMARKED' : '☆ BOOKMARK'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewListPrompt((v) => !v)}
                      className="rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      +Create new list
                    </button>
                  </div>

                  <div className="relative flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShareOpen((v) => !v)}
                      aria-label="Share"
                      className="rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {copiedLink ? 'Copied!' : 'Copy link'}
                    </button>

                    {shareOpen && (
                      <div className="absolute right-0 top-10 z-20 flex gap-2 rounded-xs border border-[var(--border-strong)] bg-[var(--bg-secondary)] p-2 font-mono text-[11px] uppercase shadow-lg">
                        <a
                          href={`https://x.com/intent/tweet?text=${encodeURIComponent(signal.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 hover:text-[var(--accent)]"
                        >
                          X
                        </a>
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(signal.originalUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 hover:text-[var(--accent)]"
                        >
                          LinkedIn
                        </a>
                        <a
                          href={`mailto:?subject=${encodeURIComponent(signal.title)}&body=${encodeURIComponent(signal.originalUrl)}`}
                          className="px-2 py-1 hover:text-[var(--accent)]"
                        >
                          Email
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {newListPrompt && (
                  <div className="mt-3 flex items-center gap-2 rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
                    <input
                      type="text"
                      value={customListName}
                      onChange={(e) => setCustomListName(e.target.value)}
                      placeholder="List name (e.g. Agent Evaluations)"
                      className="flex-1 rounded-xs border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleBookmark(customListName.trim() || 'READING LIST')}
                      className="rounded-xs border border-[var(--text-primary)] bg-[var(--text-primary)] px-3 py-1.5 font-mono text-xs uppercase text-[var(--bg-primary)]"
                    >
                      Save to List
                    </button>
                  </div>
                )}
              </header>

              {/* Collapsible TAKEAWAYS box matching 10-news-*.png & 32-takeaways-collapse.png */}
              <section
                className="my-8 rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-5"
                data-testid="takeaways-box"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
                    TAKEAWAYS
                  </span>
                  <button
                    type="button"
                    onClick={() => setTakeawaysOpen((v) => !v)}
                    aria-label="Toggle takeaways"
                    className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    {takeawaysOpen ? '−' : '+'}
                  </button>
                </div>
                {takeawaysOpen && (
                  <ul className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-secondary)]">
                    {(signal.keyInsights.length > 0
                      ? signal.keyInsights
                      : [signal.summary, signal.whyItMatters].filter(Boolean)
                    ).map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="font-mono text-[var(--accent)]">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Article Narrative Sections */}
              <div className="space-y-6 text-base leading-relaxed text-[var(--text-secondary)]">
                <section id="what-happened">
                  <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                    Technical Breakdown
                  </h2>
                  <p className="mt-3 whitespace-pre-line">{signal.whatHappened}</p>
                </section>

                <section id="why-it-matters">
                  <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                    Why It Matters for Engineers
                  </h2>
                  <p className="mt-3 whitespace-pre-line">{signal.whyItMatters}</p>
                </section>
              </div>

              {/* Expandable Sources + Article Feedback */}
              <section
                id="sources"
                className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--border)] py-4"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => setSourcesOpen((v) => !v)}
                    className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-primary)] hover:text-[var(--accent)]"
                  >
                    1 source {sourcesOpen ? '▲' : '▼'}
                  </button>
                  {sourcesOpen && (
                    <div className="mt-2 text-xs">
                      <a
                        href={signal.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[var(--accent)] hover:underline"
                      >
                        {signal.sourceName}: {signal.originalUrl} ↗
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em]">
                  <button
                    type="button"
                    aria-label="Like"
                    onClick={() => setFeedback('like')}
                    className={`rounded-xs border px-2.5 py-1 ${
                      feedback === 'like'
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Like
                  </button>
                  <button
                    type="button"
                    aria-label="Dislike"
                    onClick={() => setFeedback('dislike')}
                    className={`rounded-xs border px-2.5 py-1 ${
                      feedback === 'dislike'
                        ? 'border-red-400 text-red-400'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Dislike
                  </button>
                </div>
              </section>

              {/* Comments Section */}
              <section id="comments" className="mt-10">
                <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                  Comments ({signal.comments.length})
                </h2>
                <form onSubmit={handleCommentSubmit} className="mt-4 space-y-3">
                  <textarea
                    rows={3}
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="w-full rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-primary)]"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentBody.trim()}
                    className="rounded-xs border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--bg-primary)] disabled:opacity-50"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>

                <div className="mt-6 space-y-4">
                  {signal.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] text-[var(--text-muted)]">
                        <span className="text-[var(--text-primary)]">
                          @{c.author.username}
                        </span>
                        <span>
                          {new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {c.body}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Next Reads */}
              {nextReads.length > 0 && (
                <section className="mt-12 border-t border-[var(--border)] pt-8">
                  <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                    Next Reads
                  </h2>
                  <div className="mt-4 divide-y divide-[var(--border)]">
                    {nextReads.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-3.5"
                      >
                        <div>
                          <Link
                            href={`/news/${item.slug}`}
                            className="font-serif text-lg text-[var(--text-primary)] hover:text-[var(--accent)]"
                          >
                            {item.title}
                          </Link>
                          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                            {item.sourceName} ·{' '}
                            {new Date(item.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: '2-digit',
                            })}
                          </div>
                        </div>
                        <span className="font-mono text-xs text-[var(--text-secondary)]">
                          {(item.metricsValue + item.upvoteCount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
