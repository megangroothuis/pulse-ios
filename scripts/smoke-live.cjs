#!/usr/bin/env node
// Live-mode smoke test: the app built with EXPO_PUBLIC_SUPABASE_URL pointing at
// scripts/mock-supabase.cjs. Drives sign-in (email code), connecting Spotify and
// Strava through the OAuth popup, the synced session in the feed and its detail
// screen, disconnect, and sign-out. Fails on any uncaught page error.
//
// Usage (see scripts/verify.sh, which starts both servers):
//   NODE_PATH="$(npm root -g)" node scripts/smoke-live.cjs http://localhost:8082

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.argv[2] || 'http://localhost:8082';
const OUT_DIR = path.resolve(__dirname, '..', '.smoke');
const TIMEOUT = 90000;
const session = require('./fixtures/live-session.json');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const pageErrors = [];
  const watch = (p, label) => p.on('pageerror', (err) => pageErrors.push(`${label}: ${err.message}`));
  watch(page, 'app');
  context.on('page', (p) => watch(p, 'popup'));
  // Account toggles use window.alert on web for errors; any dialog other than
  // the delete-account confirmation is a failure.
  page.on('dialog', async (d) => {
    if (d.type() === 'confirm' && d.message().startsWith('Delete account?')) return d.accept();
    pageErrors.push(`unexpected dialog: ${d.message()}`);
    await d.dismiss();
  });

  const visible = (text, exact = false) => page.getByText(text, { exact }).filter({ visible: true }).first();

  const step = async (name, fn) => {
    process.stdout.write(`- ${name} ... `);
    await fn();
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
    console.log('ok');
  };

  const connect = async (provider) => {
    const row = page.getByText(provider, { exact: true }).filter({ visible: true }).first();
    const [popup] = await Promise.all([context.waitForEvent('page', { timeout: TIMEOUT }), row.click()]);
    await popup.locator('#approve').click({ timeout: TIMEOUT });
    // The popup lands on <app>/connected, hands the result back and closes.
    await popup.waitForEvent('close', { timeout: TIMEOUT });
  };

  try {
    await step('live-signin', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      await visible('Email me a code').waitFor({ timeout: TIMEOUT });
    });

    await step('live-code', async () => {
      await page.getByPlaceholder('you@example.com').fill('megan@example.com');
      await visible('Email me a code').click();
      await page.getByPlaceholder('123456').fill('000000');
      await visible('Sign in', true).click();
      await visible('Token has expired or is invalid').waitFor({ timeout: TIMEOUT });
      await page.getByPlaceholder('123456').fill('123456');
      await visible('Sign in', true).click();
    });

    await step('live-empty-feed', async () => {
      await visible('Connect Spotify and Strava').waitFor({ timeout: TIMEOUT });
    });

    await step('live-connect', async () => {
      await visible('Connect accounts').click();
      await visible('Connected Accounts').waitFor({ timeout: TIMEOUT });
      await connect('Spotify');
      // Rows are disabled while the post-connect sync runs.
      await visible('Disconnect', true).waitFor({ timeout: TIMEOUT });
      await connect('Strava');
      // Both rows flip to "Disconnect" once the connections reload.
      await page.getByText('Disconnect', { exact: true }).filter({ visible: true }).nth(1).waitFor({ timeout: TIMEOUT });
      await visible('Megan', true).waitFor({ timeout: TIMEOUT });
    });

    await step('live-feed', async () => {
      await visible("Today's Mix", true).click();
      await visible(session.power_song).waitFor({ timeout: TIMEOUT });
      await visible(String(session.peak_heart_rate)).waitFor({ timeout: TIMEOUT });
    });

    await step('live-session-detail', async () => {
      await visible(session.power_song).click();
      await visible(session.title).waitFor({ timeout: TIMEOUT });
      await page.mouse.wheel(0, 1200);
      await visible(session.genres[0].name, true).waitFor({ timeout: TIMEOUT });
    });

    await step('live-reload-keeps-login', async () => {
      // The app doesn't use browser history, so reload instead of going back.
      await page.reload({ waitUntil: 'domcontentloaded' });
      await visible(session.power_song).waitFor({ timeout: TIMEOUT });
    });

    await step('live-disconnect-signout', async () => {
      await visible('You', true).click();
      await page.getByText('Disconnect', { exact: true }).filter({ visible: true }).first().click();
      await visible('Connect', true).waitFor({ timeout: TIMEOUT });
      await visible('Sign out', true).click();
      await visible('Email me a code').waitFor({ timeout: TIMEOUT });
    });

    await step('live-delete-account', async () => {
      await page.getByPlaceholder('you@example.com').fill('megan@example.com');
      await visible('Email me a code').click();
      await page.getByPlaceholder('123456').fill('123456');
      await visible('Sign in', true).click();
      await visible('You', true).click();
      await visible('Delete account', true).click();
      await visible('Email me a code').waitFor({ timeout: TIMEOUT });
      const res = await page.request.get(`${process.env.MOCK_SUPABASE_URL || 'http://localhost:54321'}/__state`);
      if (!(await res.json()).deleted) throw new Error('delete-account was not called');
    });
  } catch (err) {
    console.log('FAILED');
    console.error(err.message);
    await page.screenshot({ path: path.join(OUT_DIR, 'live-failure.png') }).catch(() => {});
    pageErrors.push(`step failed: ${err.message.split('\n')[0]}`);
  } finally {
    await browser.close();
  }

  if (pageErrors.length) {
    console.error(`\nLIVE SMOKE FAILED (${pageErrors.length} error(s)):`);
    pageErrors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }
  console.log(`\nLIVE SMOKE PASSED — screenshots in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
