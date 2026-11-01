import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export default function CareersPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="space-y-3 border-b border-[#222222] pb-8">
          <div className="font-mono text-xs uppercase tracking-widest text-[#737373]">
            CAREERS AT ALPHASIGNAL
          </div>
          <h1 className="font-serif text-4xl text-[#ededed] font-normal">
            Build the intelligence layer for frontier AI.
          </h1>
          <p className="text-base text-[#c5c5c5] leading-relaxed">
            We are a compact team of systems engineers and ML researchers building real-time signal indexing, evaluation benchmarks, and high-density developer tools.
          </p>
        </div>

        <div className="border border-[#222222] bg-[#060606] p-6 space-y-2">
          <div className="font-mono text-xs uppercase text-[#737373]">
            CURRENT STATUS
          </div>
          <p className="text-sm text-[#c5c5c5]">
            Roles are filled via direct invitation from our engineering network. Follow live repositories and research signals on the main terminal.
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 border border-[#222222] bg-[#0a0a0a] font-mono text-xs uppercase text-[#ededed]"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
