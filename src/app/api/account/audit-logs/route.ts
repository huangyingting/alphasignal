import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/api';

export async function GET(req: Request) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? undefined;
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 100), 1), 250);

  const auditLogs = await prisma.auditLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actorUser: { select: { id: true, email: true, name: true, role: true } },
      targetUser: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  return NextResponse.json({ auditLogs });
}
