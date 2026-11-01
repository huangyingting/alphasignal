import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuthenticatedUser,
  verifyRequestOrigin,
} from '@/lib/api';

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') ?? 'all';

  const notifications = await prisma.notification.findMany({
    where: {
      userId: auth.user.id,
      ...(filter === 'unread' ? { readAt: null } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: auth.user.id, readAt: null },
  });

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      href: n.href,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

export async function PATCH(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as {
    notificationId?: string;
    markAllRead?: boolean;
  };

  const now = new Date();
  if (body.markAllRead || !body.notificationId) {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, readAt: null },
      data: { readAt: now },
    });
  } else {
    await prisma.notification.updateMany({
      where: { id: body.notificationId, userId: auth.user.id },
      data: { readAt: now },
    });
  }

  return NextResponse.json({ status: 'ok' });
}
