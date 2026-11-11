import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const C = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
const NEW = process.env.NEW_CPU ?? '0x69f663931209096037474d7c20402232e5c762ca';
const NEW_ID = Number(process.env.NEW_ID ?? 3);
const out = path.resolve(process.env.OUT ?? new URL('../screens/v2', import.meta.url).pathname);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

async function shot(name, { hash = '', viewport = { width: 1440, height: 900 }, wait, fullPage = false } = {}) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle', timeout: 90000 });
  if (wait) await wait(page);
  else await page.waitForTimeout(1200);
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  await page.close();
  const st = fs.statSync(file);
  console.log(name, `${(st.size / 1024).toFixed(0)} KB`);
}

const waitLineage = (mobile = false) => async (page) => {
  await page.waitForSelector('.shell, .main', { timeout: 30000 });
  const sel = mobile
    ? '[data-testid=family-list], .family-list, .mlist .leaf, .mlist'
    : '[data-testid=family-tree] .orb, [data-testid=family-tree] .leaf';
  await page.waitForSelector(sel, { timeout: 30000 });
  await page.waitForTimeout(1800);
};

const waitApp = (sel = '[data-testid=title], .cidbig') => async (page) => {
  await page.waitForSelector('.shell, .main', { timeout: 30000 });
  await page.waitForSelector(sel, { timeout: 30000 });
  await Promise.race([
    page.waitForSelector('[data-testid=owner][data-live="1"]', { timeout: 25000 }).catch(() => null),
    page.waitForTimeout(25000),
  ]);
  await page.waitForSelector('[data-testid=verdict], [data-testid=truth-table], [data-testid=family-tree], .finding, .radial', { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(1500);
};

await shot('lineage-5', {
  hash: `#/${C}/5?view=lineage`,
  wait: waitLineage(),
});

await shot('lineage-3-fanout', {
  hash: `#/${C}/3?view=lineage`,
  wait: waitLineage(),
});

await shot('lookup-new', {
  hash: `#/${NEW}/${NEW_ID}?view=lookup`,
  wait: waitApp(),
});

await shot('lineage-5-mobile', {
  hash: `#/${C}/5?view=lineage`,
  viewport: { width: 390, height: 844 },
  wait: async (page) => {
    await waitLineage(true)(page);
    await page.addStyleTag({ content: '.tabbar,.mtop{position:sticky!important}' });
  },
});

await browser.close();
console.log('wrote', out);
