# Product Requirements Document (PRD) — AlphaSignal

## 1. Product Vision & Scope
AlphaSignal ("The Front Page of AI") is a real-time technical intelligence platform for AI engineers, researchers, and technical leaders. It tracks, organizes, ranks, and personalizes AI news, research papers, model releases, open-source repositories, and original engineering editorials across a structured taxonomy of 21 core topics and 80+ subtopics, paired with a ranked AI company leaderboard, newsletter archive, user bookmarks/upvotes, and invite-only account governance.

## 2. User Roles & Personas
1. **Anonymous Visitor**:
   - Can browse the public intelligence feed (`/`), editorial deep dives (`/editorial`), topic taxonomy (`/topics`, `/topic/[slug]`, `/topic/[slug]/[subtopic]`), company leaderboard (`/company/leaderboard`, `/company/[slug]`), article detail pages (`/news/[slug]`), newsletter archive (`/archive`), pricing (`/pricing`), and static pages (`/about`, `/editorial-team`, `/terms`, `/privacy`, `/newsletter`).
   - Can filter by content type, topic, subtopic, date window, sort order (`LATEST`, `UPVOTES`), and toggle `List view` vs `Grid view`.
   - Can search across companies, topics, and signals via `Ctrl+K` / `Cmd+K`.
   - Prompted to sign in or upgrade when attempting authenticated actions (upvoting, bookmarking, custom feeds, comments, settings).
2. **Authenticated Member (`Member`)**:
   - Admitted exclusively via a valid single-use, non-expired `AccountInvitation`.
   - Can upvote signals, save signals into multiple custom Bookmark Lists (`READING LIST`, custom lists), create and switch between Custom Feeds (`ADD +`), post comments on articles, follow topics/subtopics/companies, configure stack personalization (`DESCRIBE YOUR STACK` auto-matching), manage profile/newsletter/role/integrations, export account data, and send colleague invitations.
3. **Editorial Author (`Editor`)**:
   - All `Member` capabilities plus access to the **Newsroom Studio (`/studio`)** to author, edit, and publish signals (`NEWS`, `PAPER`, `MODEL`, `REPO`, `EDITORIAL`), ingest live signals from external URLs / arXiv / Hugging Face / GitHub, curate `ArchiveIssue` newsletter editions, and manage company profiles & partner perks.
4. **Platform Administrator (`Admin`)**:
   - Provisioned initially via the host CLI (`npm run bootstrap:admin`).
   - All `Editor` capabilities plus full access to the **Admin Governance Console (`/admin/invitations`)** to issue single-use expiring invitations with role assignment (`Admin`, `Editor`, `Member`), rotate tokens, revoke pending invitations, change user roles, revoke active user sessions, and inspect the immutable `AuditLog`.

## 3. Functional Requirements

### FR-1: Home Intelligence Feed (`/`)
- Dynamic period header (`Today in AI`, `Last week in AI`, `Last month in AI`, `All time in AI`) with live result count (`N RESULTS`).
- Left filter rail (`TYPE`: `ALL`, `NEWS`, `PAPERS`, `MODELS`, `REPOS`, `EDITORIAL`; `TOPICS`: 21 topics with counts and expandable subtopics; `Clear` and `Apply` controls).
- Feed tabs: `FOR YOU` (personalized by followed topics, subtopics, companies, and content types), `LATEST`, `UPVOTES`, plus user-defined Custom Feeds and `ADD +` (`Create a new feed` modal).
- View modes: `List view` (upvote counter on left, headline + company/topic/time/pro metadata in center, thumbnail on right) and `Grid view` (3-column bordered cards).

### FR-2: Signal / Article Detail (`/news/[slug]`)
- Editorial serif headline, deck, company badge, relative timestamp, upvote button, bookmark button (with list picker popover), and share/copy-link button.
- Structured metadata table (`AUTHOR`, `READ`, `TYPE`, `TOPIC`, `SUBTOPIC`, `SOURCE`).
- Collapsible `TAKEAWAYS` summary card.
- Rich markdown/structured body rendering (section headings, tables, bullet lists, code/model badges), sources drawer/count, helpfulness feedback (thumbs up/down), threaded `Comments`, and `Next Reads` recommendations.

### FR-3: AI Editorial Hub (`/editorial`)
- Sub-navigation filters: `ALL`, `DEEP DIVE`, `TUTORIAL`, `OPINION`.
- Featured magazine grid + chronological editorial list.

### FR-4: Topics Directory & Topic/Subtopic Feeds (`/topics`, `/topic/[slug]`, `/topic/[slug]/[subtopic]`)
- `/topics`: Interactive search input (`Search topics and subtopics`) and 3-column grid of topic cards with ASCII tree (`├──`, `└──`) links to every subtopic.
- `/topic/[slug]` & `/topic/[slug]/[subtopic]`: Topic/subtopic header, `FOLLOW` toggle, type & subtopic sidebar filters, and scoped signal feed.

### FR-5: Company Leaderboard & Company Profiles (`/company/leaderboard`, `/company/[slug]`)
- `/company/leaderboard`: Topic filter sidebar, total company count, `GET LISTED` workflow modal, and ranked leaderboard table (`RANK`, `COMPANY`, `LIKES` / aggregated upvotes + company likes).
- `/company/[slug]`: Company bio, `FOLLOW` toggle (which also increments company likes/followers), 12-month signal activity bar chart (`J F M A M J J A S O N D`), focus area topic pills, website/social links, type filter tabs (`ALL`, `NEWS`, `PAPERS`, `MODELS`, `REPOS`), and company signal list.

### FR-6: Global Command Palette Search (`Ctrl+K` / `/api/search`)
- Instant keyboard-accessible modal (`Ctrl+K` / `Cmd+K`) searching companies, topics/subtopics, and signals with highlighted matches, keyboard arrow navigation, and empty-state feedback.

### FR-7: Bookmarks, Lists & Upvotes (`/bookmarks`)
- Multiple user-created bookmark lists (`All`, `READING LIST`, `+ New list`), tab switch between `BOOKMARKS` and `UPVOTES`, and instant removal/list assignment.

### FR-8: Notifications (`/notifications`)
- Activity feed of notifications (new signals in followed topics/companies, comment replies, system/invitation events) with `Mark all as read` and unread badge count.

### FR-9: User Settings (`/settings`)
- `GENERAL`: Profile editor (first name, last name, username, email, plan badge, day streak, articles read), colleague invitations (`SEND` & personal invite link), `Integrations` (GitHub, X), `Newsletter` subscription preferences, `Role` (job title & organization), and `Data & account` (JSON export & account deletion).
- `PERSONALIZATION`: Stack description analyzer (`DESCRIBE YOUR STACK` -> `SYNC` auto-matches topics/subtopics/companies), followed companies search/toggle, followed topics/subtopics chips, and preferred content types (`NEWS`, `PAPERS`, `MODELS`, `REPOS`).
- `SUBSCRIPTION`: Plan status (`Free`, `Trial`, `Pro`, `Team`), `Get Pro for $0 out of pocket` expense reimbursement email generator, and plan upgrade flow.
- `PERKS`: Pro partner credits directory with claim/view details.

### FR-10: Archive, Newsletter, Pricing & Newsroom Pages
- `/archive`: Filterable by year, month, and keyword search (`Search this month...`) with issue detail view.
- `/newsletter`, `/pricing`, `/about`, `/editorial-team`, `/terms`, `/privacy`: Full content and interactive controls matching the original site.

### FR-11: Invite-Only Admission, RBAC, Revocation & Audit Logging
- CLI-only root admin bootstrap (`npm run bootstrap:admin`).
- Single-use expiring invitations (`AccountInvitation`) with SHA-256 `tokenHash`, role assignment, token rotation, revocation, user session revocation, and `AuditLog` tracking.
