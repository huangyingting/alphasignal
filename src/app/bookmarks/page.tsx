'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowUpRight, Bookmark, Search, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { SignalDetailData, SignalDetailDrawer } from '@/components/SignalDetailDrawer';

type BookmarkRecord = {
  id: string;
  folder: string;
  note: string | null;
  createdAt: string;
  signal: SignalDetailData;
};

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);

  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [lists, setLists] = useState<string[]>(['READING LIST']);
  const [activeViewTab, setActiveViewTab] = useState<'bookmarks' | 'upvotes'>('bookmarks');
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('all');
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (folder !== 'all') params.set('folder', folder);
      if (activeViewTab === 'upvotes') params.set('tab', 'upvotes');
      const res = await fetch(`/api/bookmarks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks ?? []);
        if (Array.isArray(data.lists)) {
          setLists(data.lists);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, query, folder, activeViewTab]);

  useEffect(() => {
    if (status !== 'loading') {
      loadBookmarks();
    }
  }, [status, loadBookmarks]);

  async function handleRemoveBookmark(signalId: string) {
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signalId, toggle: true }),
    });
    if (res.ok) {
      setBookmarks((prev) => prev.filter((b) => b.signal.id !== signalId));
    }
  }

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#222222] pb-8">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#ededed] font-normal">
              Bookmarks
            </h1>
            <p className="text-sm text-[#c5c5c5]">
              Your saved signals, papers, and repositories for deep technical review.
            </p>
          </div>

          {isAuthenticated && (
            <div className="flex flex-wrap items-center gap-3">
              {/* BOOKMARKS vs UPVOTES tabs matching 11-bookmarks.png */}
              <div className="flex items-center border border-[#222222] bg-[#080808] font-mono text-xs uppercase">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('bookmarks')}
                  data-testid="bookmarks-tab-bookmarks"
                  className={`px-3 py-1.5 ${
                    activeViewTab === 'bookmarks'
                      ? 'bg-[#ededed] text-[#030303] font-medium'
                      : 'text-[#737373] hover:text-[#ededed]'
                  }`}
                >
                  BOOKMARKS
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewTab('upvotes')}
                  data-testid="bookmarks-tab-upvotes"
                  className={`px-3 py-1.5 ${
                    activeViewTab === 'upvotes'
                      ? 'bg-[#ededed] text-[#030303] font-medium'
                      : 'text-[#737373] hover:text-[#ededed]'
                  }`}
                >
                  UPVOTES
                </button>
              </div>

              <div className="flex items-center gap-2 border border-[#222222] bg-[#080808] px-3 py-1.5 w-64">
                <Search className="w-3.5 h-3.5 text-[#737373]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search saved signals..."
                  className="w-full bg-transparent font-mono text-xs text-[#ededed] placeholder-[#525252] outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center border border-[#222222] bg-[#080808] font-mono text-xs uppercase">
                {['all', ...lists].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFolder(f)}
                    className={`px-3 py-1.5 ${
                      folder === f
                        ? 'bg-[#ededed] text-[#030303] font-medium'
                        : 'text-[#737373] hover:text-[#ededed]'
                    }`}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setNewListOpen((v) => !v)}
                  className="px-3 py-1.5 text-[#c5c5c5] hover:text-[#ededed] border-l border-[#222222]"
                >
                  +New list
                </button>
              </div>
            </div>
          )}
        </div>

        {newListOpen && (
          <div className="flex items-center gap-2 border border-[#222222] bg-[#080808] p-3 max-w-md">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New reading list name..."
              className="flex-1 bg-[#030303] border border-[#222222] px-3 py-1.5 font-mono text-xs text-[#ededed]"
            />
            <button
              type="button"
              onClick={() => {
                const trimmed = newListName.trim();
                if (trimmed) {
                  setLists((prev) => Array.from(new Set([...prev, trimmed])));
                  setFolder(trimmed);
                }
                setNewListName('');
                setNewListOpen(false);
              }}
              className="px-3 py-1.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
            >
              Create
            </button>
          </div>
        )}

        {!isAuthenticated && status !== 'loading' ? (
          <div className="border border-[#222222] bg-[#060606] p-12 text-center space-y-4">
            <Bookmark className="w-6 h-6 text-[#737373] mx-auto" />
            <h2 className="font-serif text-2xl text-[#ededed] font-normal">
              Sign in to access your saved bookmarks
            </h2>
            <p className="text-sm text-[#c5c5c5] max-w-md mx-auto">
              Bookmark papers, repositories, and technical signals across sessions with an invited AlphaSignal account.
            </p>
            <div>
              <Link
                href="/login"
                className="inline-block px-5 py-2.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="p-12 text-center font-mono text-xs uppercase text-[#737373]">
            Loading saved bookmarks...
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="border border-[#222222] bg-[#060606] p-12 text-center space-y-3">
            <div className="font-mono text-xs uppercase text-[#737373]">
              0 SAVED SIGNALS
            </div>
            <h2 className="font-serif text-2xl text-[#ededed] font-normal">
              No bookmarks saved yet
            </h2>
            <p className="text-sm text-[#c5c5c5]">
              Click the bookmark icon on any signal in the home feed to save it here.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block px-4 py-2 border border-[#222222] bg-[#0c0c0c] font-mono text-xs uppercase text-[#ededed] hover:border-[#444444]"
              >
                Browse Signals →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((item) => (
              <article
                key={item.id}
                onClick={() => setSelectedSignalId(item.signal.id)}
                data-testid="bookmark-card"
                className="border border-[#222222] bg-[#060606] hover:border-[#3a3a3a] p-5 cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between font-mono text-xs uppercase text-[#737373]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 border border-[#222222] bg-[#0c0c0c] text-[#ededed]">
                      {item.signal.category}
                    </span>
                    <span>{item.signal.sourceName}</span>
                    <span>• FOLDER: {item.folder}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={item.signal.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 border border-[#222222] hover:border-[#444444] text-[#c5c5c5]"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark(item.signal.id);
                      }}
                      aria-label="Remove bookmark"
                      className="p-1.5 border border-[#222222] hover:border-red-400 text-[#737373] hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="text-lg font-medium text-[#ededed]">
                  {item.signal.title}
                </h2>
                <p className="text-sm text-[#c5c5c5] leading-relaxed">
                  {item.signal.whatHappened || item.signal.summary}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <SignalDetailDrawer
        signalId={selectedSignalId}
        onClose={() => setSelectedSignalId(null)}
        isAuthenticated={isAuthenticated}
        onSignalUpdated={loadBookmarks}
      />
    </AppShell>
  );
}
