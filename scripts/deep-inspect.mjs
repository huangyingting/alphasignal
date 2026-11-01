import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const origin = "https://alphasignal.ai";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const cookies = JSON.parse(await fs.readFile(".cred", "utf8"));
await context.addCookies(cookies.map(c => ({
  name: c.name, value: c.value, domain: c.domain, path: c.path || "/",
  secure: !!c.secure, httpOnly: !!c.httpOnly,
  sameSite: ({ lax: "Lax", strict: "Strict", no_restriction: "None" })[c.sameSite] || "Lax",
  ...(c.expirationDate ? { expires: c.expirationDate } : {}),
})));

const page = await context.newPage();

async function extractPageDetails(urlPath) {
  await page.goto(`${origin}${urlPath}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(800);
  return await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    const htmlStyle = getComputedStyle(document.documentElement);
    const header = document.querySelector("header, nav");
    const headerStyle = header ? getComputedStyle(header) : null;
    const h1 = document.querySelector("h1");
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const h2 = document.querySelector("h2");
    const h2Style = h2 ? getComputedStyle(h2) : null;

    const textBlocks = [...document.querySelectorAll("h1, h2, h3, h4, p, li, th, td, span, a, button, label")]
      .filter(el => el.getClientRects().length > 0 && el.children.length === 0)
      .map(el => ({
        tag: el.tagName,
        text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 180),
        href: el.getAttribute("href"),
      }))
      .filter(x => x.text.length > 0)
      .slice(0, 200);

    const cards = [...document.querySelectorAll("article, [class*='card'], [class*='border']")]
      .filter(el => el.getClientRects().length > 0 && el.textContent.trim().length > 30)
      .slice(0, 15)
      .map(el => {
        const s = getComputedStyle(el);
        return {
          tag: el.tagName,
          className: el.className.toString().slice(0, 150),
          bg: s.backgroundColor,
          border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
          radius: s.borderRadius,
          textSample: el.textContent.trim().replace(/\s+/g, " ").slice(0, 260),
        };
      });

    return {
      url: location.href,
      title: document.title,
      styles: {
        bodyBg: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        bodyFont: bodyStyle.fontFamily,
        htmlClass: document.documentElement.className,
        headerBg: headerStyle?.backgroundColor,
        headerBorder: headerStyle ? `${headerStyle.borderBottomWidth} ${headerStyle.borderBottomColor}` : null,
        h1Font: h1Style ? `${h1Style.fontWeight} ${h1Style.fontSize}/${h1Style.lineHeight} ${h1Style.fontFamily}` : null,
        h1Color: h1Style?.color,
        h2Font: h2Style ? `${h2Style.fontWeight} ${h2Style.fontSize}/${h2Style.lineHeight} ${h2Style.fontFamily}` : null,
      },
      cards,
      textBlocks,
    };
  });
}

const report = {};
const pagesToInspect = [
  "/",
  "/editorial",
  "/topics",
  "/company/leaderboard",
  "/topic/agents",
  "/company/openai",
  "/news/openai-s-gpt-6-1-terra-cuts-agent-costs-50-and-runs-3x-faster",
  "/bookmarks",
  "/notifications",
  "/settings",
  "/pricing",
  "/archive",
  "/about",
  "/editorial-team",
];

for (const p of pagesToInspect) {
  try {
    report[p] = await extractPageDetails(p);
    console.log("Inspected", p);
  } catch (e) {
    report[p] = { error: e.message };
    console.log("Error inspecting", p, e.message);
  }
}

// Also inspect modals: Custom Feed dialog, Bookmark list popover, Cookie Preferences, and Anonymous Sign-In modal
try {
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Preferences", exact: true }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "artifacts/reference/30-cookie-preferences.png", fullPage: true });
  report["modal:cookie-preferences"] = await page.evaluate(() => {
    const dialog = document.querySelector("[role='dialog'], [aria-modal='true']") || document.body;
    return dialog.innerText.slice(0, 2000);
  });
  await page.keyboard.press("Escape");
} catch (e) {
  report["modal:cookie-preferences"] = { error: e.message };
}

try {
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Create a new feed" }).first().click();
  await page.waitForTimeout(600);
  report["modal:create-feed"] = await page.evaluate(() => {
    const dialog = document.querySelector("[role='dialog'], [aria-modal='true']") || document.body;
    return dialog.innerText.slice(0, 2000);
  });
  await page.keyboard.press("Escape");
} catch (e) {
  report["modal:create-feed"] = { error: e.message };
}

// Inspect Settings tabs text
try {
  await page.goto(`${origin}/settings`, { waitUntil: "networkidle" });
  for (const tab of ["GENERAL", "PERSONALIZATION", "SUBSCRIPTION", "PERKS"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await page.waitForTimeout(500);
    report[`settings:${tab}`] = await page.evaluate(() => document.querySelector("main")?.innerText || document.body.innerText);
  }
} catch (e) {
  report["settings:error"] = e.message;
}

await fs.writeFile("artifacts/reference/deep-inspect.json", JSON.stringify(report, null, 2));
await browser.close();
console.log("Saved artifacts/reference/deep-inspect.json");
