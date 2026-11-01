import { Suspense } from 'react';
import { HomeFeedClient } from '@/components/HomeFeedClient';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030303] text-[#737373] font-mono text-xs uppercase p-12">
          Loading AlphaSignal terminal...
        </div>
      }
    >
      <HomeFeedClient />
    </Suspense>
  );
}
