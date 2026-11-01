'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/account/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="space-y-2 text-center">
          <div className="font-mono text-xs uppercase tracking-widest text-[#737373]">
            CREDENTIAL RECOVERY
          </div>
          <h1 className="font-serif text-3xl text-[#ededed] font-normal">
            Reset Password
          </h1>
        </div>

        {submitted ? (
          <div className="border border-[#222222] bg-[#060606] p-6 space-y-4 text-center">
            <p className="text-sm text-[#c5c5c5]">
              If an active invited account matches <span className="font-mono text-[#ededed]">{email}</span>, a one-time password reset token has been issued.
            </p>
            <Link
              href="/login"
              className="inline-block px-4 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="border border-[#222222] bg-[#060606] p-6 space-y-4"
          >
            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#222222] bg-[#030303] font-mono text-xs text-[#ededed]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
            >
              {loading ? 'Sending...' : 'Request Reset Link'}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
