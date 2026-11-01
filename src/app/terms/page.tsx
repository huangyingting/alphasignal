'use client';

import React from 'react';
import { AppShell } from '@/components/AppShell';

export default function TermsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-8" data-testid="terms-page">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          LEGAL · EFFECTIVE 2026
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--text-primary)]">
          Terms and Conditions
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]">
          <section className="border-t border-[var(--border)] pt-6">
            <h2 className="font-serif text-xl text-[var(--text-primary)]">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing or using AlphaSignal, you agree to be bound by these Terms and Conditions and our Privacy Policy. AlphaSignal provides real-time AI engineering intelligence, curated research summaries, and personalized feeds.
            </p>
          </section>

          <section className="border-t border-[var(--border)] pt-6">
            <h2 className="font-serif text-xl text-[var(--text-primary)]">
              2. Account Admission &amp; Security
            </h2>
            <p className="mt-2">
              Registration is governed by single-use or expiring invitation tokens or administrator provisioning. You are responsible for safeguarding your account credentials and notifying us of any unauthorized use.
            </p>
          </section>

          <section className="border-t border-[var(--border)] pt-6">
            <h2 className="font-serif text-xl text-[var(--text-primary)]">
              3. Intellectual Property &amp; Attribution
            </h2>
            <p className="mt-2">
              Original editorial analysis, taxonomy structures, and signal rankings are copyright © 2026 AlphaSignal. Linked research papers, open-source repositories, and third-party announcements remain the property of their respective authors and organizations.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
