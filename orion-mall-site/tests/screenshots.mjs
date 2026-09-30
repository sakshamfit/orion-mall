/** viewport-only screenshots for visual QA */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHOTS = join(dirname(fileURLToPath(import.meta.url)), 'screens');
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/tmp/chrome2',
  headless: true,
  args: [
    '--no-sandbox',
    '--no-zygote',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
  ],
  defaultViewport: { width: 1440, height: 900 },
});

const page = await browser.newPage();
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (/fonts\.(googleapis|gstatic)\.com/.test(req.url()))
    req.respond({ status: 200, contentType: 'text/css', body: '' });
  else req.continue();
});
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('loader'), { timeout: 20000, polling: 200 });
await sleep(1000);

// scroll with real wheel events (exactly what a user does; Lenis handles these
// natively, unlike programmatic window.scrollTo jumps)
const shot = async (name, y, settle = 900) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  let guard = 0;
  while (guard < 500) {
    const cur = await page.evaluate(() => window.scrollY);
    if (cur >= y - 10) break;
    await page.mouse.wheel({ deltaY: Math.min(260, y - cur + 30) });
    await sleep(30);
    guard++;
  }
  await sleep(settle);
  await page.screenshot({ path: join(SHOTS, name), captureBeyondViewport: false });
  console.log('shot', name, 'at', await page.evaluate(() => Math.round(window.scrollY)));
};

const vh = await page.evaluate(() => window.innerHeight);
await shot('qa-1-hero.png', 0);
await shot('qa-2-scrub-entrance.png', vh * 6 * 0.22);
await shot('qa-3-scrub-atrium.png', vh * 6 * 0.6);
await shot('qa-4-overlay-area.png', vh * 6 * 0.68);

// sections: scroll through the whole page once (this builds the shop gallery and
// its pin-spacer), then measure the final layout positions.
{
  let guard = 0;
  while (guard < 900) {
    const atEnd = await page.evaluate(
      () => window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 40,
    );
    if (atEnd) break;
    await page.mouse.wheel({ deltaY: 400 });
    await sleep(24);
    guard++;
  }
  await sleep(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(900);
}
const pos = await page.evaluate(() => {
  const get = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return 0;
    return el.getBoundingClientRect().top + window.scrollY;
  };
  return {
    about: get('#about'),
    shop: get('#shop'),
    dine: get('#dine'),
    entertain: get('#entertain'),
    events: get('#events'),
    visit: get('#visit'),
    footer: get('.footer'),
  };
});
console.log(JSON.stringify(pos));
await shot('qa-5-about.png', pos.about + 40);
await shot('qa-6-shop.png', pos.shop + vh * 0.35, 1400);
await shot('qa-7-dine.png', pos.dine + 60);
await shot('qa-8-entertain.png', pos.entertain + 60);
await shot('qa-9-events.png', pos.events + 60);
await shot('qa-10-visit.png', pos.visit + 60);
await shot('qa-11-footer.png', pos.footer + 40, 1500);

// visit via the nav anchor (lenis.scrollTo — the code path real users take)
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(500);
await page.click('.nav__cta[href="#visit"]');
await sleep(2200);
await page.screenshot({ path: join(SHOTS, 'qa-13-visit-anchor.png'), captureBeyondViewport: false });
console.log('shot qa-13-visit-anchor.png at', await page.evaluate(() => Math.round(window.scrollY)));

// menu overlay
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(600);

// mobile: menu overlay + a couple of sections
await page.setViewport({ width: 390, height: 844 });
await sleep(700);
await page.click('#menu-toggle');
await sleep(900);
await page.screenshot({ path: join(SHOTS, 'qa-12-menu-mobile.png'), captureBeyondViewport: false });
await page.click('#menu-toggle');
await sleep(400);

await page.setViewport({ width: 1440, height: 900 });
await sleep(500);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(500);

await browser.close();
