'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Copy,
  MessageSquare,
  ThumbsUp,
  X,
} from 'lucide-react';

export type SignalCommentItem = {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  upvoteCount: number;
  viewerUpvoted: boolean;
};

export type SignalDetailData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  keyInsights: string[];
  category: string;
  sourceType: string;
  sourceName: string;
  originalUrl: string;
  metricsLabel: string | null;
  metricsValue: number;
  authorName: string | null;
  authorHandle: string | null;
  publishedAt: string;
  upvoteCount: number;
  commentCount: number;
  bookmarkCount: number;
  viewerUpvoted: boolean;
  viewerBookmarked: boolean;
  topics: {
    topicSlug: string;
    topicName: string;
    subtopicSlug: string | null;
    subtopicName: string | null;
  }[];
  companies: {
    slug: string;
    name: string;
    domain: string | null;
  }[];
  comments?: SignalCommentItem[];
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function SignalDetailDrawer({
  signalId,
  onClose,
  isAuthenticated,
  onSignalUpdated,
}: {
  signalId: string | null;
  onClose: () => void;
  isAuthenticated: boolean;
  onSignalUpdated?: () => void;
}) {
  const [detail, setDetail] = useState<SignalDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!signalId) {
      setDetail(null);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/signals/${encodeURIComponent(signalId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.signal) {
          setDetail(data.signal);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [signalId]);

  if (!signalId) return null;

  async function handleToggleUpvote() {
    if (!detail) return;
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    const res = await fetch(`/api/signals/${encodeURIComponent(detail.id)}/upvote`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              viewerUpvoted: data.upvoted,
              upvoteCount: data.upvoteCount,
            }
          : prev
      );
      onSignalUpdated?.();
    }
  }

  async function handleToggleBookmark() {
    if (!detail) return;
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signalId: detail.id, toggle: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              viewerBookmarked: Boolean(data.bookmarked),
            }
          : prev
      );
      onSignalUpdated?.();
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !commentBody.trim()) return;
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setSubmittingComment(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/signals/${encodeURIComponent(detail.id)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: commentBody.trim(),
          parentId: replyToId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommentError(data.error ?? 'Failed to post comment.');
      } else if (data.comment) {
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                commentCount: prev.commentCount + 1,
                comments: [...(prev.comments ?? []), data.comment],
              }
            : prev
        );
        setCommentBody('');
        setReplyToId(null);
        onSignalUpdated?.();
      }
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleToggleCommentUpvote(commentId: string) {
    if (!detail) return;
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    const res = await fetch(`/api/signals/${encodeURIComponent(detail.id)}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) {
      const data = await res.json();
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments ?? []).map((c) =>
                c.id === commentId
                  ? {
                      ...c,
                      viewerUpvoted: data.upvoted,
                      upvoteCount: data.upvoteCount,
                    }
                  : c
              ),
            }
          : prev
      );
    }
  }

  function handleCopyLink() {
    if (!detail) return;
    const url = `${window.location.origin}/?signal=${encodeURIComponent(detail.id)}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const rootComments = (detail?.comments ?? []).filter((c) => !c.parentId);
  const repliesByParent = new Map<string, SignalCommentItem[]>();
  for (const c of detail?.comments ?? []) {
    if (c.parentId) {
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Signal details"
    >
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-[#050505] border-l border-[#222222] h-full overflow-y-auto flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#050505]/95 backdrop-blur-md border-b border-[#222222]">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-[#737373]">
            <span className="text-[#ededed] px-2 py-0.5 border border-[#222222] bg-[#0c0c0c]">
              {detail?.category ?? 'SIGNAL'}
            </span>
            {detail?.sourceName && <span>{detail.sourceName}</span>}
            {detail?.publishedAt && <span>• {formatDate(detail.publishedAt)}</span>}
          </div>

          <div className="flex items-center gap-2">
            {detail?.slug && (
              <Link
                href={`/news/${encodeURIComponent(detail.slug)}`}
                onClick={onClose}
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#222222] bg-[#0a0a0a] hover:border-[#444444] text-xs font-mono uppercase text-[#ededed]"
                data-testid="drawer-full-article-link"
              >
                <span>Full Page</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#222222] bg-[#0a0a0a] hover:border-[#444444] text-xs font-mono uppercase text-[#c5c5c5]"
              title="Copy link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close detail drawer"
              className="p-1.5 border border-[#222222] bg-[#0a0a0a] hover:border-[#444444] text-[#c5c5c5]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading || !detail ? (
          <div className="p-8 font-mono text-xs uppercase text-[#737373]">
            Loading signal intelligence...
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-8 flex-1">
            {/* Title & Actions */}
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#ededed] leading-snug font-normal">
                {detail.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleUpvote}
                  data-testid="drawer-upvote-button"
                  className={`flex items-center gap-2 px-3 py-1.5 border font-mono text-xs uppercase transition-colors ${
                    detail.viewerUpvoted
                      ? 'border-[#ededed] bg-[#ededed] text-[#030303]'
                      : 'border-[#222222] bg-[#0c0c0c] text-[#ededed] hover:border-[#444444]'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Upvote</span>
                  <span>({detail.upvoteCount})</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  data-testid="drawer-bookmark-button"
                  className={`flex items-center gap-2 px-3 py-1.5 border font-mono text-xs uppercase transition-colors ${
                    detail.viewerBookmarked
                      ? 'border-[#ededed] bg-[#1a1a1a] text-[#ededed]'
                      : 'border-[#222222] bg-[#0c0c0c] text-[#c5c5c5] hover:border-[#444444]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{detail.viewerBookmarked ? 'Saved' : 'Bookmark'}</span>
                </button>

                <a
                  href={detail.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#222222] bg-[#0c0c0c] hover:border-[#444444] font-mono text-xs uppercase text-[#ededed] ml-auto"
                >
                  <span>Original Source</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Taxonomy tags */}
            {(detail.topics.length > 0 || detail.companies.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#181818]">
                {detail.topics.map((t, idx) => (
                  <Link
                    key={`${t.topicSlug}-${idx}`}
                    href={`/?topic=${encodeURIComponent(t.topicSlug)}${
                      t.subtopicSlug ? `&subtopic=${encodeURIComponent(t.subtopicSlug)}` : ''
                    }`}
                    onClick={onClose}
                    className="px-2 py-0.5 border border-[#222222] bg-[#0c0c0c] hover:border-[#444444] font-mono text-[11px] uppercase text-[#c5c5c5]"
                  >
                    #{t.topicSlug}
                    {t.subtopicSlug ? `/${t.subtopicSlug}` : ''}
                  </Link>
                ))}
                {detail.companies.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/?company=${encodeURIComponent(c.slug)}`}
                    onClick={onClose}
                    className="px-2 py-0.5 border border-[#2e2e2e] bg-[#121212] hover:border-[#555555] font-mono text-[11px] uppercase text-[#ededed]"
                  >
                    @{c.name}
                  </Link>
                ))}
              </div>
            )}

            {/* What Happened */}
            <section className="space-y-2 border-t border-[#222222] pt-6">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#737373]">
                What Happened
              </h2>
              <p className="text-sm sm:text-[15px] leading-relaxed text-[#ededed]">
                {detail.whatHappened}
              </p>
            </section>

            {/* Why It Matters */}
            <section className="space-y-2 border-t border-[#222222] pt-6">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#737373]">
                Why It Matters
              </h2>
              <p className="text-sm sm:text-[15px] leading-relaxed text-[#c5c5c5]">
                {detail.whyItMatters}
              </p>
            </section>

            {/* Key Insights */}
            {detail.keyInsights.length > 0 && (
              <section className="space-y-3 border-t border-[#222222] pt-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-[#737373]">
                  Key Technical Insights
                </h2>
                <ul className="space-y-2">
                  {detail.keyInsights.map((insight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-sm text-[#c5c5c5] leading-relaxed"
                    >
                      <span className="font-mono text-xs text-[#737373] mt-0.5">
                        {index === detail.keyInsights.length - 1 ? '└──' : '├──'}
                      </span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Comments / Discussion */}
            <section className="space-y-5 border-t border-[#222222] pt-6">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xs uppercase tracking-widest text-[#ededed] flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion ({detail.comments?.length ?? 0})</span>
                </h2>
                {replyToId && (
                  <button
                    type="button"
                    onClick={() => setReplyToId(null)}
                    className="font-mono text-[11px] uppercase text-[#737373] hover:text-[#ededed]"
                  >
                    Cancel Reply
                  </button>
                )}
              </div>

              <form onSubmit={handlePostComment} className="space-y-3">
                <textarea
                  rows={3}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder={
                    isAuthenticated
                      ? replyToId
                        ? 'Write a technical reply...'
                        : 'Share technical analysis or implementation notes...'
                      : 'Sign in with an invited account to join the discussion...'
                  }
                  className="w-full bg-[#0a0a0a] border border-[#222222] focus:border-[#555555] outline-none p-3 text-sm text-[#ededed] placeholder-[#525252]"
                />
                {commentError && (
                  <p className="text-xs font-mono text-red-400">{commentError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !commentBody.trim()}
                    className="px-4 py-1.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium disabled:opacity-40 hover:bg-white transition-colors"
                  >
                    {submittingComment ? 'Posting...' : replyToId ? 'Post Reply' : 'Post Comment'}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {rootComments.length === 0 ? (
                  <p className="font-mono text-xs text-[#525252] uppercase py-4">
                    No comments yet. Start the technical discussion above.
                  </p>
                ) : (
                  rootComments.map((comment) => {
                    const replies = repliesByParent.get(comment.id) ?? [];
                    return (
                      <div
                        key={comment.id}
                        className="border border-[#1c1c1c] bg-[#080808] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] text-[#737373]">
                          <span className="text-[#ededed]">
                            @{comment.author.username} ({comment.author.name})
                          </span>
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-[#c5c5c5] leading-relaxed whitespace-pre-wrap">
                          {comment.body}
                        </p>
                        <div className="flex items-center gap-4 font-mono text-[11px] text-[#737373]">
                          <button
                            type="button"
                            onClick={() => handleToggleCommentUpvote(comment.id)}
                            className={`flex items-center gap-1 hover:text-[#ededed] ${
                              comment.viewerUpvoted ? 'text-[#ededed]' : ''
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{comment.upvoteCount}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplyToId(comment.id)}
                            className="hover:text-[#ededed] uppercase"
                          >
                            Reply
                          </button>
                        </div>

                        {replies.length > 0 && (
                          <div className="pl-4 border-l border-[#222222] space-y-3 mt-3">
                            {replies.map((reply) => (
                              <div key={reply.id} className="space-y-1.5">
                                <div className="flex items-center justify-between font-mono text-[11px] text-[#737373]">
                                  <span className="text-[#ededed]">
                                    └── @{reply.author.username}
                                  </span>
                                  <span>{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-[#c5c5c5] pl-4">
                                  {reply.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
