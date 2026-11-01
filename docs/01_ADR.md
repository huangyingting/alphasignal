# Architecture Decision Records (ADR) — AlphaSignal Platform

**Project**: AlphaSignal Production Web Application  
**Status**: Accepted  
**Date**: 2026-11-01  
**Reference Implementation**: `/home/azadmin/Arcade` & `/home/azadmin/Arcade/docs/NEXTAUTH_INVITE_ONLY_SPEC.md`

---

## ADR-001: Next.js App Router Full-Stack Architecture

### Context
AlphaSignal combines high-density, SEO/SSR-friendly technical intelligence pages (`/`, `/editorial`, `/topics`, `/topic/[slug]`, `/company/leaderboard`, `/company/[slug]`, `/news/[slug]`, `/archive`, `/pricing`, `/about`, `/editorial-team`, `/terms`, `/privacy`, `/newsletter`) with interactive authenticated workflows (custom feeds, personalized "For You" ranking, upvotes, multi-list bookmarks, comments, notifications, settings, live source ingestion/publishing studio, and invite-only account administration).

### Decision
We implement the application as a unified **Next.js App Router (TypeScript)** service with server-rendered routes, client interactive islands, and hardened JSON REST API handlers under `src/app/api/*`.

### Consequences
- Fast initial render for feed, article, topic, leaderboard, and archive routes.
- Shared TypeScript validation and authorization helpers between pages and API routes.

---

## ADR-002: Dual SQLite (Local Dev) & PostgreSQL (Production) Persistence via Prisma 7

### Context
The application must run out of the box locally using SQLite (`prisma/schema.prisma`) while supporting managed PostgreSQL (`prisma/schema.postgres.prisma`) in production without code changes.

### Decision
Following the `../Arcade` reference architecture:
1. Maintain synchronized Prisma schemas (`prisma/schema.prisma` for SQLite and `prisma/schema.postgres.prisma` for PostgreSQL) using portable scalar types (`String`, `Int`, `Boolean`, `DateTime`) and structured JSON text fields where needed.
2. In `src/lib/prisma.ts`, automatically select `@prisma/adapter-pg` when `DATABASE_URL` starts with `postgres://` or `postgresql://`, and `@prisma/adapter-better-sqlite3` when `DATABASE_URL` uses `file:`.
3. Provide migration directories and npm scripts for both SQLite (`npm run db:setup`, `npm run db:migrate`) and PostgreSQL (`npm run db:generate:postgres`, `npm run db:migrate:postgres`).

### Consequences
- Zero-dependency local development and deterministic isolated E2E testing on temporary SQLite files, with seamless PostgreSQL production deployment.

---

## ADR-003: Invite-Only Account Admission, NextAuth Database Sessions, RBAC & Audit Logging

### Context
Registration must be strictly invite-only with single-use, expiring invitation codes, role assignment (`Admin`, `Editor`, `Member`), invitation rotation and revocation, session invalidation, and comprehensive audit logging (`AuditLog`). In addition, there must be no public HTTP bootstrap endpoint and no dummy/demo user accounts.

### Decision
We adopt and extend the canonical `src/lib/account-admission/*` architecture from `../Arcade`:
1. **CLI-Only Admin Bootstrap (`npm run bootstrap:admin`)**: Only an operator with shell/database access can provision or promote the initial `Admin` user via `--email <email> --password-stdin`. No HTTP bootstrap endpoint exists.
2. **Hashed Single-Use Invitations (`AccountInvitation`)**:
   - Raw 32-byte `base64url` tokens are returned only once upon creation or rotation; only `tokenHash = sha256(token)` is persisted.
   - `activeForEmail @unique` guarantees at most one active `PENDING` invitation per normalized email.
   - Invitations carry a target `role` (`Admin`, `Editor`, `Member`) and `planTier` (`FREE`, `TRIAL`, `PRO`, `TEAM`) plus `expiresAt` (1–30 days).
   - Consuming, rotating, or revoking an invitation is atomic inside a Prisma transaction and clears `tokenHash` and `activeForEmail` when transitioning to `ACCEPTED`, `REVOKED`, or `EXPIRED`.
3. **Database Sessions Shared with NextAuth**:
   - Password login (`POST /api/auth/password/login`), invitation registration (`POST /api/auth/register`), and OAuth (`authorizeSocialSignIn`) create and validate real `Session` rows in the database (`next-auth.session-token` / `__Secure-next-auth.session-token`).
   - Revoking a user or changing a password deletes active `Session` rows and increments `sessionVersion`.
4. **Tamper-Evident Audit Logging (`AuditLog`)**:
   - Every security-sensitive and editorial action (admin bootstrap, invitation create/rotate/revoke/accept, login success/failure, role change, user suspension/deletion, signal publication/ingestion, custom feed mutation) writes a structured `AuditLog` record with `actorId`, `actorEmail`, `action`, `targetType`, `targetId`, `metadataJson`, and `createdAt`.

---

## ADR-004: Zero Dummy Data & Real Signal Publishing / Live Feed Ingestion

### Context
The project explicitly forbids dummy data or demo user accounts while requiring a production-ready application that replicates AlphaSignal's capabilities.

### Decision
1. **No Demo Users or Seeded Fake Accounts**: A fresh installation starts with zero users, zero sessions, and zero fake user activity.
2. **Canonical Taxonomy Definition**: The 21 AlphaSignal topic taxonomy definitions (`agents`, `api`, `audio`, `benchmarks`, `business`, `data`, `development`, `government`, `gpus`, `image`, `infra`, `llms`, `open_source`, `post_training`, `reasoning`, `retrieval`, `robotics`, `security`, `training_infra`, `vibe_coding`, `video`) and their subtopic trees are structural taxonomy metadata synchronized idempotently on demand or via taxonomy sync.
3. **Real Authoring & Live Ingestion Engine (`/studio` & `POST /api/signals/ingest`)**:
   - Authenticated `Admin` and `Editor` users have a full **Newsroom & Signal Studio (`/studio`)** to publish and edit signals (`NEWS`, `PAPER`, `MODEL`, `REPO`, `EDITORIAL`), manage companies on the leaderboard, publish daily/weekly `ArchiveIssue` editions, and manage partner `Perk` offers.
   - Furthermore, operators can trigger **real live ingestion** from public AI sources (e.g., arXiv API, Hugging Face Hub API, GitHub repositories API, or any live URL/RSS feed) without hardcoded fake placeholder mocks.

---

## ADR-005: Obsidian Terminal-Editorial Design System

### Context
AlphaSignal's visual identity is distinct: a `#030303` obsidian canvas, `#222222` 1px structural borders, `Playfair Display` editorial headings, `Inter`/`Funnel Sans` body typography, `JetBrains Mono` uppercase metadata tags and ASCII tree diagrams (`├──`, `└──`), and an ASCII-art matrix wordmark in the footer.

### Decision
We implement the exact color tokens, typographic scale, list/grid feed cards, `Ctrl+K` command palette, collapsible sidebar filters, and responsive mobile drawers in `src/app/globals.css` and shared layout components.
