'use client';

import { useSession } from 'next-auth/react';
import { SignalDetailDrawer } from './SignalDetailDrawer';

export function SignalDetailModal({
  signalId,
  onClose,
}: {
  signalId: string | null;
  onClose: () => void;
}) {
  const { status } = useSession();
  return (
    <SignalDetailDrawer
      signalId={signalId}
      onClose={onClose}
      isAuthenticated={status === 'authenticated'}
    />
  );
}
