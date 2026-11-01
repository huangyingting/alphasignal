# AlphaSignal Exploration Coverage & Reverse-Engineering Report

## 1. Executive Summary
Using Playwright (`scripts/explore.mjs`, `scripts/scenarios.mjs`, `scripts/deep-inspect.mjs`) and authenticated session cookies from `.cred`, we systematically explored `https://alphasignal.ai/` across anonymous and authenticated sessions on desktop (`1440×1000`), tablet (`768×1024`), and mobile (`390×844`) viewports. All screenshots and structured DOM/network telemetry are archived locally under `artifacts/reference/`.

## 2. Route & View Inventory

| # | Route / State | Viewport | Screenshot Artifact | Observed Behavior & Key Controls |
|---|---|---|---|---|
| 01 | `/` (Anonymous Home) | `1440×1000` | `01-home-anonymous-desktop.png` | Displays "Today in AI", `SIGN IN` / `SIGN UP` header CTAs, `LATEST` / `UPVOTES` feed tabs, `LAST 24 HOURS` date selector, left `TYPE` & `TOPICS` filter rail, "Upgrade to Pro to upvote/bookmark" tooltips on pro-gated actions, inline newsletter subscribe bar. |
| 02 | `/` (Authenticated Home) | `1440×1000` | `02-home-cookie-desktop.png` | Displays "Last week in AI" (`166 RESULTS`), `TRIAL · 14 DAYS LEFT` badge, `FOR YOU` / `LATEST` / `UPVOTES` / `ADD +` (`Create a new feed`) tabs, `LAST WEEK` dropdown, `List view` / `Grid view` toggles, active `Upvote` and `Bookmark` actions on every signal row. |
| 03 | `/` (Authenticated Mobile) | `390×844` | `03-home-cookie-mobile.png` | Responsive single-column feed, compact top bar with `Open menu` hamburger and `Filters` drawer trigger; zero horizontal overflow (`overflow: false`). |
| 04 | `/` (Sign-In Modal) | `1440×1000` | `04-anonymous-sign-in.png` | Modal dialog with email/password & OAuth sign-in / sign-up entry points. |
| 05 | `/editorial` | `1440×1000` | `05-editorial.png` | Category filter bar (`ALL`, `DEEP DIVE`, `TUTORIAL`, `OPINION`), magazine bento layout (left 2-stack, center large featured story card, right 2-stack, 4-column secondary grid), and chronological editorial index below. |
| 06 | `/topics` | `1440×1000` | `06-topics.png` | "Explore topics" serif header, `Search topics and subtopics` input, and 21 topic cards rendered in a 3-column grid with monospace subtopic trees (`├──`, `└──`) and subtopic counts. |
| 07 | `/company/leaderboard` | `1440×1000` | `07-company-leaderboard.png` | Left topic filter rail (`ALL`, `AGENTS`, `API`, ...) and ranked table (`RANK`, `COMPANY`, `LIKES`) across 157 AI labs and products (`#1 OpenAI`, `#2 Claude`, `#3 Anthropic`, etc.) with `GET LISTED` CTA. |
| 08 | `/topic/agents` | `1440×1000` | `08-topic-agents.png` | Topic header (`Agents`), `FOLLOW` button, left sidebar (`TYPE`: All, News, Papers, Models, Repos, Deep Dive, Editorial; `SUBTOPICS`: `TOOL_USE`, `AGENT_FRAMEWORKS`, `COMPUTER_USE`, `MULTI_AGENT`, `CODE_AGENTS`, `MEMORY`, `GUARDRAILS`, `MCP`, `DEEP_RESEARCH`), and filtered signal stream. |
| 09 | `/company/openai` | `1440×1000` | `09-company-openai.png` | Company profile header (`OPENAI`, `FOLLOW` button), technical description, 12-month activity chart (`LAST 12 MONTHS · 2026`), `FOCUS AREAS` topic pills, external `LINKS` (`WEBSITE`, `X`), content type filter tabs (`ALL`, `NEWS`, `MODELS`, `REPOS`), and chronological company signals. |
| 10 | `/news/[slug]` | `1440×1000` | `10-news-openai-s-gpt-6-1-terra-cuts-agent-costs-50-and-runs-3x-faster.png` | Centered editorial layout: serif `H1`, deck, company & relative timestamp, upvote/bookmark/share bar, hero media, structured metadata table (`AUTHOR`, `READ`, `TYPE`, `TOPIC`, `SUBTOPIC`), collapsible `TAKEAWAYS` card, structured sections with tables/lists, floating right action rail, `5 sources` badge, `Comments` composer + thread, and `Next Reads`. |
| 11 | `/bookmarks` | `1440×1000` | `11-bookmarks.png` | Left sidebar `Lists` (`All`, `READING LIST`, `+ New list`), top tabs (`BOOKMARKS`, `UPVOTES`), and saved signal feed. |
| 12 | `/notifications` | `1440×1000` | `12-notifications.png` | Notification center displaying activity from followed topics/companies and clean empty state ("No notifications here — New activity from the topics and people you follow will show up here."). |
| 13 | `/settings` | `1440×1000` | `13-settings.png` | 4 top tabs (`GENERAL`, `PERSONALIZATION`, `SUBSCRIPTION`, `PERKS`) plus sub-panels (`Profile`, `Invitations`, `Integrations`, `Newsletter`, `Role`, `Data & account`). |
| 14 | `/archive` | `1440×1000` | `14-archive.png` | Newsletter archive (`632 ISSUES TOTAL`) with year selector (`2026`), month selector (`October`), `Search this month...` filter, and dated daily edition rows (`Oct 30 Fri`, title with emojis, summary line). |
| 15 | `/about` | `1440×1000` | `15-about.png` | Long-form editorial essay ("About AlphaSignal — It is compounding", "The intelligence layer", "The foundation") with arXiv/Hugging Face/GitHub scale callouts. |
| 16 | `/editorial-team` | `1440×1000` | `16-editorial-team.png` | Newsroom standards numbered `01`–`05` (`Editorial responsibility`, `How we source stories`, `Editorial independence`, `Corrections policy`, `Editorial contact`). |
| 17 | `/terms` | `1440×1000` | `17-terms.png` | Full Terms and Conditions legal document. |
| 18 | `/privacy` | `1440×1000` | `18-privacy.png` | Full Privacy Policy document. |
| 19 | `/newsletter` | `1440×1000` | `19-newsletter.png` | Newsletter landing and subscription management experience. |
| 21 | `Search (Control-K)` | `1440×1000` | `21-search-open.png`, `31-search-results.png`, `32-search-empty.png` | Command-palette modal (`Search companies, topics, and articles…`) with instant grouped results (`COMPANIES`, `TOPICS`, `ARTICLES`), keyboard navigation hints (`SELECT ↑↓`, `OPEN ↵`, `CLOSE ESC`, `VIEW ALL RESULTS SHIFT ↵`), and empty state handling. |
| 22 | `Create a new feed` | `1440×1000` | `22-custom-feed-dialog.png` | Custom feed builder modal (`FEED NAME`, `TYPE` toggles for `NEWS`, `PAPERS`, `MODELS`, `REPOS`, `TOPICS`, `SUBTOPICS`, `COMPANIES`, `CANCEL`, `CREATE FEED`). |
| 23 | `/` (Grid View) | `1440×1000` | `23-grid-layout.png` | 3-column bordered card layout with 16:9 thumbnail, company icon + name, title, footer metadata cells (`TOPIC | TIME AGO | BOOKMARK`), and upvote bar (`△ 37,118`). |
| 24 | `/` (Date Filter) | `1440×1000` | `24-date-filter.png` | Date window selector (`LAST 24 HOURS`, `LAST WEEK`, `LAST MONTH`, `ALL TIME`) updating heading and query scope. |
| 25 | `/pricing` | `1440×1000` | `25-membership.png` | Membership comparison (`MONTHLY` / `YEARLY` toggle, `Free`, `Pro`, `Team` cards, feature comparison matrix across `Features` and `Content` coverage). |
| 26–28 | Responsive Tablet & Mobile | `768×1024`, `390×844` | `26-tablet.png`, `27-mobile-filters.png`, `28-mobile-menu.png` | Tablet layout adaptation, mobile slide-over `Filters` drawer (`All`, `News`, `Papers`, `Models`, `Repos`, `Editorial` + Topics + `Clear`/`Apply`), and mobile navigation drawer. |
| 29 | `/news/this-route-does-not-exist` | `1440×1000` | `29-not-found.png` | Custom 404 state: `"The signal dropped."` with return-to-feed navigation. |
| 30–42 | Interactive Scenarios & Subroutes | `1440×1000` | `30-cookie-preferences.png` – `42-author-profile.png` | Cookie preferences dialog (`30-cookie-preferences.png`), search with query & no-results, bookmark list selector (`+ Create new list`), all 4 Settings tabs (`GENERAL`, `PERSONALIZATION`, `SUBSCRIPTION`, `PERKS`) and 4 General subsections (`Integrations`, `Newsletter`, `Role`, `Data & account`), subtopic feed (`/topic/agents/tool-use`), archive search filtering, standalone email edition (`/email/89e027cec16a8a64`, `41-email-issue.png`), and author profile (`/author/bendee983`, `42-author-profile.png`). |

## 3. Extracted Design System Tokens

- **Color Palette**:
  - Canvas Background: `#030303` (`rgb(3, 3, 3)`)
  - Elevated Surface / Card / Modal: `#0a0a0a`, `#111111`, `#161616`
  - Sticky Header Surface: `rgba(3, 3, 3, 0.78)` with `backdrop-filter: blur(12px)`
  - Hairline Borders: `#222222` (`rgb(34, 34, 34)`) primary grid border, `#2e2e2e` hover/active border
  - Primary Text: `#ededed` (`rgb(237, 237, 237)`)
  - Secondary Body Text: `#c5c5c5` (`rgb(197, 197, 197)`)
  - Muted Metadata Text: `#737373` / `#8a8a8a`
  - Accent / Highlight: Crisp white (`#ffffff`) for primary CTAs and active tabs, emerald/amber status pills (`#10b981` / `#f59e0b`) for `PRO` / `TRIAL` indicators, and subtle red (`#ef4444`) for destructive actions.
- **Typography**:
  - **Display Serif (`--font-serif`)**: `Playfair Display` (`400`, `40px/44px` on desktop `h1`, tight editorial tracking)
  - **UI & Article Sans (`--font-sans`)**: `Inter` / `Funnel Sans` (`400` body, `500` `18px/23.4px` feed item titles)
  - **Technical Monospace (`--font-mono`)**: `JetBrains Mono` (`11px`–`12px` uppercase tracking `0.08em` for navigation items, topic badges, counts, ASCII tree connectors `├──`/`└──`, and keyboard shortcuts).
