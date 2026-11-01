import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export default function AdvertisePage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="space-y-3 border-b border-[#222222] pb-8">
          <div className="font-mono text-xs uppercase tracking-widest text-[#737373]">
            PARTNERSHIPS
          </div>
          <h1 className="font-serif text-4xl text-[#ededed] font-normal">
            Reach the engineers building frontier AI.
          </h1>
          <p className="text-base text-[#c5c5c5] leading-relaxed">
            AlphaSignal connects infrastructure providers, developer platforms, and research labs with over 200,000 machine learning engineers, researchers, and technical founders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="border border-[#222222] bg-[#060606] p-5 space-y-2">
            <div className="font-mono text-xs uppercase text-[#737373]">AUDIENCE</div>
            <div className="font-serif text-3xl text-[#ededed]">200K+</div>
            <p className="text-xs text-[#999999]">
              Verified AI engineers, ML researchers, and VP/CTO technical decision makers.
            </p>
          </div>
          <div className="border border-[#222222] bg-[#060606] p-5 space-y-2">
            <div className="font-mono text-xs uppercase text-[#737373]">ENGAGEMENT</div>
            <div className="font-serif text-3xl text-[#ededed]">48%+</div>
            <p className="text-xs text-[#999999]">
              Daily technical briefing open rate across frontier research organizations.
            </p>
          </div>
          <div className="border border-[#222222] bg-[#060606] p-5 space-y-2">
            <div className="font-mono text-xs uppercase text-[#737373]">FORMAT</div>
            <div className="font-serif text-3xl text-[#ededed]">Native</div>
            <p className="text-xs text-[#999999]">
              Technical deep-dives, benchmark spotlights, and SDK launch briefings.
            </p>
          </div>
        </div>

        <div>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 border border-[#222222] bg-[#0a0a0a] hover:border-[#444444] font-mono text-xs uppercase text-[#ededed]"
          >
            ← Back to Intelligence Feed
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
