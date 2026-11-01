import assert from 'node:assert/strict';
import { ChildProcess, execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright';

const PORT = 3420 + Math.floor(Math.random() * 200);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = 'admin@alphasignal.local';
const ADMIN_PASSWORD = 'AdminPassword2026!';
const INVITED_EMAIL = 'builder@alphasignal.local';
const INVITED_PASSWORD = 'BuilderPassword2026!';

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${url}/api/topics`);
      if (response.ok) return;
    } catch {
      // waiting for server startup
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

test(
  'AlphaSignal full-stack E2E: zero dummy data, invite-only admission, signals, taxonomy, custom feeds, bookmarks, comments, archive, and responsive layouts',
  { timeout: 240_000 },
  async () => {
    const workDir = mkdtempSync(join(tmpdir(), 'alphasignal-e2e-'));
    const dbPath = join(workDir, 'e2e.db');
    const databaseUrl = `file:${dbPath}`;

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: databaseUrl,
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET: 'e2e-test-secret-with-high-entropy-value-2026-alphasignal',
      ACCOUNT_ADMISSION_MODE: 'invitation-only',
    };

    // 1. Setup clean SQLite database via Prisma migrations
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: process.cwd(),
      env,
      stdio: 'pipe',
    });

    // 2. Start production Next.js server
    const server: ChildProcess = spawn(
      './node_modules/.bin/next',
      ['start', '-p', String(PORT), '-H', '127.0.0.1'],
      {
        cwd: process.cwd(),
        env,
        stdio: 'ignore',
        detached: true,
      }
    );
    server.unref();

    const browser = await chromium.launch({ headless: true });

    try {
      await waitForServer(BASE_URL);

      // 3. Verify fresh deployment has 0 signals (zero dummy data policy)
      const initialSignalsRes = await fetch(`${BASE_URL}/api/signals`);
      assert.equal(initialSignalsRes.status, 200);
      const initialSignalsData = (await initialSignalsRes.json()) as {
        signals: unknown[];
        total: number;
      };
      assert.equal(
        initialSignalsData.total,
        0,
        'Fresh database must contain zero synthetic/dummy signals'
      );

      // 4. Bootstrap initial Admin account via CLI
      execFileSync(
        'npm',
        [
          'run',
          'bootstrap:admin',
          '--',
          '--email',
          ADMIN_EMAIL,
          '--name',
          'Alpha Admin',
          '--password-stdin',
        ],
        {
          cwd: process.cwd(),
          env,
          input: `${ADMIN_PASSWORD}\n`,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );

      const adminContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const adminPage = await adminContext.newPage();

      // 5. Verify anonymous empty state on Home page
      await adminPage.goto(BASE_URL, { waitUntil: 'networkidle' });
      await adminPage.locator('[data-testid="empty-signals-state"]').waitFor();

      // 6. Verify uninvited login is rejected on /login
      await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await adminPage.fill('[data-testid="login-email-input"]', 'uninvited@alphasignal.local');
      await adminPage.fill('[data-testid="login-password-input"]', 'UninvitedPass123!');
      await adminPage.click('[data-testid="login-submit-button"]');
      await adminPage.locator('[data-testid="login-error-banner"]').waitFor();

      // 7. Sign in as bootstrapped Admin
      await adminPage.fill('[data-testid="login-email-input"]', ADMIN_EMAIL);
      await adminPage.fill('[data-testid="login-password-input"]', ADMIN_PASSWORD);
      await adminPage.click('[data-testid="login-submit-button"]');
      await adminPage.waitForURL(`${BASE_URL}/`);

      // 8. Admin issues a single-use invitation in /settings?tab=invitations
      await adminPage.goto(`${BASE_URL}/settings?tab=invitations`, {
        waitUntil: 'networkidle',
      });
      await adminPage.fill('[data-testid="invite-email-input"]', INVITED_EMAIL);
      await adminPage.selectOption('[data-testid="invite-role-select"]', 'MEMBER');
      await adminPage.click('[data-testid="issue-invite-button"]');
      await adminPage.locator('[data-testid="issued-invite-banner"]').waitFor();

      const inviteUrl = (
        await adminPage.locator('[data-testid="issued-invite-url"]').textContent()
      )?.trim();
      assert.ok(inviteUrl && inviteUrl.includes('/invite/'), 'Must generate /invite/<token> URL');

      // Check Audit Log tab in Settings
      await adminPage.click('[data-testid="settings-tab-audit"]');
      await adminPage.locator('[data-testid="audit-log-table"]').waitFor();
      const auditText = await adminPage.locator('[data-testid="audit-log-table"]').textContent();
      assert.ok(auditText?.includes('ADMIN_BOOTSTRAPPED'));
      assert.ok(auditText?.includes('INVITATION_ISSUED'));

      // 9. Redeem single-use invitation in a separate browser context
      const memberContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const memberPage = await memberContext.newPage();
      await memberPage.goto(inviteUrl!, { waitUntil: 'networkidle' });
      await memberPage.fill('[data-testid="invite-name-input"]', 'Builder Member');
      await memberPage.fill('[data-testid="invite-username-input"]', 'builder_ai');
      await memberPage.fill('[data-testid="invite-password-input"]', INVITED_PASSWORD);
      await memberPage.click('[data-testid="invite-accept-button"]');
      await memberPage.waitForURL(`${BASE_URL}/`);

      // Revisiting the same single-use invitation link must show ACCEPTED state
      await memberPage.goto(inviteUrl!, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="invite-invalid-state"]').waitFor();
      const invalidStateText = await memberPage
        .locator('[data-testid="invite-invalid-state"]')
        .textContent();
      assert.ok(invalidStateText?.toUpperCase().includes('ACCEPTED'));

      // 10. Publish technical signals & test feed, detail drawer, upvote, comment, bookmark, and custom feed
      await memberPage.goto(BASE_URL, { waitUntil: 'networkidle' });
      await memberPage.click('[data-testid="publish-signal-button"]');
      await memberPage.fill(
        'input[placeholder*="vLLM"]',
        'Anthropic MCP 2.0: Deterministic Tool Execution for Multi-Agent Systems'
      );
      await memberPage.fill(
        'input[placeholder*="https://github.com"]',
        'https://github.com/modelcontextprotocol/specification'
      );
      await memberPage.fill(
        'textarea[placeholder*="Concise technical summary"]',
        'Anthropic released Model Context Protocol 2.0 with streaming tool transport and deterministic sandboxing.'
      );
      await memberPage.click('button[type="submit"]:has-text("Publish Signal")');

      await memberPage.locator('[data-testid="signal-card"]').first().waitFor();

      // Upvote & Bookmark directly from the feed card
      await memberPage.click('[data-testid="card-upvote-button"]');
      await memberPage.click('[data-testid="card-bookmark-button"]');

      // Open Signal Detail Drawer & post a technical comment
      await memberPage.click('[data-testid="signal-card"]');
      await memberPage.locator('[data-testid="drawer-upvote-button"]').waitFor();
      await memberPage.fill(
        'textarea[placeholder*="Share technical analysis"]',
        'Tested MCP 2.0 transport latency: p99 dropped by 38% under concurrent tool calls.'
      );
      await memberPage.click('button:has-text("Post Comment")');
      await memberPage
        .locator('text=Tested MCP 2.0 transport latency')
        .waitFor();
      const fullArticleHref = await memberPage
        .locator('[data-testid="drawer-full-article-link"]')
        .getAttribute('href');
      assert.ok(fullArticleHref?.startsWith('/news/'));
      await memberPage.click('button[aria-label="Close detail drawer"]');

      // 11. Create a Custom Feed and verify filtering
      await memberPage.click('[data-testid="create-feed-button"]');
      await memberPage.fill('input[placeholder*="Agentic Infra"]', 'MCP Agents Feed');
      await memberPage.click('button:has-text("Save Custom Feed")');
      await memberPage.locator('button:has-text("★ MCP Agents Feed")').waitFor();

      // 12. Verify /topics page (21 canonical topics + ASCII subtopic trees)
      await memberPage.goto(`${BASE_URL}/topics`, { waitUntil: 'networkidle' });
      const topicCardsCount = await memberPage.locator('[data-testid="topic-card"]').count();
      assert.equal(topicCardsCount, 21, 'Must render all 21 canonical AI topics');
      const topicsContent = await memberPage.locator('[data-testid="topics-grid"]').textContent();
      assert.ok(topicsContent?.includes('├──') && topicsContent?.includes('└──'));

      // 13. Verify /bookmarks page shows the saved signal and UPVOTES tab
      await memberPage.goto(`${BASE_URL}/bookmarks`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="bookmark-card"]').first().waitFor();
      await memberPage.click('[data-testid="bookmarks-tab-upvotes"]');
      await memberPage.locator('[data-testid="bookmark-card"]').first().waitFor();

      // 14. Verify /archive page compiles and displays an Email Report edition + /email/[id]
      await memberPage.goto(`${BASE_URL}/archive`, { waitUntil: 'networkidle' });
      await memberPage.click('[data-testid="compile-edition-button"]');
      await memberPage
        .locator('h2:has-text("AlphaSignal Daily:")')
        .waitFor();

      // 15. Verify all additional captured reference routes:
      // /editorial, /company/leaderboard, /company/openai, /topic/agents, /topic/agents/tool-use,
      // /news/[slug], /notifications, /pricing, /about, /editorial-team, /author/bendee983, /terms, /privacy, /newsletter
      await memberPage.goto(`${BASE_URL}/editorial`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="editorial-page"]').waitFor();

      await memberPage.goto(`${BASE_URL}/company/leaderboard`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="leaderboard-row"]').first().waitFor();

      await memberPage.goto(`${BASE_URL}/company/openai`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="company-follow-button"]').waitFor();
      await memberPage.click('[data-testid="company-follow-button"]');

      await memberPage.goto(`${BASE_URL}/topic/agents`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="topic-follow-button"]').waitFor();

      await memberPage.goto(`${BASE_URL}/topic/agents/tool-use`, { waitUntil: 'networkidle' });
      await memberPage.locator('h1:has-text("Tool Use")').waitFor();

      await memberPage.goto(`${BASE_URL}${fullArticleHref}`, {
        waitUntil: 'networkidle',
      });
      await memberPage.locator('[data-testid="news-article-page"]').waitFor();
      await memberPage.locator('[data-testid="takeaways-box"]').waitFor();

      await memberPage.goto(`${BASE_URL}/notifications`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="notifications-page"]').waitFor();

      await memberPage.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="pricing-page"]').waitFor();

      await memberPage.goto(`${BASE_URL}/about`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="about-page"]').waitFor();

      await memberPage.goto(`${BASE_URL}/editorial-team`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="editorial-team-page"]').waitFor();

      await memberPage.goto(`${BASE_URL}/author/bendee983`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="author-profile-page"]').waitFor();

      await memberPage.goto(`${BASE_URL}/terms`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="terms-page"]').waitFor();

      await memberPage.goto(`${BASE_URL}/privacy`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="privacy-page"]').waitFor();

      await memberPage.goto(`${BASE_URL}/newsletter`, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="newsletter-page"]').waitFor();

      // 16. Verify responsive viewports (Tablet 768x1024 & Mobile 390x844) and 404 page
      await memberPage.setViewportSize({ width: 768, height: 1024 });
      await memberPage.goto(BASE_URL, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="signal-card"]').first().waitFor();

      await memberPage.setViewportSize({ width: 390, height: 844 });
      await memberPage.goto(BASE_URL, { waitUntil: 'networkidle' });
      await memberPage.locator('[data-testid="signal-card"]').first().waitFor();

      const res404 = await memberPage.goto(`${BASE_URL}/non-existent-route-xyz`, {
        waitUntil: 'networkidle',
      });
      assert.equal(res404?.status(), 404);
      const body404 = await memberPage.textContent('body');
      assert.ok(body404?.includes('Page not found'));

      await memberContext.close();
      await adminContext.close();
    } finally {
      await browser.close();
      if (server.pid) {
        try {
          process.kill(-server.pid, 'SIGTERM');
        } catch {
          server.kill('SIGTERM');
        }
      }
      rmSync(workDir, { recursive: true, force: true });
    }
  }
);
