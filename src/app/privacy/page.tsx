'use client';

import React from 'react';
import { AppShell } from '@/components/AppShell';

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-8" data-testid="privacy-page">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          LEGAL · DATA GOVERNANCE
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--text-primary)]">
          Privacy Policy
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]">
          <section className="border-t border-[var(--border)] pt-6">
            <h2 className="font-serif text-xl text-[var(--text-primary)]">
              1. Information We Collect
            </h2>
            <p className="mt-2">
              We collect account profile details (email, name, username), personalization preferences (followed topics, subtopics, and companies), bookmarks, upvotes, and security audit logs required for invite-only account governance.
            </p>
          </section>

          <section className="border-t border-[var(--border)] pt-6">
            <h2 className="font-serif text-xl text-[var(--text-primary)]">
              2. Cookie Policy &amp; Preferences
            </h2>
            <p className="mt-2">
              We use essential cookies to authenticate sessions and persist your theme and feed preferences. With your consent, non-essential analytics cookies may be enabled via the Cookie Preferences controls.
            </p>
          </section>

          <section className="border-t border-[var(--border)] pt-6">
            <h2 className="font-serif text-xl text-[var(--text-primary)]">
              3. Data Export &amp; Account Deletion
            </h2>
            <p className="mt-2">
              You can export a complete JSON archive of your profile, personalization rules, and bookmarks at any time from Settings → General → Data &amp; account.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
