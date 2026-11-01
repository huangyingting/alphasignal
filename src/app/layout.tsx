import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'AlphaSignal — Curated Intelligence for the Builders of Tomorrow',
  description:
    'Track key signals across the AI ecosystem. Surface the repositories, papers, and technical breakthroughs that matter.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#030303] text-[#ededed] antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
