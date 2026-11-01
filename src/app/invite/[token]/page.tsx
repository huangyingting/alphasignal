'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AppShell } from '@/components/AppShell';

type InviteInspection = {
  status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'accepted';
  invitation?: {
    email: string;
    role: string;
    expiresAt: string;
  };
};

export default function InviteRedeemPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [inspection, setInspection] = useState<InviteInspection | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/account-invitations/accept?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data: InviteInspection) => {
        setInspection(data);
      })
      .catch(() => setInspection({ status: 'invalid' }));
  }, [token]);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/account-invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to activate invitation.');
      } else {
        const loginRes = await signIn('credentials', {
          email: inspection?.invitation?.email ?? data.user?.email,
          password,
          redirect: false,
        });
        if (loginRes && !loginRes.error) {
          router.push('/');
          router.refresh();
        } else {
          router.push('/login');
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="space-y-2 text-center">
          <div className="font-mono text-xs uppercase tracking-widest text-[#737373]">
            SINGLE-USE ACCOUNT INVITATION
          </div>
          <h1 className="font-serif text-3xl text-[#ededed] font-normal">
            Activate Your Account
          </h1>
        </div>

        {!inspection ? (
          <div className="border border-[#222222] bg-[#060606] p-8 text-center font-mono text-xs uppercase text-[#737373]">
            Verifying cryptographic invitation token...
          </div>
        ) : inspection.status !== 'valid' || !inspection.invitation ? (
          <div
            data-testid="invite-invalid-state"
            className="border border-[#222222] bg-[#060606] p-8 text-center space-y-4"
          >
            <div className="font-mono text-xs uppercase text-red-400">
              INVITATION STATUS: {inspection.status.toUpperCase()}
            </div>
            <p className="text-sm text-[#c5c5c5]">
              This single-use invitation link is {inspection.status}. Request a rotated link from your AlphaSignal administrator.
            </p>
            <Link
              href="/login"
              className="inline-block px-4 py-2 border border-[#222222] font-mono text-xs uppercase text-[#ededed]"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleAccept}
            className="border border-[#222222] bg-[#060606] p-6 space-y-4"
          >
            <div className="p-3 border border-[#1f1f1f] bg-[#0a0a0a] font-mono text-xs space-y-1">
              <div className="text-[#737373]">
                INVITED EMAIL: <span className="text-[#ededed]">{inspection.invitation.email}</span>
              </div>
              <div className="text-[#737373]">
                ASSIGNED ROLE: <span className="text-[#ededed]">{inspection.invitation.role}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                data-testid="invite-name-input"
                className="w-full px-3 py-2 border border-[#222222] bg-[#030303] text-sm text-[#ededed]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                Handle / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ada_lovelace"
                data-testid="invite-username-input"
                className="w-full px-3 py-2 border border-[#222222] bg-[#030303] font-mono text-xs text-[#ededed]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                Create Password (min 10 chars, letters + numbers)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="invite-password-input"
                className="w-full px-3 py-2 border border-[#222222] bg-[#030303] font-mono text-xs text-[#ededed]"
              />
            </div>

            {error && (
              <div className="p-3 border border-red-900 bg-red-950/30 font-mono text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              data-testid="invite-accept-button"
              className="w-full py-2.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium hover:bg-white"
            >
              {submitting ? 'Activating Account...' : 'Accept Invitation & Sign In'}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
