import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export default function NotFound() {
  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 py-28 text-center space-y-6">
        <div className="font-mono text-xs uppercase tracking-widest text-[#737373]">
          404
        </div>
        <h1 className="font-serif text-4xl text-[#ededed] font-normal">
          Page not found
        </h1>
        <p className="text-sm text-[#c5c5c5] leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium hover:bg-white transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
