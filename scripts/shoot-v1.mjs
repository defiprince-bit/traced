import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const C = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
const out = path.resolve(process.env.OUT ?? new URL('../screens/v1', import.meta.url).pathname);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

async function shot(name, { hash = '', viewport = { width: 1440, height: 900 }, wait, fullPage = false } = {}) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle', timeout: 60000 });
  if (wait) await wait(page);
  else await page.waitForTimeout(1200);
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  await page.close();
  const st = fs.statSync(file);
  console.log(name, `${(st.size / 1024).toFixed(0)} KB`);
}

const waitApp = (sel = '[data-testid=title], .cidbig, .finding, .radial, .empty, .state') => async (page) => {
  await page.waitForSelector('.shell, .main', { timeout: 30000 });
  await page.waitForSelector(sel, { timeout: 30000 });
  // owner may stay on index data if RPC is slow; don't fail the shot
  await Promise.race([
    page.waitForSelector('[data-testid=owner][data-live="1"]', { timeout: 25000 }).catch(() => null),
    page.waitForTimeout(25000),
  ]);
  await page.waitForSelector('[data-testid=verdict], [data-testid=truth-table], .finding, .radial, .empty', { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(1500);
};

// 1 landing hero
await shot('landing-hero', {
  wait: async (page) => {
    await page.waitForSelector('#hero canvas, .hero-r canvas', { timeout: 15000 });
    await page.waitForTimeout(1800);
  },
});

// 2 lookup #5
await shot('lookup-5', {
  hash: `#/${C}/5?vs=4&view=lookup`,
  wait: waitApp('[data-testid=title], .cidbig'),
});

// 3 lineage #12
await shot('lineage-12', {
  hash: `#/${C}/12?view=lineage`,
  wait: waitApp('.radial, .mlist'),
});

// 4 copy #34
await shot('copy-34', {
  hash: `#/${C}/34?view=copy`,
  wait: waitApp('.finding, .twin2, [data-testid=twins]'),
});

// 5 mobile #5
await shot('lookup-5-mobile', {
  hash: `#/${C}/5?vs=4&view=lookup`,
  viewport: { width: 390, height: 844 },
  wait: waitApp('[data-testid=title], .cidbig'),
});
await shot('lookup-5-mobile-full', {
  hash: `#/${C}/5?vs=4&view=lookup`,
  viewport: { width: 390, height: 844 },
  wait: async (page) => {
    await waitApp('[data-testid=title], .cidbig')(page);
    await page.addStyleTag({ content: '.tabbar,.mtop{position:sticky!important}' });
  },
  fullPage: true,
});

await browser.close();
console.log('wrote', out);
