'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Mail, Plus, Search } from 'lucide-react';
import { AppShell } from '@/components/AppShell';

type EmailReportItem = {
  id: string;
  slug: string;
  subject: string;
  editionDate: string;
  summary: string;
  htmlContent: string;
};

export default function ArchivePage() {
  const { data: session, status } = useSession();
  const canWrite =
    status === 'authenticated' &&
    Boolean(session?.user) &&
    session?.user?.role !== 'VIEWER';

  const [reports, setReports] = useState<EmailReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<EmailReportItem | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadArchive = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/archive?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.reports ?? []) as EmailReportItem[];
        setReports(list);
        if (list.length > 0 && !selectedReport) {
          setSelectedReport(list[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [query, selectedReport]);

  useEffect(() => {
    loadArchive();
  }, [loadArchive]);

  async function handleCompileReport() {
    setCompiling(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Could not compile report.');
      } else if (data.report) {
        await loadArchive();
        setSelectedReport(data.report);
      }
    } finally {
      setCompiling(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#222222] pb-8">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#ededed] font-normal">
              Email Archive
            </h1>
            <p className="text-sm text-[#c5c5c5]">
              Browse past editions of the AlphaSignal technical briefing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border border-[#222222] bg-[#080808] px-3 py-1.5 w-64">
              <Search className="w-3.5 h-3.5 text-[#737373]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search editions..."
                className="w-full bg-transparent font-mono text-xs text-[#ededed] placeholder-[#525252] outline-none"
              />
            </div>

            {canWrite && (
              <button
                type="button"
                onClick={handleCompileReport}
                disabled={compiling}
                data-testid="compile-edition-button"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{compiling ? 'Compiling...' : 'Compile Edition'}</span>
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="px-4 py-2.5 border border-red-900 bg-red-950/30 font-mono text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center font-mono text-xs uppercase text-[#737373]">
            Loading email archive...
          </div>
        ) : reports.length === 0 ? (
          <div className="border border-[#222222] bg-[#060606] p-12 text-center space-y-3">
            <Mail className="w-6 h-6 text-[#737373] mx-auto" />
            <h2 className="font-serif text-2xl text-[#ededed] font-normal">
              No briefing editions archived yet
            </h2>
            <p className="text-sm text-[#c5c5c5] max-w-md mx-auto">
              Once signals are ingested or published, compile an edition to publish a permanent briefing in the archive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Edition List */}
            <div className="lg:col-span-5 space-y-3">
              {reports.map((report) => {
                const active = selectedReport?.id === report.id;
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setSelectedReport(report)}
                    className={`w-full text-left p-4 border transition-colors space-y-1.5 ${
                      active
                        ? 'border-[#ededed] bg-[#0e0e0e]'
                        : 'border-[#222222] bg-[#060606] hover:border-[#3a3a3a]'
                    }`}
                  >
                    <div className="font-mono text-[11px] uppercase text-[#737373]">
                      {new Date(report.editionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="font-medium text-sm text-[#ededed]">
                      {report.subject}
                    </div>
                    <p className="text-xs text-[#999999] line-clamp-2">
                      {report.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Edition Reader */}
            <div className="lg:col-span-7">
              {selectedReport && (
                <div className="border border-[#222222] bg-[#060606] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-[#222222] pb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2">
                      <div className="font-mono text-xs uppercase text-[#737373]">
                        EDITION •{' '}
                        {new Date(selectedReport.editionDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <h2 className="font-serif text-2xl text-[#ededed] font-normal">
                        {selectedReport.subject}
                      </h2>
                    </div>
                    <Link
                      href={`/email/${encodeURIComponent(selectedReport.slug)}`}
                      className="px-3 py-1.5 border border-[#222222] bg-[#0c0c0c] font-mono text-xs uppercase text-[#ededed] hover:border-[#444444]"
                    >
                      Open Issue Page →
                    </Link>
                  </div>

                  <div
                    className="prose prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: selectedReport.htmlContent }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
