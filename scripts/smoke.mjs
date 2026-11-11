import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const C = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
const out = process.env.OUT ?? new URL('../screens', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const results = {};
async function check(name, hash, fn) {
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid=owner][data-live="1"]', { timeout: 30000 });
  const r = await fn();
  results[name] = r;
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
}
const text = sel => page.locator(sel).first().innerText().catch(() => null);
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.stats');
await page.screenshot({ path: `${out}/landing.png`, fullPage: true });

await check('cerebr-5', `#/${C}/5?vs=4`, async () => {
  await page.click('[data-testid=replay]');
  await page.waitForSelector('[data-testid=verdict]', { timeout: 30000 });
  return { title: await text('[data-testid=title]'), cls: await text('[data-testid=class]'), owner: await text('[data-testid=owner]'),
    gates: await text('[data-testid=gates]'), parents: await text('[data-testid=parents]'), tx: await text('[data-testid=tx]'),
    verdict: await text('[data-testid=verdict]'), table: await text('[data-testid=truth-table]') };
});
await check('cerebr-4', `#/${C}/4?vs=34`, async () => {
  await page.click('[data-testid=replay]');
  await page.waitForSelector('[data-testid=verdict]', { timeout: 30000 });
  return { title: await text('[data-testid=title]'), cls: await text('[data-testid=class]'), owner: await text('[data-testid=owner]'),
    gates: await text('[data-testid=gates]'), twins: (await text('[data-testid=twins]'))?.slice(0, 600), original: await text('[data-testid=original]'),
    tx: await text('[data-testid=tx]'), verdict: await text('[data-testid=verdict]') };
});
await check('cerebr-34', `#/${C}/34`, async () => ({ owner: await text('[data-testid=owner]'), badge: await text('[data-testid=badge]'), original: await text('[data-testid=original]'), cls: await text('[data-testid=class]') }));
await check('cerebr-12', `#/${C}/12`, async () => ({ parents: await text('[data-testid=parents]'), gates: await text('[data-testid=gates]') }));
await check('cerebr-3', `#/${C}/3`, async () => ({ cls: await text('[data-testid=class]'), children: (await text('[data-testid=children]'))?.slice(0, 200) }));
await page.setViewportSize({ width: 390, height: 844 });
await check('cerebr-5-mobile', `#/${C}/5`, async () => ({ ok: true }));
console.log(JSON.stringify(results, null, 2));
await browser.close();
