#!/usr/bin/env node
// Headless smoke test: loads the Expo web build in Chromium, checks that the
// main screens render and navigate, and fails on any uncaught page error.
//
// Usage (dev server must already be running, see CLAUDE.md):
//   NODE_PATH="$(npm root -g)" node scripts/smoke-web.cjs [baseUrl]
//
// Screenshots are written to .smoke/ (gitignored).

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.argv[2] || process.env.SMOKE_URL || 'http://localhost:8081';
const OUT_DIR = path.resolve(__dirname, '..', '.smoke');
const TIMEOUT = 60000; // first web bundle can take a while to compile

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  // iPhone-ish viewport so layout matches the target device
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Screens lower in the navigation stack stay in the DOM (hidden), so only
  // match text that is actually visible on the current screen.
  const visible = (text, exact = false) =>
    page.getByText(text, { exact }).filter({ visible: true }).first();

  const step = async (name, fn) => {
    process.stdout.write(`- ${name} ... `);
    await fn();
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
    console.log('ok');
  };

  try {
    await step('mixdown', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      await visible("Today's Mix").waitFor({ timeout: TIMEOUT });
    });

    await step('studio', async () => {
      await visible('Studio', true).click();
      await visible('AI Playlist Builder').waitFor({ timeout: TIMEOUT });
    });

    await step('you', async () => {
      await visible('You', true).click();
      await visible('Followers').waitFor({ timeout: TIMEOUT });
    });
  } catch (err) {
    console.log('FAILED');
    console.error(err.message);
    await page.screenshot({ path: path.join(OUT_DIR, 'failure.png') }).catch(() => {});
    pageErrors.push(`step failed: ${err.message.split('\n')[0]}`);
  } finally {
    await browser.close();
  }

  if (consoleErrors.length) {
    console.log(`\nconsole.error output (${consoleErrors.length}, not fatal):`);
    consoleErrors.slice(0, 20).forEach((e) => console.log(`  ${e.split('\n')[0]}`));
  }
  if (pageErrors.length) {
    console.error(`\nSMOKE FAILED (${pageErrors.length} error(s)):`);
    pageErrors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }
  console.log(`\nSMOKE PASSED — screenshots in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
