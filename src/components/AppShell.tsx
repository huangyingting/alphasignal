'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Bell,
  Bookmark,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { AsciiFooter } from './AsciiFooter';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function AppShell({
  children,
  onOpenSearch,
}: {
  children: React.ReactNode;
  onOpenSearch?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);
  const isAdmin = session?.user?.role === 'ADMIN';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cmdSearchOpen, setCmdSearchOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cookieDismissed, setCookieDismissed] = useState(true);
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('alphasignal_cookie_consent');
      if (!saved) {
        setCookieDismissed(false);
      }
    } catch {
      setCookieDismissed(true);
    }
  }, []);

  function acceptCookies() {
    setCookieDismissed(true);
    setCookieModalOpen(false);
    try {
      window.localStorage.setItem('alphasignal_cookie_consent', 'accepted');
    } catch {}
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onOpenSearch) {
          onOpenSearch();
        } else {
          setCmdSearchOpen((prev) => !prev);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpenSearch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`/api/notifications?filter=${notifFilter}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setNotifications(data.notifications ?? []);
          setUnreadCount(data.unreadCount ?? 0);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, notifFilter, notifOpen]);

  async function handleMarkAllRead() {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    if (res.ok) {
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
      );
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCmdSearchOpen(false);
    const trimmed = cmdQuery.trim();
    if (trimmed) {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/');
    }
  }

  const navItems = [
    { href: '/', label: 'LATEST' },
    { href: '/editorial', label: 'EDITORIAL' },
    { href: '/company/leaderboard', label: 'LEADERBOARD' },
    { href: '/topics', label: 'TOPICS' },
    { href: '/bookmarks', label: 'BOOKMARKS' },
    { href: '/archive', label: 'ARCHIVE' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#030303] text-[#ededed]">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#222222] bg-[#030303]/85 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left Wordmark & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-[#ededed] font-mono text-sm font-semibold tracking-wider uppercase"
            >
              <span className="inline-flex items-center justify-center w-4 h-4 border border-[#ededed] bg-[#ededed] text-[#030303] text-[10px] font-bold">
                α
              </span>
              <span>AlphaSignal</span>
            </Link>

            <nav
              aria-label="Primary navigation"
              className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-wider"
            >
              {navItems.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors py-1 ${
                      active
                        ? 'text-[#ededed] border-b border-[#ededed]'
                        : 'text-[#737373] hover:text-[#ededed]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/pricing"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#222222] bg-[#0a0a0a] hover:border-[#444444] font-mono text-[10px] uppercase tracking-wider text-[#c5c5c5]"
            >
              <span className="text-[#ededed] font-semibold">TRIAL</span>
              <span className="text-[#737373]">14 DAYS LEFT</span>
            </Link>

            {/* Search button */}
            <button
              type="button"
              onClick={() => {
                if (onOpenSearch) {
                  onOpenSearch();
                } else {
                  setCmdSearchOpen(true);
                }
              }}
              data-testid="header-search-button"
              className="flex items-center gap-3 px-3 py-1.5 border border-[#222222] bg-[#0a0a0a] hover:border-[#3a3a3a] font-mono text-xs text-[#737373] hover:text-[#ededed] transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search signals...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] border border-[#222222] bg-[#121212] text-[#737373]">
                ⌘K
              </kbd>
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen((prev) => !prev);
                      setAccountOpen(false);
                    }}
                    aria-label="Notifications"
                    data-testid="notifications-button"
                    className="relative p-2 border border-[#222222] bg-[#0a0a0a] hover:border-[#3a3a3a] text-[#c5c5c5] hover:text-[#ededed]"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 bg-[#ededed] text-[#030303] font-mono text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 border border-[#222222] bg-[#080808] shadow-2xl z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222]">
                        <span className="font-mono text-xs uppercase tracking-wider text-[#ededed]">
                          Notifications
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px] uppercase">
                          <button
                            type="button"
                            onClick={() => setNotifFilter('all')}
                            className={`px-2 py-0.5 ${
                              notifFilter === 'all'
                                ? 'bg-[#ededed] text-[#030303]'
                                : 'text-[#737373] hover:text-[#ededed]'
                            }`}
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => setNotifFilter('unread')}
                            className={`px-2 py-0.5 ${
                              notifFilter === 'unread'
                                ? 'bg-[#ededed] text-[#030303]'
                                : 'text-[#737373] hover:text-[#ededed]'
                            }`}
                          >
                            Unread
                          </button>
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[#181818]">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center font-mono text-xs uppercase text-[#737373]">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3.5 text-xs space-y-1 ${
                                n.readAt ? 'text-[#737373]' : 'bg-[#0e0e0e] text-[#ededed]'
                              }`}
                            >
                              <div className="font-medium text-[#ededed]">{n.title}</div>
                              <p className="text-[#c5c5c5] leading-relaxed">{n.body}</p>
                              {n.href && (
                                <Link
                                  href={n.href}
                                  onClick={() => setNotifOpen(false)}
                                  className="inline-block font-mono text-[11px] uppercase text-[#ededed] underline pt-1"
                                >
                                  View Signal →
                                </Link>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2.5 border-t border-[#222222] flex items-center justify-between">
                        <Link
                          href="/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="font-mono text-[11px] uppercase text-[#c5c5c5] hover:text-[#ededed]"
                        >
                          View all notifications →
                        </Link>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="font-mono text-[11px] uppercase text-[#c5c5c5] hover:text-[#ededed]"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen((prev) => !prev);
                      setNotifOpen(false);
                    }}
                    data-testid="account-menu-button"
                    className="flex items-center gap-2 px-3 py-1.5 border border-[#222222] bg-[#0a0a0a] hover:border-[#3a3a3a] font-mono text-xs uppercase text-[#ededed]"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline max-w-[110px] truncate">
                      {session?.user?.name || session?.user?.email?.split('@')[0] || 'Account'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#737373]" />
                  </button>

                  {accountOpen && (
                    <div className="absolute right-0 mt-2 w-60 border border-[#222222] bg-[#080808] shadow-2xl z-50 py-1 font-mono text-xs uppercase">
                      <div className="px-4 py-2.5 border-b border-[#181818]">
                        <div className="text-[#ededed] truncate font-sans font-medium normal-case">
                          {session?.user?.name}
                        </div>
                        <div className="text-[11px] text-[#737373] truncate normal-case">
                          {session?.user?.email}
                        </div>
                        <div className="mt-1 inline-block px-1.5 py-0.5 bg-[#141414] border border-[#262626] text-[10px] text-[#c5c5c5]">
                          ROLE: {session?.user?.role ?? 'MEMBER'}
                        </div>
                      </div>

                      <Link
                        href="/pricing"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#c5c5c5] hover:bg-[#121212] hover:text-[#ededed]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Membership</span>
                      </Link>
                      <Link
                        href="/newsletter"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#c5c5c5] hover:bg-[#121212] hover:text-[#ededed]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Newsletter</span>
                      </Link>
                      <Link
                        href="/settings?tab=profile"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#c5c5c5] hover:bg-[#121212] hover:text-[#ededed]"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Profile & Settings</span>
                      </Link>
                      <Link
                        href="/bookmarks"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#c5c5c5] hover:bg-[#121212] hover:text-[#ededed]"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Saved Bookmarks</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/settings?tab=invitations"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-[#ededed] bg-[#0e0e0e] hover:bg-[#181818]"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Invitations & Audit</span>
                        </Link>
                      )}
                      <div className="border-t border-[#181818] px-4 py-2 flex items-center justify-between text-[10px] text-[#737373]">
                        <Link href="/about" onClick={() => setAccountOpen(false)} className="hover:text-[#ededed]">
                          About
                        </Link>
                        <Link href="/advertise" onClick={() => setAccountOpen(false)} className="hover:text-[#ededed]">
                          Advertise
                        </Link>
                        <Link href="/privacy" onClick={() => setAccountOpen(false)} className="hover:text-[#ededed]">
                          Privacy
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-red-400 hover:bg-[#121212] border-t border-[#181818]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 border border-[#222222] bg-[#0a0a0a] hover:border-[#444444] font-mono text-xs uppercase text-[#ededed]"
                >
                  Log in
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 border border-[#222222] bg-[#0a0a0a] text-[#ededed]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#222222] bg-[#050505] px-4 py-4 space-y-3 font-mono text-xs uppercase">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#ededed] border-b border-[#161616]"
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-[#c5c5c5]"
                >
                  Settings & Governance
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block py-2 text-red-400 uppercase"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#ededed]"
              >
                Log in (Invited Accounts)
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Global Command Search Modal if not overridden */}
      {cmdSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/75 backdrop-blur-xs px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Search signals"
        >
          <div className="fixed inset-0" onClick={() => setCmdSearchOpen(false)} />
          <div className="relative z-10 w-full max-w-xl border border-[#222222] bg-[#080808] p-4 shadow-2xl">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
              <Search className="w-4 h-4 text-[#737373]" />
              <input
                type="text"
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Search papers, repositories, topics, or companies..."
                className="flex-1 bg-transparent text-sm text-[#ededed] placeholder-[#525252] outline-none font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setCmdSearchOpen(false)}
                className="p-1 text-[#737373] hover:text-[#ededed]"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <main id="main-content" className="flex-1">{children}</main>

      {/* Cookie Consent Banner & Preferences Modal matching 02-home-cookie-desktop.png & 30-cookie-preferences.png */}
      {!cookieDismissed && (
        <div
          data-testid="cookie-banner"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 border border-[#222222] bg-[#080808] p-4 shadow-2xl text-xs text-[#c5c5c5] space-y-3"
        >
          <p className="leading-relaxed">
            We use essential cookies to make our site work. With your consent, we may also use non-essential cookies to improve user experience. Read our{' '}
            <Link href="/privacy" className="underline text-[#ededed]">
              Cookie Policy
            </Link>
            .
          </p>
          <div className="flex items-center justify-end gap-2 font-mono text-[11px] uppercase">
            <button
              type="button"
              onClick={() => setCookieModalOpen(true)}
              className="px-3 py-1.5 border border-[#222222] bg-[#0e0e0e] text-[#c5c5c5] hover:text-[#ededed]"
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={acceptCookies}
              className="px-3 py-1.5 bg-[#ededed] text-[#030303] font-medium"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {cookieModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie Preferences"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-md border border-[#222222] bg-[#080808] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
              <h2 className="font-serif text-xl text-[#ededed]">Cookie Preferences</h2>
              <button
                type="button"
                onClick={() => setCookieModalOpen(false)}
                className="text-[#737373] hover:text-[#ededed]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#c5c5c5]">
              <div className="flex items-center justify-between p-3 border border-[#1c1c1c]">
                <div>
                  <div className="font-mono uppercase text-[#ededed]">Essential Cookies</div>
                  <div className="text-[#737373] mt-0.5">Required for authentication and session security.</div>
                </div>
                <span className="font-mono text-[10px] uppercase text-[#737373]">Always Active</span>
              </div>
              <label className="flex items-center justify-between p-3 border border-[#1c1c1c] cursor-pointer">
                <div>
                  <div className="font-mono uppercase text-[#ededed]">Analytics Cookies</div>
                  <div className="text-[#737373] mt-0.5">Help us measure feed engagement and latency.</div>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsCookies}
                  onChange={(e) => setAnalyticsCookies(e.target.checked)}
                  className="w-4 h-4 accent-[#ededed]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 font-mono text-xs uppercase pt-2">
              <button
                type="button"
                onClick={acceptCookies}
                className="px-4 py-1.5 bg-[#ededed] text-[#030303] font-medium"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      <AsciiFooter />
    </div>
  );
}
