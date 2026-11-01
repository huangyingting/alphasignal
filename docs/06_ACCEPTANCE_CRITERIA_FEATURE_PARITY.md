# Acceptance Criteria & Feature-Parity Matrix — AlphaSignal

## 1. Acceptance Criteria

### AC-1: Zero Dummy Data & Clean Installation Contract
- **Given** a freshly migrated database (`npm run db:setup`),
- **When** the application starts before any operator or user action,
- **Then** there are `0` users, `0` sessions, `0` fake signals, and `0` demo accounts in the database; canonical topic taxonomy is available structurally, and all empty states render cleanly with actionable guidance.

### AC-2: Invite-Only Registration, Roles, Rotation, Revocation & Audit Logging
- **Given** `ACCOUNT_ADMISSION_MODE=invitation-only` (default fail-closed),
- **When** an uninvited visitor attempts `POST /api/auth/register` without a valid token or signs in with an uninvited OAuth account,
- **Then** the request is rejected (`400`/`403`/`410`) and no `User` is created.
- **When** a CLI-bootstrapped `Admin` (`npm run bootstrap:admin`) creates an invitation at `POST /api/admin/invitations` with a specified role (`Admin`, `Editor`, `Member`) and expiry,
- **Then** a single-use token is generated, only its SHA-256 `tokenHash` is stored, and an `AuditLog` entry (`account.invitation.create`) is recorded.
- **When** the invitation is accepted once at `/invite/[token]` (`POST /api/auth/register`),
- **Then** the user account is created with the assigned role, a database session cookie is issued, the invitation transitions to `ACCEPTED` with `tokenHash = null`, and any second attempt with the same token returns `410 Gone`.
- **When** an `Admin` rotates or revokes a `PENDING` invitation, or revokes a user's access (`PATCH /api/admin/users/[id]`),
- **Then** previous invitation links or user sessions are immediately invalidated and an `AuditLog` entry is persisted.

### AC-3: Core Intelligence Workflows (Signals, Feeds, Upvotes, Bookmarks, Comments)
- **Given** an authenticated `Admin` or `Editor`,
- **When** they publish a signal (`NEWS`, `PAPER`, `MODEL`, `REPO`, `EDITORIAL`) via `/studio` or `POST /api/signals` (or ingest a live URL via `POST /api/signals/ingest`),
- **Then** the signal immediately appears in `/`, `/news/[slug]`, `/editorial` (if editorial), `/topic/[slug]`, `/company/[slug]`, and `Ctrl+K` search results.
- **When** an authenticated user upvotes a signal, bookmarks it into a list (`READING LIST` or custom list), creates a custom feed (`Create a new feed`), or posts a comment on `/news/[slug]`,
- **Then** the state persists in the database and reflects across `/`, `/bookmarks`, and `/news/[slug]`.

### AC-4: Settings, Personalization & Responsive Layout Parity
- **Given** an authenticated user on `/settings`,
- **When** they switch across `GENERAL` (`Profile`, `Invitations`, `Integrations`, `Newsletter`, `Role`, `Data & account`), `PERSONALIZATION` (`DESCRIBE YOUR STACK` sync, followed companies/topics/subtopics, content types), `SUBSCRIPTION`, and `PERKS`,
- **Then** all changes persist to the database, stack sync automatically matches relevant topics/subtopics/companies, and `GET /api/settings/export` returns the user's complete JSON archive.
- **Given** desktop (`1440×1000`), tablet (`768×1024`), and mobile (`390×844`) viewports,
- **Then** all pages render with zero horizontal overflow (`scrollWidth <= innerWidth`) and mobile filter/menu drawers operate smoothly.

---

## 2. Feature-Parity Matrix (`https://alphasignal.ai/` vs Local Implementation)

| Feature Area | Original `alphasignal.ai` Behavior | Local Implementation | Parity Status |
|---|---|---|---|
| **Theme & Typography** | `#030303` obsidian canvas, `#222222` borders, Playfair Display serif headings, Funnel/Inter sans, JetBrains Mono badges & ASCII footer | Exact CSS tokens, Google Fonts (`Playfair Display`, `Inter`, `JetBrains Mono`), ASCII matrix footer wordmark | Full Parity |
| **Home Feed (`/`)** | `FOR YOU`, `LATEST`, `UPVOTES`, Custom Feeds (`ADD +`), Date filter (`24H`, `LAST WEEK`, `LAST MONTH`, `ALL TIME`), `List view` & `Grid view`, `TYPE` & 21 `TOPICS` sidebar | Full server + client filtering, custom feed persistence, list & 3-column grid views, responsive mobile filter drawer | Full Parity |
| **Signal Detail (`/news/[slug]`)** | Serif title, deck, company/time bar, metadata table (`AUTHOR`, `READ`, `TYPE`, `TOPIC`, `SUBTOPIC`), collapsible `TAKEAWAYS`, body tables/sections, sources, helpfulness thumbs, `Comments`, `Next Reads` | Complete article view with collapsible takeaways, metadata table, real persisted comments, upvote/bookmark/share rail, and Next Reads | Full Parity |
| **AI Editorial (`/editorial`)** | `ALL`, `DEEP DIVE`, `TUTORIAL`, `OPINION` tabs, bento magazine hero grid + chronological list | Complete filterable editorial hub with magazine layout and chronological feed | Full Parity |
| **Explore Topics (`/topics`, `/topic/*`)** | 21 topics with monospace ASCII subtopic trees (`├──`, `└──`), live search filter, topic & subtopic feeds with `FOLLOW` | Complete 21-topic taxonomy with 80+ subtopics, ASCII tree cards, search filter, and `/topic/[slug]` + `/topic/[slug]/[subtopic]` routes | Full Parity |
| **Company Leaderboard (`/company/leaderboard`, `/company/[slug]`)** | Ranked table (`RANK`, `COMPANY`, `LIKES`) filterable by topic, `GET LISTED` action, company profile with 12-month chart, focus areas, `FOLLOW` | Dynamic leaderboard ranked by likes + signal upvotes, topic filter, `GET LISTED` submission modal, and full `/company/[slug]` profile | Full Parity |
| **Global Search (`Ctrl+K`)** | Command palette searching companies, topics, and articles with keyboard navigation and empty state | Instant `Ctrl+K` / `Cmd+K` modal querying `/api/search` across companies, topics, and signals with keyboard navigation | Full Parity |
| **Bookmarks (`/bookmarks`)** | Custom bookmark lists (`All`, `READING LIST`, `+ New list`), `BOOKMARKS` & `UPVOTES` tabs | Full multi-list bookmark manager and upvoted signals view | Full Parity |
| **Notifications (`/notifications`)** | Activity notifications with unread indicator & empty state | Real database notifications with mark-as-read and clean empty state | Full Parity |
| **Settings (`/settings`)** | `GENERAL` (Profile, Invitations, Integrations, Newsletter, Role, Data & account), `PERSONALIZATION` (Stack sync, companies, topics, subtopics, content types), `SUBSCRIPTION` (Expense email generator), `PERKS` | All 4 tabs and all 6 General subsections fully interactive and persisted | Full Parity |
| **Archive (`/archive`)** | Year/Month selectors, `Search this month...` input, dated issue rows | Full archive browser filterable by year, month, and keyword, plus issue detail modal/view | Full Parity |
| **Pricing & Static (`/pricing`, `/newsletter`, `/about`, `/editorial-team`, `/terms`, `/privacy`, `404`)** | Monthly/Yearly plan comparison table, newsletter signup, essay, 01–05 standards, legal pages, `"The signal dropped."` 404 | All routes implemented with faithful content and interactive controls | Full Parity |
| **Auth, Invite-Only & RBAC (`../Arcade` reference)** | Sign-in modal, account invitations | Full NextAuth + `PasswordCredential` + single-use SHA-256 `AccountInvitation`, role assignment (`Admin`, `Editor`, `Member`), rotation, revocation, `AuditLog`, CLI `bootstrap:admin`, `/invite/[token]`, `/admin/invitations`, and `/studio` | Enhanced Production Parity |
