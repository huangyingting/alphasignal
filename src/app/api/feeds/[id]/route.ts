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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const writeError = requireWriteAccess(auth.user);
  if (writeError) return writeError;

  const { id } = await context.params;
  const existing = await prisma.customFeed.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return jsonError('Custom feed not found.', 404);
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      isDefault?: boolean;
      sortOrder?: number;
      filters?: FilterInput[];
    };

    const nextName = body.name ? body.name.trim() : existing.name;
    const sanitizedFilters = Array.isArray(body.filters)
      ? body.filters
          .map((f) => ({
            filterType: (f.filterType ?? 'TOPIC').toUpperCase(),
            mode: f.mode?.toUpperCase() === 'EXCLUDE' ? 'EXCLUDE' : 'INCLUDE',
            value: (f.value ?? '').trim(),
          }))
          .filter((f) => f.value.length > 0)
      : null;

    const updated = await prisma.$transaction(async (tx) => {
      if (sanitizedFilters !== null) {
        await tx.customFeedFilter.deleteMany({ where: { feedId: existing.id } });
        if (sanitizedFilters.length > 0) {
          await tx.customFeedFilter.createMany({
            data: sanitizedFilters.map((f) => ({
              feedId: existing.id,
              filterType: f.filterType,
              mode: f.mode,
              value: f.value,
            })),
          });
        }
      }

      return tx.customFeed.update({
        where: { id: existing.id },
        data: {
          name: nextName,
          isDefault:
            typeof body.isDefault === 'boolean' ? body.isDefault : existing.isDefault,
          sortOrder:
            typeof body.sortOrder === 'number' ? body.sortOrder : existing.sortOrder,
        },
        include: { filters: true },
      });
    });

    return NextResponse.json({ feed: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update custom feed.';
    return jsonError(message, 400);
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const writeError = requireWriteAccess(auth.user);
  if (writeError) return writeError;

  const { id } = await context.params;
  const existing = await prisma.customFeed.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return jsonError('Custom feed not found.', 404);
  }

  await prisma.customFeed.delete({ where: { id: existing.id } });
  return NextResponse.json({ status: 'deleted' });
}
