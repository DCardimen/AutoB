import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Exercise the exact distributed HTML with an empty profile and no asset server.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const requests = [], errors = [];
const url = (process.env.BASE_URL || 'http://127.0.0.1:3011') + '/native-offline';
const body = fs.readFileSync('Starfall-Menagerie.html');
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => {
  if (route.request().url() === url)
    return route.fulfill({ status: 200, contentType: 'text/html', body });
  requests.push(route.request().url());
  return route.abort();
});
try {
  await page.clock.install();
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.match(await page.locator('.local-label').textContent(), /NATIVE EXPEDITION V10/);
  assert.equal(await page.evaluate(() => starfall.state.run.native), true);
  assert.equal(await page.evaluate(() => starfall.state.run.team.length), 6);
  await page.locator('[data-action="battle"]').click();
  await page.clock.runFor(11000);
  const result = await page.evaluate(() => ({
    native: starfall.state.run.native,
    metrics: starfall.state.battle.metrics,
    phase: starfall.state.phase,
  }));
  assert.ok(result.metrics.bladeContacts > 0);
  assert.ok(result.metrics.skills > 0);
  assert.deepEqual(requests, []);
  assert.deepEqual(errors, []);
  await page.locator('#battle-canvas').screenshot({ path: 'playtest-artifacts/v9-native-offline.png' });
  fs.writeFileSync('playtest-artifacts/v9-native-offline-report.json',
    JSON.stringify({ requests, errors, result }, null, 2));
  console.log('Fresh native offline expedition: six starters, physical contacts and skills; zero external requests.');
} finally {
  await browser.close();
}
