import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compileEmailReportFromSignals } from '@/lib/ingest';
import {
  jsonError,
  requireAuthenticatedUser,
  requireWriteAccess,
  verifyRequestOrigin,
} from '@/lib/api';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const q = (searchParams.get('q') ?? '').trim();

  if (slug) {
    const report = await prisma.emailReport.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    });
    if (!report) {
      return jsonError('Email report not found.', 404);
    }
    return NextResponse.json({ report });
  }

  const reports = await prisma.emailReport.findMany({
    where: q
      ? {
          OR: [
            { subject: { contains: q } },
            { summary: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { editionDate: 'desc' },
    take: 60,
  });

  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const writeError = requireWriteAccess(auth.user);
  if (writeError) return writeError;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      subject?: string;
    };
    const report = await compileEmailReportFromSignals(prisma, {
      subject: body.subject,
    });
    if (!report) {
      return jsonError('No signals available to compile an email report. Ingest or publish signals first.', 400);
    }
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to compile email report.';
    return jsonError(message, 400);
  }
}
