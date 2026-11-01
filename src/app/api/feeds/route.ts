import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonError,
  requireAuthenticatedUser,
  requireWriteAccess,
  verifyRequestOrigin,
} from '@/lib/api';

type FilterInput = {
  filterType?: string;
  mode?: string;
  value?: string;
};

function slugifyFeedName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'custom-feed'}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  const feeds = await prisma.customFeed.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      filters: true,
    },
  });

  return NextResponse.json({ feeds });
}

export async function POST(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const writeError = requireWriteAccess(auth.user);
  if (writeError) return writeError;

  try {
    const body = (await req.json()) as {
      name?: string;
      isDefault?: boolean;
      filters?: FilterInput[];
    };

    const name = (body.name ?? '').trim();
    if (!name || name.length < 2) {
      return jsonError('Feed name must be at least 2 characters.', 400);
    }

    const sanitizedFilters = (Array.isArray(body.filters) ? body.filters : [])
      .map((f) => ({
        filterType: (f.filterType ?? 'TOPIC').toUpperCase(),
        mode: f.mode?.toUpperCase() === 'EXCLUDE' ? 'EXCLUDE' : 'INCLUDE',
        value: (f.value ?? '').trim(),
      }))
      .filter((f) => f.value.length > 0);

    const feed = await prisma.customFeed.create({
      data: {
        userId: auth.user.id,
        name,
        slug: slugifyFeedName(name),
        isDefault: Boolean(body.isDefault),
        filters: {
          create: sanitizedFilters,
        },
      },
      include: { filters: true },
    });

    return NextResponse.json({ feed }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create custom feed.';
    return jsonError(message, 400);
  }
}
