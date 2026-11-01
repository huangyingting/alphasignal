import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import { authOptions } from './auth';
import { evaluateLoginEligibility } from './account-admission';
import { prisma } from './prisma';

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  role: UserRole;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, RateBucket>();

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra ?? {}) }, { status });
}

export function verifyRequestOrigin(req: Request): NextResponse | null {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin) {
    const secFetchSite = req.headers.get('sec-fetch-site');
    if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
      return jsonError('Cross-site request blocked.', 403);
    }
    return null;
  }

  try {
    const originUrl = new URL(origin);
    const allowedHosts = new Set<string>();
    if (host) allowedHosts.add(host.toLowerCase());
    if (process.env.NEXTAUTH_URL) {
      allowedHosts.add(new URL(process.env.NEXTAUTH_URL).host.toLowerCase());
    }
    if (!allowedHosts.has(originUrl.host.toLowerCase())) {
      return jsonError('Invalid request origin.', 403);
    }
  } catch {
    return jsonError('Malformed request origin.', 403);
  }

  return null;
}

export function clientIpKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  return forwarded || realIp || 'local';
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): boolean {
  if (rateBuckets.size > 5000) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
  const existing = rateBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) {
    return false;
  }
  existing.count += 1;
  return true;
}

export async function getOptionalSessionUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      admittedAt: true,
      disabledAt: true,
    },
  });

  if (!user || !evaluateLoginEligibility(user).allowed) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
  };
}

export async function requireAuthenticatedUser(): Promise<
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse }
> {
  const user = await getOptionalSessionUser();
  if (!user) {
    return {
      ok: false,
      response: jsonError('Authentication required.', 401),
    };
  }
  return { ok: true, user };
}

export async function requireAdminUser(): Promise<
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse }
> {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth;
  if (auth.user.role !== 'ADMIN') {
    return {
      ok: false,
      response: jsonError('Administrator privileges are required.', 403),
    };
  }
  return auth;
}

export function requireWriteAccess(user: AuthenticatedUser): NextResponse | null {
  if (user.role === 'VIEWER') {
    return jsonError('Your account has read-only viewer permissions.', 403);
  }
  return null;
}

export function safeExternalHref(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}
