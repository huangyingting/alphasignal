# Implementation Plan & Task Backlog — AlphaSignal

## 1. Phased Implementation Plan

### Phase 1: Reverse Engineering & Specification (Completed)
- Explore `https://alphasignal.ai/` across anonymous, authenticated, desktop, tablet, and mobile viewports using Playwright.
- Capture 40 screenshot & JSON telemetry artifacts in `artifacts/reference/`.
- Produce ADR, PRD, Technical Specification, Architecture & Data Model, Implementation Plan, Acceptance Criteria, and Feature-Parity documents.

### Phase 2: Database Layer & Account Admission Foundation
- Set up Next.js 16 + React 19 + TypeScript + Tailwind CSS + Prisma 7 (`@prisma/adapter-better-sqlite3` and `@prisma/adapter-pg`).
- Define synchronized `prisma/schema.prisma` (SQLite) and `prisma/schema.postgres.prisma` (PostgreSQL) plus SQL migrations.
- Implement `src/lib/account-admission/*` (`errors`, `policy`, `tokens`, `passwords`, `session`, `invitations`, `registration`, `credentials`, `bootstrap`, `social`, `audit`) and `scripts/bootstrap-admin.ts`.

### Phase 3: Core Intelligence Backend & Live Ingestion API
- Implement canonical 21-topic taxonomy sync (`src/lib/taxonomy.ts`).
- Implement REST APIs for Signals (`/api/signals`, `/api/signals/ingest`, `/api/signals/[id]/upvote`, `/api/signals/[id]/bookmark`, `/api/signals/[id]/comments`, `/api/signals/[id]/feedback`), Topics (`/api/topics`, `/api/topics/[slug]/follow`), Companies (`/api/companies`, `/api/companies/[slug]/follow`), Custom Feeds (`/api/feeds`), Bookmarks (`/api/bookmarks`), Archive (`/api/archive`), Search (`/api/search`), Settings (`/api/settings/*`), Notifications (`/api/notifications`), and Admin Governance (`/api/admin/invitations`, `/api/admin/users/[id]`, `/api/admin/audit-logs`).

### Phase 4: Obsidian Terminal-Editorial UI & All Application Routes
- Implement global navigation header, `Ctrl+K` command palette search, cookie consent banner & preferences modal, sign-in modal, custom feed modal, and ASCII wordmark footer.
- Implement `/`, `/editorial`, `/topics`, `/topic/[slug]`, `/topic/[slug]/[subtopic]`, `/company/leaderboard`, `/company/[slug]`, `/news/[slug]`, `/bookmarks`, `/notifications`, `/settings`, `/archive`, `/pricing`, `/newsletter`, `/about`, `/editorial-team`, `/terms`, `/privacy`, `/login`, `/invite/[token]`, `/admin/invitations`, `/studio`, and custom `not-found.tsx` (`"The signal dropped."`).

### Phase 5: Automated Testing, Build & Verification
- Run `npm run typecheck`, `npm run lint`, and `npm run build`.
- Write and run comprehensive automated tests (`tests/admission.test.ts` and `tests/product.test.ts` with Playwright browser verification) against an isolated migrated SQLite database.

---

## 2. Prioritized Task Backlog

| ID | Priority | Category | Task Description | Status |
|---|---|---|---|---|
| `TB-01` | P0 | Exploration | Playwright exploration across all routes, viewports, and scenarios | Done |
| `TB-02` | P0 | Docs | Author ADR, PRD, Spec, Architecture/Data Model, Plan, Acceptance, Parity docs | In Progress |
| `TB-03` | P0 | Data | Dual SQLite & PostgreSQL Prisma schemas + initial migrations | Pending |
| `TB-04` | P0 | Auth | NextAuth + Invite-only admission, single-use tokens, roles, revocation, AuditLog, CLI bootstrap | Pending |
| `TB-05` | P0 | API | Signals, live URL/arXiv/GitHub/HF ingestion, upvotes, bookmarks, comments, custom feeds | Pending |
| `TB-06` | P0 | API | Topics tree, Company leaderboard, Archive issues, Global Search (`Ctrl+K`), Settings, Notifications | Pending |
| `TB-07` | P0 | UI | Global shell (Obsidian `#030303` theme, Header, `Ctrl+K` modal, Cookie dialog, ASCII Footer) | Pending |
| `TB-08` | P0 | UI | Home Feed (`FOR YOU`, `LATEST`, `UPVOTES`, Custom Feeds, List/Grid views, Sidebar/Mobile filters) | Pending |
| `TB-09` | P0 | UI | Signal Detail (`/news/[slug]`), Editorial (`/editorial`), Topics (`/topics`, `/topic/*`) | Pending |
| `TB-10` | P0 | UI | Leaderboard (`/company/leaderboard`, `/company/[slug]`), Archive (`/archive`), Pricing (`/pricing`) | Pending |
| `TB-11` | P0 | UI | Bookmarks (`/bookmarks`), Notifications (`/notifications`), 4-Tab Settings (`/settings`) | Pending |
| `TB-12` | P0 | UI | Invite Acceptance (`/invite/[token]`), Admin Governance (`/admin/invitations`), Signal Studio (`/studio`) | Pending |
| `TB-13` | P0 | QA | Unit, API, and Playwright E2E tests + production build verification | Pending |
