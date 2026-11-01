import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export default function SignalsInfoPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="space-y-3 border-b border-[#222222] pb-8">
          <div className="font-mono text-xs uppercase tracking-widest text-[#737373]">
            SIGNAL METHODOLOGY
          </div>
          <h1 className="font-serif text-4xl text-[#ededed] font-normal">
            How AlphaSignal indexes the AI ecosystem.
          </h1>
          <p className="text-base text-[#c5c5c5] leading-relaxed">
            Our ingestion pipeline continuously monitors GitHub repositories, arXiv cs.AI/cs.CL/cs.LG preprints, benchmark leaderboards, and technical engineering releases across 21 canonical domains.
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs text-[#c5c5c5]">
          <div className="border border-[#222222] bg-[#060606] p-5 space-y-2">
            <div className="text-[#ededed] uppercase">01 • REAL UPSTREAM INGESTION</div>
            <p className="font-sans text-sm text-[#999999]">
              Every signal is linked directly to its primary source (GitHub repository, arXiv paper, or engineering announcement) and structured into What Happened, Why It Matters, and Key Technical Insights.
            </p>
          </div>
          <div className="border border-[#222222] bg-[#060606] p-5 space-y-2">
            <div className="text-[#ededed] uppercase">02 • 21-DOMAIN TAXONOMY & SUBTOPIC TREES</div>
            <p className="font-sans text-sm text-[#999999]">
              Signals are automatically classified into 21 canonical domains (`agents`, `llms`, `gpus`, `post_training`, `reasoning`, `robotics`, and more) and 75 granular subtopics.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/topics"
            className="px-5 py-2.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
          >
            Explore Taxonomy →
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 border border-[#222222] font-mono text-xs uppercase text-[#ededed]"
          >
            View Live Feed
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
