import Link from 'next/link';

const ASCII_WORDMARK = [
  '  █████╗ ██╗     ██████╗ ██╗  ██╗ █████╗ ███████╗██╗ ██████╗ ███╗   ██╗ █████╗ ██╗     ',
  ' ██╔══██╗██║     ██╔══██╗██║  ██║██╔══██╗██╔════╝██║██╔════╝ ████╗  ██║██╔══██╗██║     ',
  ' ███████║██║     ██████╔╝███████║███████║███████╗██║██║  ███╗██╔██╗ ██║███████║██║     ',
  ' ██╔══██║██║     ██╔═══╝ ██╔══██║██╔══██║╚════██║██║██║   ██║██║╚██╗██║██╔══██║██║     ',
  ' ██║  ██║███████╗██║     ██║  ██║██║  ██║███████║██║╚██████╔╝██║ ╚████║██║  ██║███████╗',
  ' ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝',
].join('\n');

export function AsciiFooter() {
  return (
    <footer className="border-t border-[#222222] bg-[#030303] text-[#737373] mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#181818]">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 text-[#ededed] font-mono text-sm tracking-wider uppercase">
              <span className="inline-block w-2.5 h-2.5 bg-[#ededed]" />
              <span>AlphaSignal</span>
            </div>
            <p className="mt-3 text-xs text-[#737373] max-w-md leading-relaxed">
              AI moves faster than any field in history. AlphaSignal tracks every paper, repo, model, and release in real time—organized, searchable, and tuned to your work.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="md:col-span-7 grid grid-cols-3 gap-6 font-mono text-xs uppercase tracking-wider"
          >
            <div className="space-y-2.5">
              <h2 className="text-[11px] text-[#ededed] font-semibold">PRODUCT</h2>
              <ul className="space-y-2 text-[11px]">
                <li><Link href="/" className="hover:text-[#ededed]">Latest</Link></li>
                <li><Link href="/editorial" className="hover:text-[#ededed]">Editorial</Link></li>
                <li><Link href="/company/leaderboard" className="hover:text-[#ededed]">Leaderboard</Link></li>
                <li><Link href="/topics" className="hover:text-[#ededed]">Topics</Link></li>
                <li><Link href="/archive" className="hover:text-[#ededed]">Archive</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-[11px] text-[#ededed] font-semibold">RESOURCES</h2>
              <ul className="space-y-2 text-[11px]">
                <li><Link href="/newsletter" className="hover:text-[#ededed]">Newsletter</Link></li>
                <li><Link href="/pricing" className="hover:text-[#ededed]">Upgrade</Link></li>
                <li><Link href="/advertise" className="hover:text-[#ededed]">Advertise</Link></li>
                <li><a href="mailto:alpha@alphasignal.ai" className="hover:text-[#ededed]">Get Listed</a></li>
                <li><a href="mailto:kevin@alphasignal.ai" className="hover:text-[#ededed]">Enterprise</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-[11px] text-[#ededed] font-semibold">COMPANY</h2>
              <ul className="space-y-2 text-[11px]">
                <li><Link href="/about" className="hover:text-[#ededed]">About</Link></li>
                <li><Link href="/editorial-team" className="hover:text-[#ededed]">Editorial Team</Link></li>
                <li><Link href="/terms" className="hover:text-[#ededed]">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-[#ededed]">Privacy</Link></li>
                <li><Link href="/careers" className="hover:text-[#ededed]">Careers</Link></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="pt-8 overflow-x-auto">
          <pre
            aria-hidden="true"
            className="font-mono text-[8px] sm:text-[10px] md:text-[11px] leading-[1.15] text-[#262626] select-none tracking-tighter"
          >
            {ASCII_WORDMARK}
          </pre>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-[11px] text-[#525252] uppercase">
          <span>© {new Date().getFullYear()} AlphaSignal. All rights reserved.</span>
          <span>INVITE-ONLY ACCESS • ZERO SYNTHETIC DATA</span>
        </div>
      </div>
    </footer>
  );
}
