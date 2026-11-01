# System Architecture & Data Model — AlphaSignal

## 1. High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Next.js App Router (SSR + Client UI)                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ Public Feeds │ │ Topic & Co.  │ │ User Console │ │ Admin & Studio │  │
│  │ /, /editorial│ │ /topics,     │ │ /bookmarks,  │ │ /admin/*,      │  │
│  │ /news/[slug] │ │ /leaderboard │ │ /settings    │ │ /studio        │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └───────┬────────┘  │
└─────────┼────────────────┼────────────────┼─────────────────┼───────────┘
          │                │                │                 │
          ▼                ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             Hardened API & Service Layer (src/app/api, src/lib)         │
│  • Origin/CSRF verification + RequestLimit rate throttling              │
│  • Account Admission (single-use SHA-256 tokenHash, RBAC, Session)      │
│  • Live Signal Ingestion (arXiv, GitHub, Hugging Face, Web metadata)    │
│  • Audit Logging (AuditLog)                                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           Prisma 7 Dual-Engine ORM (src/lib/prisma.ts)                  │
│  • Local Development / Tests: @prisma/adapter-better-sqlite3 (SQLite)   │
│  • Production Deployment:     @prisma/adapter-pg (PostgreSQL)           │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Relational & Document Data Model (Prisma Schema)

### Identity, Admission & Security Governance
- `User`: `id`, `email @unique`, `emailVerified`, `name`, `firstName`, `lastName`, `username @unique`, `image`, `role` (`"Admin" | "Editor" | "Member"`), `status` (`"active" | "revoked"`), `planTier` (`"FREE" | "TRIAL" | "PRO" | "TEAM"`), `trialEndsAt`, `sessionVersion`, `jobRole`, `organizationName`, `stackDescription`, `followedTopicsJson`, `followedSubtopicsJson`, `followedCompaniesJson`, `preferredTypesJson`, `newsletterOptIn`, `newsletterEmail`, `integrationsJson`, `dayStreak`, `articlesReadCount`, `inviteCode @unique`, `createdAt`, `updatedAt`.
- `Account`: NextAuth OAuth account linkage (`provider`, `providerAccountId`).
- `Session`: NextAuth database sessions (`sessionToken @unique`, `userId`, `expires`).
- `VerificationToken`: NextAuth verification tokens.
- `PasswordCredential`: Scrypt password hash (`userId @unique`, `passwordHash`, `passwordChangedAt`, `resetTokenHash @unique`, `resetExpiresAt`).
- `AccountInvitation`: Single-use expiring invitation (`id`, `email`, `normalizedEmail`, `activeForEmail @unique`, `tokenHash @unique`, `status` [`PENDING` | `ACCEPTED` | `REVOKED` | `EXPIRED`], `role`, `planTier`, `invitedById`, `acceptedById`, `expiresAt`, `acceptedAt`, `revokedAt`, `createdAt`, `updatedAt`).
- `AccountEmailOutbox`: Outbox records associated with account invitations.
- `AuditLog`: Immutable security and operational audit trail (`id`, `actorId`, `actorEmail`, `action`, `targetType`, `targetId`, `ipAddress`, `userAgent`, `metadataJson`, `createdAt`).
- `RequestLimit`: Database-backed rate limiter (`key @id`, `count`, `resetsAt`).

### Intelligence Taxonomy, Companies, Signals & User Activity
- `Topic`: Canonical AI topic (`id`, `slug @unique`, `name`, `description`, `subtopicsJson`, `displayOrder`, `createdAt`, `updatedAt`).
- `Company`: AI research lab or product on the leaderboard (`id`, `slug @unique`, `name`, `handle`, `description`, `logoText`, `logoColor`, `websiteUrl`, `twitterUrl`, `githubUrl`, `focusAreasJson`, `likesCount`, `isVerified`, `monthlyActivityJson`, `createdAt`, `updatedAt`).
- `Signal`: Published news item, research paper, model release, repository, or editorial (`id`, `slug @unique`, `title`, `summary`, `bodyMarkdown`, `takeawaysJson`, `type` [`NEWS` | `PAPER` | `MODEL` | `REPO` | `EDITORIAL`], `editorialCategory` [`DEEP_DIVE` | `TUTORIAL` | `OPINION` | null], `authorName`, `readTimeMinutes`, `imageUrl`, `sourceUrl`, `sourcesJson`, `metadataTableJson`, `topicSlugsJson`, `subtopicSlugsJson`, `companyId`, `isPro`, `upvotesCount`, `helpfulUpCount`, `helpfulDownCount`, `publishedAt`, `createdById`, `createdAt`, `updatedAt`).
- `SignalUpvote`: User upvote on a signal (`id`, `userId`, `signalId`, `createdAt`, `@@unique([userId, signalId])`).
- `BookmarkList`: User bookmark collection (`id`, `userId`, `name`, `slug`, `isDefault`, `createdAt`, `@@unique([userId, slug])`).
- `Bookmark`: Saved signal in a user's bookmark list (`id`, `userId`, `signalId`, `listId`, `createdAt`, `@@unique([userId, signalId, listId])`).
- `CustomFeed`: User-configured custom feed tab (`id`, `userId`, `name`, `typesJson`, `topicsJson`, `subtopicsJson`, `companiesJson`, `createdAt`, `updatedAt`).
- `SignalComment`: User comment on a signal (`id`, `signalId`, `userId`, `authorName`, `body`, `createdAt`, `updatedAt`).
- `ArchiveIssue`: Daily/weekly newsletter edition in `/archive` (`id`, `slug @unique`, `title`, `summary`, `bodyMarkdown`, `issueNumber`, `publishedDate`, `year`, `month`, `dayOfWeek`, `createdAt`).
- `Notification`: User notification (`id`, `userId`, `type`, `title`, `body`, `actionUrl`, `isRead`, `createdAt`).
- `PartnerPerk`: Pro member partner perk (`id`, `slug @unique`, `title`, `partnerName`, `description`, `valueLabel`, `claimUrl`, `couponCode`, `isActive`, `displayOrder`, `createdAt`).
- `NewsletterSubscription`: Newsletter email subscription (`id`, `email @unique`, `userId`, `frequency`, `status`, `createdAt`, `updatedAt`).
