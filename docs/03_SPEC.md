# Technical Specification — AlphaSignal

## 1. Route Architecture

### Public & Reader Routes
- `GET /` — Home intelligence feed (`FOR YOU`, `LATEST`, `UPVOTES`, Custom Feeds, Type/Topic/Date filters, List/Grid views)
- `GET /news/[slug]` — Signal / Article detail view, takeaways, metadata table, comments, next reads
- `GET /editorial` — Long-form AI Editorial hub (`ALL`, `DEEP DIVE`, `TUTORIAL`, `OPINION`)
- `GET /topics` — 21-topic & subtopic tree explorer with live client filter
- `GET /topic/[slug]` — Topic feed with subtopic & type filters and Follow button
- `GET /topic/[slug]/[subtopic]` — Subtopic feed with type filters and Follow button
- `GET /company/leaderboard` — Ranked AI companies & products leaderboard filterable by topic
- `GET /company/[slug]` — Company profile, 12-month activity chart, focus areas, and signal feed
- `GET /archive` — Newsletter issue archive filterable by year, month, and search query
- `GET /pricing` — Free, Pro, and Team membership comparison with Monthly/Yearly toggle
- `GET /newsletter` — Daily AI Newsletter landing & subscription management
- `GET /about` — About AlphaSignal essay & platform metrics
- `GET /editorial-team` — AlphaSignal Newsroom & 01–05 Editorial Standards
- `GET /terms` — Terms and Conditions
- `GET /privacy` — Privacy Policy

### Authenticated User & Governance Routes
- `GET /bookmarks` — Saved bookmarks organized by custom lists + upvoted signals tab
- `GET /notifications` — Personal notification feed
- `GET /settings` — 4-tab settings console (`GENERAL`, `PERSONALIZATION`, `SUBSCRIPTION`, `PERKS`)
- `GET /login` — Sign-in page (also accessible via header `SIGN IN` modal)
- `GET /invite/[token]` — One-time invitation inspection & account registration page
- `GET /admin/invitations` — Admin governance console (Invitations, Users & Role/Session Revocation, Audit Log)
- `GET /studio` — Editorial & Signal Publishing Studio (`Admin` and `Editor` roles)

---

## 2. REST API Specification

### Authentication & Invite-Only Admission
- `POST /api/auth/password/login` — Authenticate with `email` and `password`, create database `Session`, set session cookie, write `AuditLog`.
- `POST /api/auth/logout` — Delete current database `Session` and clear session cookie.
- `POST /api/auth/invitation` & `GET /api/auth/invitation?token=...` — Inspect an invitation token (`pending`, `accepted`, `revoked`, `expired`, `invalid`) without mutating valid pending tokens.
- `POST /api/auth/register` — Consume a valid `PENDING` `AccountInvitation` token, create `User` (with invited `role` and `planTier`) + `PasswordCredential` + `Session` atomically, write `AuditLog`.
- `GET /api/auth/[...nextauth]` & `POST /api/auth/[...nextauth]` — NextAuth handler with `PrismaAdapter` and `authorizeSocialSignIn`.
- `GET /api/me` — Return current authenticated user profile, personalization preferences, custom feeds, bookmark lists, and unread notification count.

### Admin Governance & Audit Log (`Admin` Role Required)
- `GET /api/admin/invitations` — List all invitations, users, and recent audit logs.
- `POST /api/admin/invitations` — Create a single-use expiring `AccountInvitation` (`email`, `role`, `planTier`, `expiresAt`), return one-time `acceptUrl`, write `AuditLog`.
- `POST /api/admin/invitations/[id]/rotate` — Rotate token hash and expiration for a `PENDING` invitation, return new `acceptUrl`, write `AuditLog`.
- `DELETE /api/admin/invitations/[id]` — Revoke a `PENDING` invitation, clear `tokenHash` and `activeForEmail`, write `AuditLog`.
- `PATCH /api/admin/users/[id]` — Update a user's `role`, `status` (`active` / `revoked`), or `planTier`; when `status === "revoked"`, immediately delete all active `Session` rows for that user and increment `sessionVersion`; write `AuditLog`.
- `GET /api/admin/audit-logs` — Query `AuditLog` entries with filtering by action or actor.

### Signals, Search, Topics, Companies & Archive
- `GET /api/signals` — Query signals with filters: `tab` (`for-you`, `latest`, `upvotes`, or `feed:<id>`), `types[]`, `topics[]`, `subtopics[]`, `companySlug`, `editorialCategory`, `period` (`24h`, `7d`, `30d`, `all`), `q`, `limit`, `offset`.
- `POST /api/signals` — (`Admin`/`Editor`) Publish or update a signal (`title`, `slug`, `summary`, `bodyMarkdown`, `takeaways[]`, `type`, `editorialCategory`, `companyId`, `topicSlugs[]`, `subtopicSlugs[]`, `sourceUrl`, `sources[]`, `metadataTable[]`, `readTimeMinutes`, `isPro`, `publishedAt`).
- `POST /api/signals/ingest` — (`Admin`/`Editor`) Live-fetch and parse metadata from a real URL (arXiv paper URL, GitHub repo URL, Hugging Face model URL, or article URL) into a structured signal record.
- `POST /api/signals/[id]/upvote` — Toggle authenticated user upvote on a signal and update `upvotesCount` + company total likes atomically.
- `POST /api/signals/[id]/bookmark` — Toggle or assign a signal bookmark to a user's `BookmarkList`.
- `POST /api/signals/[id]/comments` — Post a comment on a signal (`body`).
- `POST /api/signals/[id]/feedback` — Record article helpfulness reaction (`up` / `down`).
- `GET /api/search?q=...` — Instant search across `Company`, `Topic`/`Subtopic`, and `Signal`.
- `GET /api/topics` & `POST /api/topics/[slug]/follow` — List topic taxonomy and toggle topic/subtopic follow status.
- `GET /api/companies` & `POST /api/companies` & `POST /api/companies/[slug]/follow` — List leaderboard companies, submit/create a company (`Admin`/`Editor` or `Get Listed` submission), and toggle company follow.
- `GET /api/archive` & `POST /api/archive` — List and publish newsletter archive issues (`ArchiveIssue`).

### Personalization, Custom Feeds, Bookmarks, Settings & Notifications
- `GET /api/feeds` & `POST /api/feeds` & `DELETE /api/feeds/[id]` — Create and delete custom user feeds (`CustomFeed`).
- `GET /api/bookmarks` & `POST /api/bookmarks/lists` & `DELETE /api/bookmarks/lists/[id]` — Manage bookmark lists and saved signals.
- `PATCH /api/settings/profile` — Update user profile (`firstName`, `lastName`, `username`, `jobRole`, `organizationName`, `newsletterOptIn`, `newsletterEmail`, `integrationsJson`, `planTier`).
- `POST /api/settings/personalization` — Update followed topics, subtopics, companies, content types, or run stack description matching (`stackDescription` -> matched topics/subtopics/companies).
- `POST /api/settings/invitations` — Member referral invitation creation (validated and logged).
- `GET /api/settings/export` — Export complete user profile, preferences, bookmarks, upvotes, and comments as JSON.
- `DELETE /api/settings/account` — Delete the current user's account and revoke all sessions.
- `GET /api/notifications` & `POST /api/notifications/read` — List notifications and mark as read.
