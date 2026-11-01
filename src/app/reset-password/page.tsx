'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/password-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to reset password.');
      } else {
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-3xl text-[#ededed] font-normal">
          Choose New Password
        </h1>
      </div>

      {done ? (
        <div className="border border-[#222222] bg-[#060606] p-6 text-center space-y-4">
          <p className="text-sm text-emerald-400 font-mono">
            Your password has been reset and prior sessions invalidated.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
          >
            Sign In
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="border border-[#222222] bg-[#060606] p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
              New Password (min 10 chars, letters + numbers)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#222222] bg-[#030303] font-mono text-xs text-[#ededed]"
            />
          </div>

          {error && <p className="font-mono text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
          >
            {loading ? 'Updating...' : 'Save New Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-12 font-mono text-xs uppercase text-[#737373]">
            Loading...
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </AppShell>
  );
}
