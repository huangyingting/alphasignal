'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export default function PricingPage() {
  const [billing, setBilling] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');

  return (
    <AppShell>
      <div className="mx-auto max-w-[1160px] px-4 py-12 sm:px-8" data-testid="pricing-page">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-[var(--text-primary)] sm:text-5xl">
            Upgrade
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base">
            Realtime news, model and repo coverage, a feed personalized to your work, and exclusive editorial, all in one platform.
          </p>

          <div className="mt-6 inline-flex rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] p-1 font-mono text-xs uppercase tracking-[0.14em]">
            <button
              type="button"
              onClick={() => setBilling('MONTHLY')}
              className={`rounded-xs px-4 py-1.5 ${
                billing === 'MONTHLY'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              MONTHLY
            </button>
            <button
              type="button"
              onClick={() => setBilling('YEARLY')}
              className={`rounded-xs px-4 py-1.5 ${
                billing === 'YEARLY'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              YEARLY
            </button>
          </div>
        </div>

        {/* 3 Plan Cards matching 25-membership.png & /pricing */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Free */}
          <div className="flex flex-col justify-between rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <div>
              <h2 className="font-serif text-2xl text-[var(--text-primary)]">Free</h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                General feed with news coverage only
              </p>
              <div className="mt-6 font-mono text-4xl font-semibold text-[var(--text-primary)]">
                $0
              </div>
              <ul className="mt-6 space-y-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-secondary)]">
                <li>
                  <strong className="text-[var(--text-primary)]">Announcement coverage</strong> — Stay on top of the day&apos;s biggest AI stories.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">10 broad news topics</strong> — Pick from ten wide-ranging areas across the field.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">General newsletter, with ads</strong> — Open a daily digest each morning, ad-supported.
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <div className="w-full rounded-xs border border-[var(--border)] py-2.5 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                CURRENT PLAN · Free forever
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="flex flex-col justify-between rounded-sm border border-[var(--accent)] bg-[var(--bg-secondary)] p-6">
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em]">
                <span className="text-[var(--accent)]">RECOMMENDED</span>
                <span className="rounded-xs border border-[var(--accent)] px-2 py-0.5 text-[var(--accent)]">
                  SAVE $120/YR
                </span>
              </div>
              <h2 className="mt-2 font-serif text-2xl text-[var(--text-primary)]">Pro</h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Track every release, repo, and paper relevant to your work.
              </p>
              <div className="mt-6 font-mono text-4xl font-semibold text-[var(--text-primary)]">
                {billing === 'YEARLY' ? '$19' : '$29'}
                <span className="text-sm font-normal text-[var(--text-muted)]"> /MO</span>
              </div>
              <ul className="mt-6 space-y-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-secondary)]">
                <li>
                  <strong className="text-[var(--text-primary)]">Full content coverage</strong> — News, Repos, Papers, Models alongside headlines.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">25+ specific sub-topics</strong> — Narrow your feed to the niches you care about.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Exclusive industry analysis</strong> — Original pieces from our research team.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Personalized, ad-free newsletter</strong> — Clean daily email built around your interests.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">$500+ in credits and perks</strong> — $200 Viktor, $100 Wisprflow, 50k Anything.com, 3mo Skej.
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link
                href="/settings"
                className="block w-full rounded-xs border border-[var(--text-primary)] bg-[var(--text-primary)] py-2.5 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--bg-primary)]"
              >
                UPGRADE · Cancel anytime
              </Link>
            </div>
          </div>

          {/* Team */}
          <div className="flex flex-col justify-between rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <div>
              <h2 className="font-serif text-2xl text-[var(--text-primary)]">Team</h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Keep your whole team up to speed.
              </p>
              <div className="mt-6 font-mono text-2xl font-semibold text-[var(--text-primary)]">
                Per seat
              </div>
              <ul className="mt-6 space-y-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-secondary)]">
                <li>
                  <strong className="text-[var(--text-primary)]">Everything in Pro</strong> — Give every teammate the full feature set, seat by seat.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Full 24-month industry archive</strong> — Search two years of past coverage.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">SSO and SAML authentication</strong> — Connect your identity provider.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Custom integrations and API access</strong> — Plug AlphaSignal into internal workflows.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Priority support with SLA</strong> — Guaranteed SLA-backed response times.
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <a
                href="mailto:kevin@alphasignal.ai?subject=AlphaSignal%20Team%20Plan"
                className="block w-full rounded-xs border border-[var(--border-strong)] bg-[var(--bg-primary)] py-2.5 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-primary)] hover:border-[var(--text-primary)]"
              >
                CONTACT US · No commitment
              </a>
            </div>
          </div>
        </div>

        {/* Compare plans matrix */}
        <section className="mt-16">
          <h2 className="font-serif text-3xl text-[var(--text-primary)]">Compare plans</h2>
          <div className="mt-6 overflow-x-auto rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  <th className="p-4">FEATURES</th>
                  <th className="p-4">FREE</th>
                  <th className="p-4">PRO</th>
                  <th className="p-4">TEAM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <td className="p-4 font-mono text-[var(--text-primary)]">FEED</td>
                  <td className="p-4">Recency and upvotes</td>
                  <td className="p-4">Tailored to you</td>
                  <td className="p-4">Tailored to your team</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-[var(--text-primary)]">FILTERING</td>
                  <td className="p-4">10 broad topics</td>
                  <td className="p-4">25+ sub-topics</td>
                  <td className="p-4">25+ sub-topics</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-[var(--text-primary)]">EDITORIAL</td>
                  <td className="p-4">Full access</td>
                  <td className="p-4">Full access</td>
                  <td className="p-4">Full access</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-[var(--text-primary)]">NEWSLETTER</td>
                  <td className="p-4">General, with ads</td>
                  <td className="p-4">Personalized, ad free</td>
                  <td className="p-4">Personalized, ad free</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-[var(--text-primary)]">PERKS</td>
                  <td className="p-4">-</td>
                  <td className="p-4">$500+ in credits</td>
                  <td className="p-4">$500+ in credits</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-[var(--text-primary)]">SECURITY</td>
                  <td className="p-4">-</td>
                  <td className="p-4">-</td>
                  <td className="p-4">SSO and SAML</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-[var(--text-primary)]">COVERAGE</td>
                  <td className="p-4 font-mono text-[var(--text-primary)]">15%</td>
                  <td className="p-4 font-mono text-[var(--accent)]">50%</td>
                  <td className="p-4 font-mono text-[var(--accent)]">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
