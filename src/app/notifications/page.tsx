'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    await loadNotifications();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-8" data-testid="notifications-page">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <h1 className="font-serif text-3xl text-[var(--text-primary)]">
            Notifications
          </h1>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-xs border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="mt-10 rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-12 text-center">
            <h2 className="font-serif text-2xl text-[var(--text-primary)]">
              No notifications here
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              New activity from the topics and people you follow will show up here.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/topics"
                className="rounded-xs border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--bg-primary)]"
              >
                Explore Topics
              </Link>
              <Link
                href="/company/leaderboard"
                className="rounded-xs border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Follow Companies
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-[var(--border)] rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)]">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start justify-between gap-4 p-4 ${
                  !n.readAt ? 'bg-[var(--bg-tertiary)]' : ''
                }`}
              >
                <div>
                  <div className="font-medium text-[var(--text-primary)]">
                    {n.title}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {n.body}
                  </p>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {n.href && (
                  <Link
                    href={n.href}
                    className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-[var(--accent)] hover:underline"
                  >
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
