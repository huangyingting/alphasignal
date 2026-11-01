import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const cookies = JSON.parse(await fs.readFile(".cred", "utf8"));
await context.addCookies(cookies.map(c => ({
  name: c.name, value: c.value, domain: c.domain, path: c.path || "/",
  secure: !!c.secure, httpOnly: !!c.httpOnly,
  sameSite: ({ lax: "Lax", strict: "Strict", no_restriction: "None" })[c.sameSite] || "Lax",
  ...(c.expirationDate ? { expires: c.expirationDate } : {}),
})));
const page = await context.newPage();
const results = [];
async function capture(name) {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `artifacts/reference/${name}.png`, fullPage: true });
  const data = await page.evaluate(() => ({
    headings: [...document.querySelectorAll("h1,h2,h3")].map(e => e.textContent.trim()).slice(0, 5),
    inputs: [...document.querySelectorAll("input,select,textarea")].filter(e => e.getClientRects().length)
      .map(e => ({ type: e.type, placeholder: e.getAttribute("placeholder"), name: e.name })),
    controls: [...document.querySelectorAll("button,[role=option]")].filter(e => e.getClientRects().length)
      .map(e => e.getAttribute("aria-label") || e.textContent.trim()).slice(-35),
  }));
  results.push({ name, path: new URL(page.url()).pathname, ...data });
  console.log(name, JSON.stringify(data));
}
async function run(name, fn) {
  try { await fn(); } catch (e) { results.push({ name, error: e.message.split("\n")[0] }); console.log(name, e.message.split("\n")[0]); }
}
try {
  await page.goto("https://alphasignal.ai", { waitUntil: "networkidle" });
  await run("30-cookie-preferences", async () => {
    await page.getByRole("button", { name: "Preferences", exact: true }).click();
    await capture("30-cookie-preferences");
    const reject = page.getByRole("button", { name: /Reject|essential only|Save preferences/i });
    if (await reject.count()) await reject.first().click();
    else await page.keyboard.press("Escape");
  });
  await page.goto("https://alphasignal.ai", { waitUntil: "networkidle" });
  await run("31-search-scenario", async () => {
    await page.getByRole("button", { name: "Search (Control-K)", exact: true }).click();
    await page.getByPlaceholder("Search companies, topics, and articles…").fill("OpenAI");
    await capture("31-search-results");
    await page.getByPlaceholder("Search companies, topics, and articles…").fill("zzzx-no-result-8842");
    await capture("32-search-empty");
    await page.keyboard.press("Escape");
  });
  await run("33-bookmark-roundtrip", async () => {
    await page.goto("https://alphasignal.ai", { waitUntil: "networkidle" });
    const target = page.getByRole("button", { name: "Bookmark", exact: true }).first();
    await target.click();
    await capture("33-bookmark-action");
    // Only remove the bookmark created by this scenario.
    const remove = page.getByRole("button", { name: /Remove bookmark|Unbookmark/i }).first();
    if (await remove.count()) {
      await page.goto("https://alphasignal.ai/bookmarks", { waitUntil: "networkidle" });
      await capture("34-bookmark-saved");
      await page.getByRole("button", { name: /Remove bookmark|Unbookmark/i }).first().click();
      await capture("35-bookmark-restored");
    } else {
      results.push({ name: "33-bookmark-roundtrip", note: "Action opened selection UI; no confirmed persistent mutation." });
    }
  });
  await page.goto("https://alphasignal.ai/settings", { waitUntil: "networkidle" });
  for (const tab of ["PERSONALIZATION", "SUBSCRIPTION", "PERKS", "GENERAL"]) {
    await run(`settings-${tab}`, async () => {
      await page.getByRole("button", { name: tab, exact: true }).click();
      await capture(`36-settings-${tab.toLowerCase()}`);
    });
  }
  for (const section of ["Integrations", "Newsletter", "Role", "Data & account"]) {
    await run(`settings-${section}`, async () => {
      await page.getByRole("button", { name: section, exact: true }).click();
      await capture(`37-settings-${section.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`);
    });
  }
} finally {
  await fs.writeFile("artifacts/reference/scenarios.json", JSON.stringify(results, null, 2), { mode: 0o600 });
  await browser.close();
}
