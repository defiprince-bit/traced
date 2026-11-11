import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const C = '0xb04eb79d1a5eecaabaaff7b77d7c27578ee693ff';
const out = path.resolve(process.env.OUT ?? new URL('../screens/v3', import.meta.url).pathname);
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
  console.log(name, `${(st.size / 1024).toFixed(0)} KB`, fullPage ? '(full)' : '');
}

const waitStart = () => async (page) => {
  await page.waitForSelector('[data-testid=start-screen]', { timeout: 30000 });
  await page.waitForSelector('[data-testid=demo-cards] .demo-card', { timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-testid=demo-cards] .demo-card').length >= 3, { timeout: 10000 });
  await page.waitForTimeout(800);
};

const waitLatch = async (page) => {
  await page.waitForSelector('.shell, .main', { timeout: 30000 });
  await page.waitForSelector('[data-testid=latch-replay]', { timeout: 30000 });
  await Promise.race([
    page.waitForSelector('[data-testid=latch-catalog] tbody tr', { timeout: 45000 }),
    page.waitForTimeout(45000),
  ]);
  await Promise.race([
    page.waitForSelector('[data-testid=verdict]', { timeout: 20000 }).catch(() => null),
    page.waitForTimeout(20000),
  ]);
  // let row fade-in finish
  await page.waitForTimeout(2000);
};

await shot('start-desktop', {
  hash: `#/${C}`,
  wait: waitStart(),
});

await shot('start-mobile', {
  hash: `#/${C}`,
  viewport: { width: 390, height: 844 },
  fullPage: true,
  wait: async (page) => {
    await waitStart()(page);
    // Park the fixed tab bar at the end of the document so a full-page
    // shot shows every card without the bar overlaying one in the middle.
    await page.addStyleTag({ content: '.shell{position:relative}.tabbar{position:absolute!important;top:auto;bottom:0}' });
    await page.waitForTimeout(200);
  },
});

await shot('latch-replay', {
  hash: `#/${C}/14?vs=35&view=replay`,
  wait: waitLatch,
  fullPage: true,
});

await browser.close();
console.log('wrote', out);
