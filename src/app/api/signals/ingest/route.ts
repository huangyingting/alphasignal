import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ingestLiveSignals } from '@/lib/ingest';
import {
  jsonError,
  requireAuthenticatedUser,
  requireWriteAccess,
  verifyRequestOrigin,
} from '@/lib/api';

export async function POST(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const writeError = requireWriteAccess(auth.user);
  if (writeError) return writeError;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      sources?: Array<'github' | 'arxiv' | 'hn'>;
      limitPerSource?: number;
      compileReport?: boolean;
    };

    const result = await ingestLiveSignals(prisma, {
      sources: body.sources ?? ['github', 'arxiv', 'hn'],
      limitPerSource: body.limitPerSource ?? 4,
      compileReport: body.compileReport ?? true,
      submittedById: auth.user.id,
    });

    return NextResponse.json({
      status: 'ok',
      ingestedCount: result.ingestedCount,
      reportSlug: result.report?.slug ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Live signal ingestion failed.';
    return jsonError(message, 500);
  }
}
