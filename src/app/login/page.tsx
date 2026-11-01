'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AppShell } from '@/components/AppShell';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'InvitationRequired'
      ? 'This email does not belong to an admitted invited account.'
      : errorParam === 'AccountDisabled'
      ? 'This account has been disabled by an administrator.'
      : errorParam
      ? 'Invalid credentials or uninvited account.'
      : null
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setErrorMessage(
          'Authentication failed. Ensure your account has accepted a valid invitation and your password is correct.'
        );
      } else {
        router.push('/');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRedeemRedirect(e: React.FormEvent) {
    e.preventDefault();
    const raw = inviteCodeInput.trim();
    if (!raw) return;
    const token = raw.includes('/invite/') ? raw.split('/invite/').pop() ?? raw : raw;
    router.push(`/invite/${encodeURIComponent(token.trim())}`);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <div className="space-y-2 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-[#737373]">
          INVITATION-ONLY TERMINAL
        </div>
        <h1 className="font-serif text-3xl text-[#ededed] font-normal">
          Sign in to AlphaSignal
        </h1>
        <p className="text-sm text-[#c5c5c5]">
          Access personalized feeds, bookmarks, technical discussions, and operator tooling.
        </p>
      </div>

      <form
        onSubmit={handleLogin}
        className="border border-[#222222] bg-[#060606] p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="builder@domain.com"
            data-testid="login-email-input"
            className="w-full px-3 py-2 border border-[#222222] bg-[#030303] font-mono text-xs text-[#ededed] outline-none focus:border-[#555555]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="font-mono text-[11px] uppercase text-[#737373] hover:text-[#ededed]"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="login-password-input"
            className="w-full px-3 py-2 border border-[#222222] bg-[#030303] font-mono text-xs text-[#ededed] outline-none focus:border-[#555555]"
          />
        </div>

        {errorMessage && (
          <div
            data-testid="login-error-banner"
            className="p-3 border border-red-900 bg-red-950/30 font-mono text-xs text-red-300"
          >
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          data-testid="login-submit-button"
          className="w-full py-2.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium hover:bg-white disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      {/* Invitation Code Redemption Box */}
      <form
        onSubmit={handleRedeemRedirect}
        className="border border-[#222222] bg-[#060606] p-5 space-y-3"
      >
        <div className="font-mono text-xs uppercase text-[#ededed]">
          Have a Single-Use Invitation Token?
        </div>
        <p className="text-xs text-[#737373]">
          Paste your invitation token or link below to activate your account.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteCodeInput}
            onChange={(e) => setInviteCodeInput(e.target.value)}
            placeholder="Paste invitation token..."
            className="flex-1 px-3 py-1.5 border border-[#222222] bg-[#030303] font-mono text-xs text-[#ededed]"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 border border-[#222222] bg-[#121212] hover:border-[#444444] font-mono text-xs uppercase text-[#ededed]"
          >
            Redeem
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-12 font-mono text-xs uppercase text-[#737373]">
            Loading authentication...
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </AppShell>
  );
}
