'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { AppShell } from '@/components/AppShell';

type SubtopicItem = {
  id: string;
  slug: string;
  name: string;
  signalCount: number;
};

type TopicItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  signalCount: number;
  subtopics: SubtopicItem[];
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [period, setPeriod] = useState<'7d' | 'all'>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/topics?period=${period}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.topics) {
          setTopics(data.topics);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period]);

  const q = filterQuery.trim().toLowerCase();
  const filteredTopics = topics.filter((topic) => {
    if (!q) return true;
    if (topic.slug.toLowerCase().includes(q)) return true;
    if ((topic.description ?? '').toLowerCase().includes(q)) return true;
    return topic.subtopics.some((s) => s.slug.toLowerCase().includes(q));
  });

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#222222] pb-8">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#ededed] font-normal">
              Topics
            </h1>
            <p className="text-sm text-[#c5c5c5]">
              Explore signals across the AI ecosystem ({topics.length} canonical domains)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="flex items-center gap-2 border border-[#222222] bg-[#080808] px-3 py-1.5 w-64">
              <Search className="w-3.5 h-3.5 text-[#737373]" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter topics or subtopics..."
                className="w-full bg-transparent font-mono text-xs text-[#ededed] placeholder-[#525252] outline-none"
              />
            </div>

            {/* 7D / ALL toggle */}
            <div className="flex items-center border border-[#222222] bg-[#080808] font-mono text-xs uppercase">
              <button
                type="button"
                onClick={() => setPeriod('7d')}
                className={`px-3 py-1.5 ${
                  period === '7d'
                    ? 'bg-[#ededed] text-[#030303] font-medium'
                    : 'text-[#737373] hover:text-[#ededed]'
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 ${
                  period === 'all'
                    ? 'bg-[#ededed] text-[#030303] font-medium'
                    : 'text-[#737373] hover:text-[#ededed]'
                }`}
              >
                ALL
              </button>
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="p-12 text-center font-mono text-xs uppercase text-[#737373]">
            Loading topic taxonomy...
          </div>
        ) : (
          <div
            data-testid="topics-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredTopics.map((topic) => (
              <div
                key={topic.slug}
                data-testid="topic-card"
                className="border border-[#222222] bg-[#060606] hover:border-[#383838] transition-colors p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#191919] pb-2.5">
                    <Link
                      href={`/topic/${encodeURIComponent(topic.slug.replace(/_/g, '-'))}`}
                      className="font-mono text-sm uppercase font-semibold text-[#ededed] hover:underline"
                    >
                      {topic.slug}
                    </Link>
                    <span className="font-mono text-xs text-[#737373]">
                      {topic.signalCount}
                    </span>
                  </div>

                  {topic.description && (
                    <p className="text-xs text-[#8a8a8a] leading-relaxed">
                      {topic.description}
                    </p>
                  )}

                  {/* ASCII Subtopic Tree */}
                  <div className="space-y-1.5 font-mono text-xs pt-1">
                    {topic.subtopics.map((sub, idx) => {
                      const isLast = idx === topic.subtopics.length - 1;
                      return (
                        <Link
                          key={sub.slug}
                          href={`/topic/${encodeURIComponent(topic.slug.replace(/_/g, '-'))}/${encodeURIComponent(sub.slug.replace(/_/g, '-'))}`}
                          className="flex items-center justify-between text-[#c5c5c5] hover:text-[#ededed] hover:bg-[#0d0d0d] px-1 py-0.5 transition-colors"
                        >
                          <span>
                            <span className="text-[#525252] select-none">
                              {isLast ? '└── ' : '├── '}
                            </span>
                            <span>{sub.slug}</span>
                          </span>
                          <span className="text-[#737373] text-[11px]">
                            {sub.signalCount}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#141414] flex items-center justify-between">
                  <Link
                    href={`/?topic=${encodeURIComponent(topic.slug)}`}
                    className="font-mono text-[11px] uppercase text-[#525252] hover:text-[#c5c5c5]"
                  >
                    Filter Feed
                  </Link>
                  <Link
                    href={`/topic/${encodeURIComponent(topic.slug.replace(/_/g, '-'))}`}
                    className="font-mono text-[11px] uppercase text-[#737373] hover:text-[#ededed]"
                  >
                    Explore #{topic.slug} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
