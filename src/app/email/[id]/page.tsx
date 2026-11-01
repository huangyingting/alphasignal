'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

type EmailReportDetail = {
  id: string;
  slug: string;
  subject: string;
  editionDate: string;
  summary: string;
  htmlContent: string;
  textContent: string;
};

export default function EmailIssuePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const [report, setReport] = useState<EmailReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/archive?slug=${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.report) setReport(data.report);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <AppShell>
      <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-8">
        <div className="mb-6">
          <Link
            href="/archive"
            className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ← ALL ISSUES
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Loading newsletter edition...
          </div>
        ) : !report ? (
          <div className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-10 text-center">
            <h1 className="font-serif text-2xl text-[var(--text-primary)]">
              Newsletter issue not found
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Compile a new daily digest from the Archive page or select an existing issue.
            </p>
            <Link
              href="/archive"
              className="mt-5 inline-block rounded-xs border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--bg-primary)]"
            >
              Return to Archive
            </Link>
          </div>
        ) : (
          <article className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-6 sm:p-10">
            <header className="border-b border-[var(--border)] pb-6">
              <h1 className="font-serif text-3xl leading-tight text-[var(--text-primary)] sm:text-4xl">
                {report.subject}
              </h1>
              <p className="mt-3 text-base text-[var(--text-secondary)]">
                {report.summary}
              </p>
              <div className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {new Date(report.editionDate).toLocaleString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </header>

            <div
              className="prose prose-invert mt-8 max-w-none text-sm leading-relaxed text-[var(--text-secondary)]"
              dangerouslySetInnerHTML={{ __html: report.htmlContent }}
            />
          </article>
        )}
      </div>
    </AppShell>
  );
}
