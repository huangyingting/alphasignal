import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const origin = "https://alphasignal.ai";
const output = "artifacts/reference";
await fs.mkdir(output, { recursive: true, mode: 0o700 });
const browser = await chromium.launch({ headless: true });
const results = [];

async function snapshot(page, name) {
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  const structure = await page.evaluate(() => ({
    title: document.title,
    headings: [...document.querySelectorAll("h1,h2,h3")].map(e => e.textContent.trim()).slice(0, 4),
    controls: [...document.querySelectorAll("button,input,select,textarea")].filter(e => e.getClientRects().length).map(e => ({
      tag: e.tagName, type: e.type, label: e.getAttribute("aria-label") || e.textContent.trim().slice(0, 80),
      placeholder: e.getAttribute("placeholder"), name: e.name,
    })),
    links: [...new Set([...document.querySelectorAll("a[href]")].map(e => e.getAttribute("href")))]
      .filter(h => h.startsWith("/") || h.startsWith("https://alphasignal.ai")).slice(0, 120),
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  results.push({ name, path: new URL(page.url()).pathname, viewport: page.viewportSize(), ...structure });
  console.log(`${name}: ${page.url()} (${structure.controls.length} controls, overflow=${structure.overflow})`);
}

try {
  const anon = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await anon.newPage();
  await page.goto(origin, { waitUntil: "networkidle", timeout: 60000 });
  await snapshot(page, "01-home-anonymous-desktop");
  await page.getByRole("button", { name: "SIGN IN", exact: true }).first().click();
  await snapshot(page, "04-anonymous-sign-in");
  await anon.close();

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const credentials = JSON.parse(await fs.readFile(".cred", "utf8"));
  await context.addCookies(credentials.map(c => ({
    name: c.name, value: c.value, domain: c.domain, path: c.path || "/",
    secure: !!c.secure, httpOnly: !!c.httpOnly,
    sameSite: ({ lax: "Lax", strict: "Strict", no_restriction: "None" })[c.sameSite] || "Lax",
    ...(c.expirationDate ? { expires: c.expirationDate } : {}),
  })));
  const auth = await context.newPage();
  const network = new Map();
  auth.on("response", response => {
    const u = new URL(response.url());
    if (u.origin === origin && u.pathname.startsWith("/api/") && ["xhr", "fetch", "document"].includes(response.request().resourceType())) {
      network.set(`${response.request().method()} ${u.pathname}`, response.status());
    }
  });
  await auth.goto(origin, { waitUntil: "networkidle", timeout: 60000 });
  await snapshot(auth, "02-home-cookie-desktop");
  await auth.setViewportSize({ width: 390, height: 844 });
  await snapshot(auth, "03-home-cookie-mobile");
  const routes = ["/editorial", "/topics", "/company/leaderboard", "/topic/agents",
    "/company/openai", "/bookmarks", "/notifications", "/settings", "/archive",
    "/about", "/editorial-team", "/terms", "/privacy", "/newsletter"];
  const homeLinks = results.find(r => r.name === "02-home-cookie-desktop").links;
  const article = homeLinks.find(h => h.startsWith("/news/"));
  if (article) routes.splice(5, 0, article);
  await auth.setViewportSize({ width: 1440, height: 1000 });
  let n = 5;
  for (const route of routes) {
    try {
      await auth.goto(`${origin}${route}`, { waitUntil: "networkidle", timeout: 45000 });
      await snapshot(auth, `${String(n++).padStart(2, "0")}-${route.split("/").filter(Boolean).slice(0, 2).join("-")}`);
    } catch (e) {
      results.push({ path: route, error: e.message.split("\n")[0] });
    }
  }
  async function scenario(name, action) {
    try {
      await auth.goto(origin, { waitUntil: "networkidle", timeout: 45000 });
      await action();
      await auth.waitForTimeout(700);
      await snapshot(auth, name);
    } catch (e) {
      results.push({ name, error: e.message.split("\n")[0] });
      console.log(`${name}: ${e.message.split("\n")[0]}`);
    }
  }
  await scenario("21-search-open", async () => {
    await auth.getByRole("button", { name: "Search (Control-K)", exact: true }).click();
  });
  await scenario("22-custom-feed-dialog", async () => {
    await auth.getByRole("button", { name: "Create a new feed" }).click();
  });
  await scenario("23-grid-layout", async () => {
    await auth.getByRole("button", { name: "Grid view", exact: true }).filter({ visible: true }).click();
  });
  await scenario("24-date-filter", async () => {
    await auth.getByRole("button", { name: "LAST WEEK", exact: true }).click();
  });
  await scenario("25-membership", async () => {
    await auth.getByRole("button", { name: /Trial/ }).click();
  });
  await auth.setViewportSize({ width: 768, height: 1024 });
  await scenario("26-tablet", async () => {});
  await auth.setViewportSize({ width: 390, height: 844 });
  await scenario("27-mobile-filters", async () => {
    await auth.getByRole("button", { name: "Filters", exact: true }).click();
  });
  await scenario("28-mobile-menu", async () => {
    await auth.getByRole("button", { name: "Open menu", exact: true }).click();
  });
  await auth.goto(`${origin}/news/this-route-does-not-exist`, { waitUntil: "networkidle" });
  await snapshot(auth, "29-not-found");
  await fs.writeFile(`${output}/network.json`, JSON.stringify([...network], null, 2));
  await context.close();
} finally {
  await fs.writeFile(`${output}/observations.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
