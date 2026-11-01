import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  CANONICAL_TOPICS,
  classifySignalContent,
  ensureCanonicalTaxonomy,
} from '@/lib/taxonomy';
import {
  jsonError,
  requireAuthenticatedUser,
  requireWriteAccess,
  safeExternalHref,
  verifyRequestOrigin,
} from '@/lib/api';

const PERSONALIZATION_FEED_NAME = '__personalization__';

async function loadPersonalization(userId: string) {
  const feed = await prisma.customFeed.findFirst({
    where: { userId, name: PERSONALIZATION_FEED_NAME },
    include: { filters: true },
  });

  if (!feed) {
    return {
      followedTopics: CANONICAL_TOPICS.map((t) => t.slug),
      followedSubtopics: [] as string[],
      followedCompanies: [] as string[],
      contentTypes: ['NEWS', 'PAPERS', 'MODELS', 'REPOS'],
      stackDescription: '',
    };
  }

  const followedTopics = feed.filters
    .filter((f) => f.filterType === 'TOPIC' && f.mode === 'INCLUDE')
    .map((f) => f.value);
  const followedSubtopics = feed.filters
    .filter((f) => f.filterType === 'SUBTOPIC' && f.mode === 'INCLUDE')
    .map((f) => f.value);
  const followedCompanies = feed.filters
    .filter((f) => f.filterType === 'COMPANY' && f.mode === 'INCLUDE')
    .map((f) => f.value);
  const contentTypes = feed.filters
    .filter((f) => f.filterType === 'SOURCE' && f.mode === 'INCLUDE')
    .map((f) => f.value);
  const stackFilter = feed.filters.find(
    (f) => f.filterType === 'STACK_DESCRIPTION'
  );

  return {
    followedTopics:
      followedTopics.length > 0
        ? followedTopics
        : CANONICAL_TOPICS.map((t) => t.slug),
    followedSubtopics,
    followedCompanies,
    contentTypes:
      contentTypes.length > 0
        ? contentTypes
        : ['NEWS', 'PAPERS', 'MODELS', 'REPOS'],
    stackDescription: stackFilter?.value ?? '',
  };
}

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  await ensureCanonicalTaxonomy(prisma);
  const { searchParams } = new URL(req.url);
  const isExport = searchParams.get('export') === '1';

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      bio: true,
      websiteUrl: true,
      githubHandle: true,
      twitterHandle: true,
      role: true,
      admissionSource: true,
      admittedAt: true,
      emailPreference: true,
      _count: {
        select: {
          bookmarks: true,
          upvotes: true,
          comments: true,
        },
      },
    },
  });

  if (!user) {
    return jsonError('User not found.', 404);
  }

  const emailPreference =
    user.emailPreference ??
    (await prisma.emailPreference.create({
      data: {
        userId: user.id,
        dailyDigest: true,
        weeklyTopPapers: true,
        productAlerts: false,
      },
    }));

  const personalization = await loadPersonalization(user.id);

  if (isExport) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: { signal: { select: { slug: true, title: true, originalUrl: true } } },
    });
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      profile: user,
      emailPreference,
      personalization,
      bookmarks,
    });
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      username: user.username ?? '',
      bio: user.bio ?? '',
      websiteUrl: user.websiteUrl ?? '',
      githubHandle: user.githubHandle ?? '',
      twitterHandle: user.twitterHandle ?? '',
      role: user.role,
      admissionSource: user.admissionSource,
      admittedAt: user.admittedAt ? user.admittedAt.toISOString() : null,
      articlesRead: user._count.bookmarks + user._count.upvotes,
      dayStreak: user._count.upvotes > 0 || user._count.bookmarks > 0 ? 1 : 0,
    },
    emailPreference: {
      dailyDigest: emailPreference.dailyDigest,
      weeklyTopPapers: emailPreference.weeklyTopPapers,
      productAlerts: emailPreference.productAlerts,
      timezone: emailPreference.timezone,
      deliveryHour: emailPreference.deliveryHour,
    },
    personalization,
  });
}

export async function PATCH(req: Request) {
  const originError = verifyRequestOrigin(req);
  if (originError) return originError;

  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const writeError = requireWriteAccess(auth.user);
  if (writeError) return writeError;

  try {
    const body = (await req.json()) as {
      name?: string;
      username?: string;
      bio?: string;
      websiteUrl?: string;
      githubHandle?: string;
      twitterHandle?: string;
      emailPreference?: {
        dailyDigest?: boolean;
        weeklyTopPapers?: boolean;
        productAlerts?: boolean;
        timezone?: string;
        deliveryHour?: number;
      };
      personalization?: {
        followedTopics?: string[];
        followedSubtopics?: string[];
        followedCompanies?: string[];
        contentTypes?: string[];
        stackDescription?: string;
        syncStack?: boolean;
      };
    };

    const updateProfileData: Record<string, unknown> = {};
    if (typeof body.name === 'string') {
      updateProfileData.name = body.name.trim().slice(0, 80) || null;
    }
    if (typeof body.username === 'string') {
      const cleaned = body.username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 32);
      if (cleaned.length < 3) {
        return jsonError('Username must be at least 3 alphanumeric characters.', 400);
      }
      const conflict = await prisma.user.findUnique({ where: { username: cleaned } });
      if (conflict && conflict.id !== auth.user.id) {
        return jsonError('That username is already taken.', 400);
      }
      updateProfileData.username = cleaned;
    }
    if (typeof body.bio === 'string') {
      updateProfileData.bio = body.bio.trim().slice(0, 500) || null;
    }
    if (typeof body.websiteUrl === 'string') {
      const trimmedUrl = body.websiteUrl.trim();
      updateProfileData.websiteUrl = trimmedUrl ? safeExternalHref(trimmedUrl) : null;
    }
    if (typeof body.githubHandle === 'string') {
      updateProfileData.githubHandle = body.githubHandle.trim().replace(/^@/, '').slice(0, 40) || null;
    }
    if (typeof body.twitterHandle === 'string') {
      updateProfileData.twitterHandle = body.twitterHandle.trim().replace(/^@/, '').slice(0, 40) || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: updateProfileData,
    });

    let updatedPref = await prisma.emailPreference.findUnique({
      where: { userId: auth.user.id },
    });

    if (body.emailPreference) {
      updatedPref = await prisma.emailPreference.upsert({
        where: { userId: auth.user.id },
        update: {
          dailyDigest:
            typeof body.emailPreference.dailyDigest === 'boolean'
              ? body.emailPreference.dailyDigest
              : undefined,
          weeklyTopPapers:
            typeof body.emailPreference.weeklyTopPapers === 'boolean'
              ? body.emailPreference.weeklyTopPapers
              : undefined,
          productAlerts:
            typeof body.emailPreference.productAlerts === 'boolean'
              ? body.emailPreference.productAlerts
              : undefined,
          timezone:
            typeof body.emailPreference.timezone === 'string'
              ? body.emailPreference.timezone.slice(0, 64)
              : undefined,
          deliveryHour:
            typeof body.emailPreference.deliveryHour === 'number'
              ? Math.min(Math.max(body.emailPreference.deliveryHour, 0), 23)
              : undefined,
        },
        create: {
          userId: auth.user.id,
          dailyDigest: body.emailPreference.dailyDigest ?? true,
          weeklyTopPapers: body.emailPreference.weeklyTopPapers ?? true,
          productAlerts: body.emailPreference.productAlerts ?? false,
          timezone: body.emailPreference.timezone ?? 'UTC',
          deliveryHour: body.emailPreference.deliveryHour ?? 13,
        },
      });
    }

    if (body.personalization) {
      const current = await loadPersonalization(auth.user.id);
      let nextTopics = body.personalization.followedTopics ?? current.followedTopics;
      let nextSubtopics =
        body.personalization.followedSubtopics ?? current.followedSubtopics;
      let nextCompanies =
        body.personalization.followedCompanies ?? current.followedCompanies;
      const nextContentTypes =
        body.personalization.contentTypes ?? current.contentTypes;
      const nextStack =
        body.personalization.stackDescription !== undefined
          ? body.personalization.stackDescription.slice(0, 1000)
          : current.stackDescription;

      if (body.personalization.syncStack && nextStack.trim()) {
        const classified = classifySignalContent({
          title: nextStack,
          summary: nextStack,
        });
        nextTopics = Array.from(
          new Set([...nextTopics, ...classified.topics.map((t) => t.topicSlug)])
        );
        nextSubtopics = Array.from(
          new Set([
            ...nextSubtopics,
            ...classified.topics
              .map((t) => t.subtopicSlug)
              .filter((s): s is string => Boolean(s)),
          ])
        );
        nextCompanies = Array.from(
          new Set([...nextCompanies, ...classified.companies])
        );
      }

      const existingFeed = await prisma.customFeed.findFirst({
        where: { userId: auth.user.id, name: PERSONALIZATION_FEED_NAME },
      });

      const feedId = existingFeed
        ? existingFeed.id
        : (
            await prisma.customFeed.create({
              data: {
                userId: auth.user.id,
                name: PERSONALIZATION_FEED_NAME,
                slug: '__personalization__',
                isDefault: false,
              },
            })
          ).id;

      await prisma.customFeedFilter.deleteMany({
        where: { feedId },
      });

      const filterRows = [
        ...nextTopics.map((value) => ({
          feedId,
          filterType: 'TOPIC',
          mode: 'INCLUDE',
          value,
        })),
        ...nextSubtopics.map((value) => ({
          feedId,
          filterType: 'SUBTOPIC',
          mode: 'INCLUDE',
          value,
        })),
        ...nextCompanies.map((value) => ({
          feedId,
          filterType: 'COMPANY',
          mode: 'INCLUDE',
          value,
        })),
        ...nextContentTypes.map((value) => ({
          feedId,
          filterType: 'SOURCE',
          mode: 'INCLUDE',
          value,
        })),
        ...(nextStack
          ? [
              {
                feedId,
                filterType: 'STACK_DESCRIPTION',
                mode: 'INCLUDE',
                value: nextStack,
              },
            ]
          : []),
      ];

      if (filterRows.length > 0) {
        await prisma.customFeedFilter.createMany({
          data: filterRows,
        });
      }
    }

    const updatedPersonalization = await loadPersonalization(auth.user.id);

    return NextResponse.json({
      status: 'ok',
      profile: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name ?? '',
        username: updatedUser.username ?? '',
        bio: updatedUser.bio ?? '',
        websiteUrl: updatedUser.websiteUrl ?? '',
        githubHandle: updatedUser.githubHandle ?? '',
        twitterHandle: updatedUser.twitterHandle ?? '',
        role: updatedUser.role,
      },
      emailPreference: updatedPref,
      personalization: updatedPersonalization,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save settings.';
    return jsonError(message, 400);
  }
}
