# AlphaSignal — AI Ecosystem Intelligence Platform

A production-ready full-stack AI intelligence platform built with **Next.js 16 (App Router)**, **Auth.js / NextAuth**, **Prisma 7** (SQLite for local development and PostgreSQL for production), and **Tailwind CSS**, replicating the capabilities, obsidian aesthetic (`#030303`), 21-domain taxonomy, and interactive workflows of `https://alphasignal.ai/` with strict **invite-only account admission**, **role-based access control**, **single-use/expiring invitation codes**, **revocation/rotation**, and **immutable audit logging**.

## Key Capabilities

- **Zero Dummy Data / Zero Demo Accounts**: Fresh database migrations initialize structural schemas with zero synthetic signals or demo accounts.
- **Invite-Only Account Admission (`src/lib/account-admission/`)**:
  - Single-use, expiring invitation tokens hashed at rest with SHA-256 (`tokenHash`).
  - Role-Based Access Control (`ADMIN`, `OPERATOR`, `MEMBER`, `VIEWER`).
  - Invitation rotation, revocation, account disablement with immediate JWT session invalidation (`sessionInvalidAfter`), and CLI-only initial administrator bootstrap (`npm run bootstrap:admin`).
  - Comprehensive security audit trail (`AuditLog`) capturing `ADMIN_BOOTSTRAPPED`, `INVITATION_ISSUED`, `INVITATION_ROTATED`, `INVITATION_REVOKED`, `INVITATION_ACCEPTED`, `LOGIN_SUCCEEDED`, `LOGIN_REJECTED`, `PASSWORD_CHANGED`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `USER_ROLE_UPDATED`, and `USER_STATUS_UPDATED`.
- **Live Upstream Signal Ingestion (`src/lib/ingest.ts`)**:
  - Real-time ingestion from GitHub API (`Top Repos`), arXiv API (`Top Papers`), and Hacker News Algolia API (`Top News` / `Top Posts`), plus authenticated signal publishing.
- **21-Domain AI Taxonomy (`src/lib/taxonomy.ts`)**:
  - All 21 canonical topics (`agents` through `video`) and 75 subtopics rendered with ASCII subtopic trees (`├──`, `└──`) and live signal counts.
- **Custom Feeds, Bookmarks, Threaded Discussions, and Email Archive**:
  - Custom Feed Builder with `INCLUDE` / `EXCLUDE` rules across `TOPIC`, `SUBTOPIC`, `COMPANY`, `KEYWORD`, and `SOURCE`.
  - Signal Detail Drawer with structured `What Happened`, `Why It Matters`, `Key Technical Insights`, upvotes, bookmarks, and nested comment replies.
  - Email Briefing Archive compiler and reader (`/archive`).

## Documentation Suite (`docs/`)

- [`docs/00_EXPLORATION_COVERAGE.md`](docs/00_EXPLORATION_COVERAGE.md) — Playwright exploration coverage, 40 captured screenshots, and extracted style tokens.
- [`docs/01_ADR.md`](docs/01_ADR.md) — Architecture Decision Records (`ADR-001` – `ADR-005`).
- [`docs/02_PRD.md`](docs/02_PRD.md) — Product Requirements Document.
- [`docs/03_SPEC.md`](docs/03_SPEC.md) — Technical & API Specification.
- [`docs/04_ARCHITECTURE_DATA_MODEL.md`](docs/04_ARCHITECTURE_DATA_MODEL.md) — System Architecture & Dual SQLite/PostgreSQL Data Model.
- [`docs/05_IMPLEMENTATION_PLAN_BACKLOG.md`](docs/05_IMPLEMENTATION_PLAN_BACKLOG.md) — Implementation Plan & Backlog.
- [`docs/06_ACCEPTANCE_CRITERIA_FEATURE_PARITY.md`](docs/06_ACCEPTANCE_CRITERIA_FEATURE_PARITY.md) — Acceptance Criteria & Feature Parity Matrix.

## Quick Start

### 1. Local Development (SQLite)

```bash
cp .env.example .env
npm install
npm run db:setup
printf '%s\n' 'YourStrongPassword123!' | npm run bootstrap:admin -- --email admin@yourdomain.com --name "Operator" --password-stdin
npm run dev
```

### 2. Production Deployment (PostgreSQL)

```bash
cp .env.production.example .env
# Set DATABASE_URL="postgresql://...", NEXTAUTH_SECRET, and NEXTAUTH_URL
npm run db:generate:postgres
npm run db:migrate:postgres
npm run build
npm start
```

### 3. Verification & Testing

```bash
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
```
