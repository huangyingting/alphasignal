'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowUpRight,
  Bookmark,
  Flame,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import { AppShell } from './AppShell';
import { SignalDetailData, SignalDetailDrawer } from './SignalDetailDrawer';

type TopicSummary = {
  id: string;
  slug: string;
  name: string;
  signalCount: number;
  subtopics: { id: string; slug: string; name: string; signalCount: number }[];
};

type CompanySummary = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  signalCount: number;
};

type CustomFeedItem = {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  filters: {
    id: string;
    filterType: string;
    mode: string;
    value: string;
  }[];
};

const CATEGORIES = ['All', 'Top News', 'Top Papers', 'Top Repos', 'Top Posts'];

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}D AGO`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export function HomeFeedClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);
  const canWrite = isAuthenticated && session?.user?.role !== 'VIEWER';

  const [signals, setSignals] = useState<SignalDetailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('All');
  const [period, setPeriod] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [sort, setSort] = useState<'latest' | 'score'>('latest');
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);
  const [customFeeds, setCustomFeeds] = useState<CustomFeedItem[]>([]);

  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companyPeriod, setCompanyPeriod] = useState<'7d' | '30d' | 'all'>('all');

  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(
    searchParams.get('signal')
  );

  // Search Modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');

  // Create Custom Feed Modal
  const [feedModalOpen, setFeedModalOpen] = useState(false);
  const [feedName, setFeedName] = useState('');
  const [feedFilters, setFeedFilters] = useState<
    { filterType: string; mode: string; value: string }[]
  >([
    { filterType: 'TOPIC', mode: 'INCLUDE', value: 'agents' },
  ]);
  const [savingFeed, setSavingFeed] = useState(false);

  // Publish Signal Modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [pubTitle, setPubTitle] = useState('');
  const [pubUrl, setPubUrl] = useState('');
  const [pubCategory, setPubCategory] = useState<'Top News' | 'Top Papers' | 'Top Repos' | 'Top Posts'>('Top News');
  const [pubWhatHappened, setPubWhatHappened] = useState('');
  const [pubWhyItMatters, setPubWhyItMatters] = useState('');
  const [pubTopics, setPubTopics] = useState('agents, llms');
  const [pubCompanies, setPubCompanies] = useState('anthropic, openai');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Live ingestion state
  const [ingesting, setIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);

  const urlQuery = searchParams.get('q') ?? '';
  const urlTopic = searchParams.get('topic') ?? '';
  const urlSubtopic = searchParams.get('subtopic') ?? '';
  const urlCompany = searchParams.get('company') ?? '';

  useEffect(() => {
    const sigParam = searchParams.get('signal');
    if (sigParam) setSelectedSignalId(sigParam);
  }, [searchParams]);

  const loadSignals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category);
      if (period !== 'all') params.set('period', period);
      if (sort !== 'latest') params.set('sort', sort);
      if (urlQuery) params.set('q', urlQuery);
      if (urlTopic) params.set('topic', urlTopic);
      if (urlSubtopic) params.set('subtopic', urlSubtopic);
      if (urlCompany) params.set('company', urlCompany);
      if (activeFeedId) params.set('feedId', activeFeedId);

      const res = await fetch(`/api/signals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [category, period, sort, urlQuery, urlTopic, urlSubtopic, urlCompany, activeFeedId]);

  const loadTaxonomy = useCallback(async () => {
    const res = await fetch(`/api/topics?period=${companyPeriod}`);
    if (res.ok) {
      const data = await res.json();
      setTopics(data.topics ?? []);
      setCompanies(data.companies ?? []);
    }
  }, [companyPeriod]);

  const loadCustomFeeds = useCallback(async () => {
    if (!isAuthenticated) {
      setCustomFeeds([]);
      return;
    }
    const res = await fetch('/api/feeds');
    if (res.ok) {
      const data = await res.json();
      setCustomFeeds(data.feeds ?? []);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSignals();
  }, [loadSignals]);

  useEffect(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  useEffect(() => {
    loadCustomFeeds();
  }, [loadCustomFeeds]);

  async function handleToggleUpvote(e: React.MouseEvent, signal: SignalDetailData) {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const res = await fetch(`/api/signals/${encodeURIComponent(signal.id)}/upvote`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      setSignals((prev) =>
        prev.map((item) =>
          item.id === signal.id
            ? {
                ...item,
                viewerUpvoted: data.upvoted,
                upvoteCount: data.upvoteCount,
              }
            : item
        )
      );
    }
  }

  async function handleToggleBookmark(e: React.MouseEvent, signal: SignalDetailData) {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signalId: signal.id, toggle: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setSignals((prev) =>
        prev.map((item) =>
          item.id === signal.id
            ? {
                ...item,
                viewerBookmarked: Boolean(data.bookmarked),
              }
            : item
        )
      );
    }
  }

  async function handleIngestLive() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIngesting(true);
    setIngestMessage(null);
    try {
      const res = await fetch('/api/signals/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: ['github', 'arxiv', 'hn'],
          limitPerSource: 4,
          compileReport: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIngestMessage(`Synced ${data.ingestedCount} live signals from GitHub, arXiv & Hacker News.`);
        await Promise.all([loadSignals(), loadTaxonomy()]);
      } else {
        setIngestMessage(data.error ?? 'Failed to ingest signals.');
      }
    } finally {
      setIngesting(false);
    }
  }

  async function handleCreateFeed(e: React.FormEvent) {
    e.preventDefault();
    if (!feedName.trim()) return;
    setSavingFeed(true);
    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feedName.trim(),
          filters: feedFilters.filter((f) => f.value.trim().length > 0),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await loadCustomFeeds();
        if (data.feed?.id) {
          setActiveFeedId(data.feed.id);
        }
        setFeedModalOpen(false);
        setFeedName('');
      }
    } finally {
      setSavingFeed(false);
    }
  }

  async function handleDeleteFeed(feedId: string) {
    const res = await fetch(`/api/feeds/${encodeURIComponent(feedId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      if (activeFeedId === feedId) setActiveFeedId(null);
      await loadCustomFeeds();
    }
  }

  async function handlePublishSignal(e: React.FormEvent) {
    e.preventDefault();
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pubTitle.trim(),
          originalUrl: pubUrl.trim(),
          category: pubCategory,
          summary: pubWhatHappened.trim() || pubTitle.trim(),
          whatHappened: pubWhatHappened.trim() || pubTitle.trim(),
          whyItMatters:
            pubWhyItMatters.trim() ||
            'Provides high-signal engineering context for AI practitioners.',
          topics: pubTopics
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          companies: pubCompanies
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.error ?? 'Failed to publish signal.');
      } else {
        setPublishModalOpen(false);
        setPubTitle('');
        setPubUrl('');
        setPubWhatHappened('');
        setPubWhyItMatters('');
        await Promise.all([loadSignals(), loadTaxonomy()]);
      }
    } finally {
      setPublishing(false);
    }
  }

  const hasUrlFilters = Boolean(urlQuery || urlTopic || urlSubtopic || urlCompany || activeFeedId);

  return (
    <AppShell onOpenSearch={() => setSearchOpen(true)}>
      {/* Hero Section (matches AlphaSignal anonymous & editorial header) */}
      <section className="border-b border-[#222222] bg-[#030303]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-[#737373]">
                DAILY AI INTELLIGENCE TERMINAL
              </div>
              <h1 className="font-serif text-3xl sm:text-[40px] sm:leading-[44px] text-[#ededed] font-normal tracking-tight">
                Curated intelligence for the builders of tomorrow.
              </h1>
              <p className="text-sm sm:text-base text-[#c5c5c5] leading-relaxed">
                Track key signals across the AI ecosystem. Surface the repos, papers, and breakthroughs that matter.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {canWrite ? (
                <>
                  <button
                    type="button"
                    onClick={handleIngestLive}
                    disabled={ingesting}
                    data-testid="ingest-live-button"
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#222222] bg-[#0c0c0c] hover:border-[#444444] font-mono text-xs uppercase text-[#ededed] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ingesting ? 'animate-spin' : ''}`} />
                    <span>{ingesting ? 'Syncing Upstream...' : 'Sync Live Signals'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(true)}
                    data-testid="publish-signal-button"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#ededed] text-[#030303] hover:bg-white font-mono text-xs uppercase font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publish Signal</span>
                  </button>
                </>
              ) : !isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="px-4 py-2.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium hover:bg-white transition-colors"
                  >
                    Sign In with Invite
                  </Link>
                  <Link
                    href="/archive"
                    className="px-4 py-2.5 border border-[#222222] bg-[#0a0a0a] hover:border-[#444444] font-mono text-xs uppercase text-[#c5c5c5]"
                  >
                    Read Archive
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          {ingestMessage && (
            <div className="mt-4 px-3.5 py-2 border border-[#2a2a2a] bg-[#0c0c0c] font-mono text-xs text-[#c5c5c5] flex items-center justify-between">
              <span>{ingestMessage}</span>
              <button
                type="button"
                onClick={() => setIngestMessage(null)}
                className="text-[#737373] hover:text-[#ededed]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Feed Navigation & Filter Bar */}
      <section className="border-b border-[#222222] bg-[#050505]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Category & Custom Feed Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => {
              const active = !activeFeedId && category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveFeedId(null);
                    setCategory(cat);
                  }}
                  className={`px-3 py-1.5 font-mono text-xs uppercase whitespace-nowrap border transition-colors ${
                    active
                      ? 'border-[#ededed] bg-[#ededed] text-[#030303] font-medium'
                      : 'border-[#222222] bg-[#0a0a0a] text-[#c5c5c5] hover:border-[#444444]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}

            {customFeeds.map((feed) => {
              const active = activeFeedId === feed.id;
              return (
                <div key={feed.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveFeedId(active ? null : feed.id)}
                    className={`px-3 py-1.5 font-mono text-xs uppercase whitespace-nowrap border transition-colors ${
                      active
                        ? 'border-[#ededed] bg-[#ededed] text-[#030303] font-medium'
                        : 'border-[#222222] bg-[#0e0e0e] text-[#ededed] hover:border-[#444444]'
                    }`}
                  >
                    ★ {feed.name}
                  </button>
                  {active && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFeed(feed.id)}
                      title="Delete custom feed"
                      className="p-1.5 border border-l-0 border-[#222222] bg-[#0a0a0a] text-[#737373] hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {canWrite && (
              <button
                type="button"
                onClick={() => setFeedModalOpen(true)}
                data-testid="create-feed-button"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#333333] hover:border-[#ededed] font-mono text-xs uppercase text-[#737373] hover:text-[#ededed] whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Feed</span>
              </button>
            )}
          </div>

          {/* Timeframe & Sort Controls */}
          <div className="flex items-center gap-2 font-mono text-xs uppercase">
            <div className="flex items-center border border-[#222222] bg-[#0a0a0a]">
              {(['all', '24h', '7d', '30d'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 uppercase ${
                    period === p
                      ? 'bg-[#ededed] text-[#030303] font-medium'
                      : 'text-[#737373] hover:text-[#ededed]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center border border-[#222222] bg-[#0a0a0a]">
              <button
                type="button"
                onClick={() => setSort('latest')}
                className={`px-2.5 py-1 uppercase ${
                  sort === 'latest'
                    ? 'bg-[#ededed] text-[#030303] font-medium'
                    : 'text-[#737373] hover:text-[#ededed]'
                }`}
              >
                Latest
              </button>
              <button
                type="button"
                onClick={() => setSort('score')}
                className={`px-2.5 py-1 uppercase ${
                  sort === 'score'
                    ? 'bg-[#ededed] text-[#030303] font-medium'
                    : 'text-[#737373] hover:text-[#ededed]'
                }`}
              >
                Top
              </button>
            </div>
          </div>
        </div>

        {/* Active URL / Custom Feed Filter Chips */}
        {hasUrlFilters && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-[#737373] uppercase">Active Filters:</span>
            {urlQuery && (
              <span className="px-2 py-0.5 border border-[#222222] bg-[#0c0c0c] text-[#ededed]">
                QUERY: &ldquo;{urlQuery}&rdquo;
              </span>
            )}
            {urlTopic && (
              <span className="px-2 py-0.5 border border-[#222222] bg-[#0c0c0c] text-[#ededed] uppercase">
                TOPIC: #{urlTopic}
                {urlSubtopic ? `/${urlSubtopic}` : ''}
              </span>
            )}
            {urlCompany && (
              <span className="px-2 py-0.5 border border-[#222222] bg-[#0c0c0c] text-[#ededed] uppercase">
                COMPANY: @{urlCompany}
              </span>
            )}
            {activeFeedId && (
              <span className="px-2 py-0.5 border border-[#222222] bg-[#0c0c0c] text-[#ededed] uppercase">
                CUSTOM FEED ACTIVE
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveFeedId(null);
                setSearchInput('');
                router.push('/');
              }}
              className="px-2 py-0.5 text-[#737373] hover:text-[#ededed] underline uppercase"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* Main 3-Column Content Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left/Center Signal Feed (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="border border-[#222222] bg-[#060606] p-12 text-center font-mono text-xs uppercase text-[#737373]">
              Loading intelligence stream...
            </div>
          ) : signals.length === 0 ? (
            <div
              data-testid="empty-signals-state"
              className="border border-[#222222] bg-[#060606] p-10 sm:p-14 text-center space-y-4"
            >
              <div className="font-mono text-xs uppercase tracking-widest text-[#737373]">
                ZERO SIGNALS MATCH CURRENT VIEW
              </div>
              <h2 className="font-serif text-2xl text-[#ededed] font-normal">
                No signals indexed yet for this filter.
              </h2>
              <p className="text-sm text-[#c5c5c5] max-w-md mx-auto leading-relaxed">
                AlphaSignal ships with zero synthetic or dummy records. Authenticated operators and members can ingest live signals from GitHub, arXiv, and Hacker News or publish a signal directly.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {canWrite ? (
                  <>
                    <button
                      type="button"
                      onClick={handleIngestLive}
                      disabled={ingesting}
                      className="px-4 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium hover:bg-white"
                    >
                      {ingesting ? 'Syncing Upstream...' : 'Ingest Live Signals Now'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPublishModalOpen(true)}
                      className="px-4 py-2 border border-[#222222] bg-[#0c0c0c] text-[#ededed] font-mono text-xs uppercase hover:border-[#444444]"
                    >
                      Publish Signal Manually
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
                  >
                    Sign In to Ingest or Publish
                  </Link>
                )}
              </div>
            </div>
          ) : (
            signals.map((signal) => (
              <article
                key={signal.id}
                onClick={() => setSelectedSignalId(signal.id)}
                data-testid="signal-card"
                className="group border border-[#222222] bg-[#060606] hover:border-[#3a3a3a] transition-colors p-5 sm:p-6 cursor-pointer space-y-3"
              >
                {/* Metadata Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-[#737373]">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 border border-[#222222] bg-[#0d0d0d] text-[#ededed]">
                      {signal.category}
                    </span>
                    <span>{signal.sourceName}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(signal.publishedAt)}</span>
                  </div>

                  {signal.metricsValue > 0 && (
                    <div className="flex items-center gap-1 text-[#c5c5c5]">
                      <Flame className="w-3 h-3 text-[#737373]" />
                      <span>
                        {signal.metricsValue.toLocaleString()} {signal.metricsLabel ?? 'PTS'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-[18px] leading-[23.4px] font-medium text-[#ededed] group-hover:text-white">
                  {signal.title}
                </h2>

                {/* Concise Summary */}
                <p className="text-sm text-[#c5c5c5] leading-relaxed line-clamp-2">
                  {signal.whatHappened || signal.summary}
                </p>

                {/* Tags & Actions Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#141414]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {signal.topics.slice(0, 3).map((t, idx) => (
                      <Link
                        key={`${t.topicSlug}-${idx}`}
                        href={`/?topic=${encodeURIComponent(t.topicSlug)}${
                          t.subtopicSlug ? `&subtopic=${encodeURIComponent(t.subtopicSlug)}` : ''
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 border border-[#1f1f1f] bg-[#0b0b0b] hover:border-[#444444] font-mono text-[11px] uppercase text-[#999999] hover:text-[#ededed]"
                      >
                        #{t.topicSlug}
                        {t.subtopicSlug ? `/${t.subtopicSlug}` : ''}
                      </Link>
                    ))}
                    {signal.companies.slice(0, 2).map((c) => (
                      <Link
                        key={c.slug}
                        href={`/?company=${encodeURIComponent(c.slug)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 border border-[#2a2a2a] bg-[#111111] hover:border-[#555555] font-mono text-[11px] uppercase text-[#ededed]"
                      >
                        @{c.name}
                      </Link>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={(e) => handleToggleUpvote(e, signal)}
                      aria-label="Upvote signal"
                      data-testid="card-upvote-button"
                      className={`flex items-center gap-1.5 px-2.5 py-1 border transition-colors ${
                        signal.viewerUpvoted
                          ? 'border-[#ededed] bg-[#ededed] text-[#030303]'
                          : 'border-[#222222] bg-[#0a0a0a] text-[#c5c5c5] hover:border-[#444444]'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{signal.upvoteCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSignalId(signal.id);
                      }}
                      aria-label="Signal comments"
                      className="flex items-center gap-1.5 px-2.5 py-1 border border-[#222222] bg-[#0a0a0a] text-[#c5c5c5] hover:border-[#444444]"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{signal.commentCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, signal)}
                      aria-label="Bookmark signal"
                      data-testid="card-bookmark-button"
                      className={`p-1.5 border transition-colors ${
                        signal.viewerBookmarked
                          ? 'border-[#ededed] bg-[#1c1c1c] text-[#ededed]'
                          : 'border-[#222222] bg-[#0a0a0a] text-[#737373] hover:text-[#ededed]'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={signal.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Open original source"
                      className="p-1.5 border border-[#222222] bg-[#0a0a0a] text-[#737373] hover:text-[#ededed]"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Right Sidebar: Top Topics & Top Companies Leaderboard (4 columns) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Top Companies Leaderboard */}
          <div className="border border-[#222222] bg-[#060606] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#ededed]">
                Top Companies
              </h2>
              <div className="flex items-center gap-1 font-mono text-[10px] uppercase">
                {(['7d', '30d', 'all'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCompanyPeriod(p)}
                    className={`px-1.5 py-0.5 ${
                      companyPeriod === p
                        ? 'bg-[#ededed] text-[#030303] font-semibold'
                        : 'text-[#737373] hover:text-[#ededed]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#151515]">
              {companies.slice(0, 10).map((company, idx) => (
                <Link
                  key={company.slug}
                  href={`/?company=${encodeURIComponent(company.slug)}`}
                  className="py-2.5 flex items-center justify-between hover:bg-[#0d0d0d] px-1.5 transition-colors font-mono text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#525252] w-5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[#ededed]">{company.name}</span>
                  </div>
                  <span className="text-[#737373]">{company.signalCount}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Topics Tree Preview */}
          <div className="border border-[#222222] bg-[#060606] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#ededed]">
                Taxonomy Topics
              </h2>
              <Link
                href="/topics"
                className="font-mono text-[11px] uppercase text-[#c5c5c5] hover:text-[#ededed]"
              >
                View All (21) →
              </Link>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {topics.slice(0, 8).map((topic) => (
                <div key={topic.slug} className="space-y-1">
                  <Link
                    href={`/?topic=${encodeURIComponent(topic.slug)}`}
                    className="flex items-center justify-between text-[#ededed] hover:underline uppercase"
                  >
                    <span>#{topic.slug}</span>
                    <span className="text-[#737373]">{topic.signalCount}</span>
                  </Link>
                  {topic.subtopics.slice(0, 2).map((sub, idx, arr) => (
                    <Link
                      key={sub.slug}
                      href={`/?topic=${encodeURIComponent(topic.slug)}&subtopic=${encodeURIComponent(sub.slug)}`}
                      className="flex items-center justify-between text-[11px] text-[#737373] hover:text-[#c5c5c5] pl-2"
                    >
                      <span>
                        {idx === arr.length - 1 ? '└── ' : '├── '}
                        {sub.slug}
                      </span>
                      <span>{sub.signalCount}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Signal Detail Drawer */}
      <SignalDetailDrawer
        signalId={selectedSignalId}
        onClose={() => setSelectedSignalId(null)}
        isAuthenticated={isAuthenticated}
        onSignalUpdated={loadSignals}
      />

      {/* Search & Filter Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-xs px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Search and filter signals"
        >
          <div className="fixed inset-0" onClick={() => setSearchOpen(false)} />
          <div className="relative z-10 w-full max-w-xl border border-[#222222] bg-[#080808] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#ededed] flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Search & Filter Signals</span>
              </span>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[#737373] hover:text-[#ededed]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchOpen(false);
                const q = searchInput.trim();
                router.push(q ? `/?q=${encodeURIComponent(q)}` : '/');
              }}
              className="flex items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-2 border border-[#222222] bg-[#040404] px-3 py-2">
                <Search className="w-4 h-4 text-[#737373]" />
                <input
                  type="text"
                  autoFocus
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search models, papers, repos, or keywords..."
                  className="w-full bg-transparent text-sm text-[#ededed] outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
              >
                Apply
              </button>
            </form>

            <div className="space-y-2">
              <div className="font-mono text-[11px] uppercase text-[#737373]">
                Quick Topic Filters
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topics.slice(0, 12).map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(`/?topic=${encodeURIComponent(t.slug)}`);
                    }}
                    className="px-2 py-1 border border-[#222222] bg-[#0c0c0c] hover:border-[#444444] font-mono text-[11px] uppercase text-[#c5c5c5]"
                  >
                    #{t.slug}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Feed Builder Modal */}
      {feedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create custom feed"
        >
          <div className="fixed inset-0" onClick={() => setFeedModalOpen(false)} />
          <form
            onSubmit={handleCreateFeed}
            className="relative z-10 w-full max-w-lg border border-[#222222] bg-[#080808] p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
              <h2 className="font-serif text-xl text-[#ededed] font-normal">
                Create Custom Feed
              </h2>
              <button
                type="button"
                onClick={() => setFeedModalOpen(false)}
                className="text-[#737373] hover:text-[#ededed]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                Feed Name
              </label>
              <input
                type="text"
                required
                value={feedName}
                onChange={(e) => setFeedName(e.target.value)}
                placeholder="e.g., Agentic Infra & Kernels"
                className="w-full px-3 py-2 border border-[#222222] bg-[#040404] text-sm text-[#ededed] outline-none focus:border-[#555555]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-[#c5c5c5]">
                  Include / Exclude Rules
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFeedFilters((prev) => [
                      ...prev,
                      { filterType: 'KEYWORD', mode: 'INCLUDE', value: '' },
                    ])
                  }
                  className="font-mono text-xs uppercase text-[#ededed] underline"
                >
                  + Add Rule
                </button>
              </div>

              {feedFilters.map((rule, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={rule.mode}
                    onChange={(e) =>
                      setFeedFilters((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, mode: e.target.value } : item
                        )
                      )
                    }
                    className="col-span-3 px-2 py-1.5 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                  >
                    <option value="INCLUDE">INCLUDE</option>
                    <option value="EXCLUDE">EXCLUDE</option>
                  </select>

                  <select
                    value={rule.filterType}
                    onChange={(e) =>
                      setFeedFilters((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, filterType: e.target.value } : item
                        )
                      )
                    }
                    className="col-span-4 px-2 py-1.5 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                  >
                    <option value="TOPIC">TOPIC</option>
                    <option value="SUBTOPIC">SUBTOPIC</option>
                    <option value="COMPANY">COMPANY</option>
                    <option value="KEYWORD">KEYWORD</option>
                    <option value="SOURCE">SOURCE</option>
                  </select>

                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) =>
                      setFeedFilters((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, value: e.target.value } : item
                        )
                      )
                    }
                    placeholder="slug or keyword"
                    className="col-span-4 px-2.5 py-1.5 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setFeedFilters((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="col-span-1 text-[#737373] hover:text-red-400 flex justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1c1c1c]">
              <button
                type="button"
                onClick={() => setFeedModalOpen(false)}
                className="px-4 py-2 border border-[#222222] font-mono text-xs uppercase text-[#c5c5c5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingFeed}
                className="px-4 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
              >
                {savingFeed ? 'Saving...' : 'Save Custom Feed'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Publish Signal Modal */}
      {publishModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Publish signal"
        >
          <div className="fixed inset-0" onClick={() => setPublishModalOpen(false)} />
          <form
            onSubmit={handlePublishSignal}
            className="relative z-10 w-full max-w-xl border border-[#222222] bg-[#080808] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
              <h2 className="font-serif text-xl text-[#ededed] font-normal">
                Publish Technical Signal
              </h2>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="text-[#737373] hover:text-[#ededed]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                  Headline Title
                </label>
                <input
                  type="text"
                  required
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  placeholder="e.g., vLLM 0.8: Zero-Overhead Prefix Caching for MoE Models"
                  className="w-full px-3 py-2 border border-[#222222] bg-[#040404] text-sm text-[#ededed]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                  Category
                </label>
                <select
                  value={pubCategory}
                  onChange={(e) =>
                    setPubCategory(
                      e.target.value as 'Top News' | 'Top Papers' | 'Top Repos' | 'Top Posts'
                    )
                  }
                  className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                >
                  <option value="Top News">Top News</option>
                  <option value="Top Papers">Top Papers</option>
                  <option value="Top Repos">Top Repos</option>
                  <option value="Top Posts">Top Posts</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                Original Source URL
              </label>
              <input
                type="url"
                required
                value={pubUrl}
                onChange={(e) => setPubUrl(e.target.value)}
                placeholder="https://github.com/... or https://arxiv.org/abs/..."
                className="w-full px-3 py-2 border border-[#222222] bg-[#040404] text-sm text-[#ededed] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                What Happened
              </label>
              <textarea
                rows={3}
                required
                value={pubWhatHappened}
                onChange={(e) => setPubWhatHappened(e.target.value)}
                placeholder="Concise technical summary of the release, paper, or benchmark..."
                className="w-full px-3 py-2 border border-[#222222] bg-[#040404] text-sm text-[#ededed]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                Why It Matters
              </label>
              <textarea
                rows={2}
                value={pubWhyItMatters}
                onChange={(e) => setPubWhyItMatters(e.target.value)}
                placeholder="Engineering implications for latency, accuracy, or deployment..."
                className="w-full px-3 py-2 border border-[#222222] bg-[#040404] text-sm text-[#ededed]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                  Topics (comma-separated slugs)
                </label>
                <input
                  type="text"
                  value={pubTopics}
                  onChange={(e) => setPubTopics(e.target.value)}
                  className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                  Companies (comma-separated slugs)
                </label>
                <input
                  type="text"
                  value={pubCompanies}
                  onChange={(e) => setPubCompanies(e.target.value)}
                  className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                />
              </div>
            </div>

            {publishError && (
              <p className="font-mono text-xs text-red-400">{publishError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1c1c1c]">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2 border border-[#222222] font-mono text-xs uppercase text-[#c5c5c5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="px-4 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
              >
                {publishing ? 'Publishing...' : 'Publish Signal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
