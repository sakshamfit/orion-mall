/** debug: A/B test which section causes the 360px document overflow */
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/tmp/chrome2',
  headless: true,
  args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  defaultViewport: { width: 360, height: 780 },
});
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) req.respond({ status: 200, contentType: 'text/css', body: '' });
  else req.continue();
});
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('loader'), { timeout: 20000, polling: 200 });
await new Promise((r) => setTimeout(r, 600));

const res = await page.evaluate(() => {
  const ids = ['hero', 'about', 'shop', 'dine', 'entertain', 'events', 'visit'];
  const out = {};
  const base = document.documentElement.scrollWidth;
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const prev = el.style.display;
    el.style.display = 'none';
    out[id] = document.documentElement.scrollWidth;
    el.style.display = prev;
  }
  return { base, out };
});
console.log(JSON.stringify(res, null, 2));

// also inspect the pin-spacer wrapper of #shop
const pin = await page.evaluate(() => {
  const shop = document.getElementById('shop');
  const spacer = shop.parentElement;
  return {
    spacerClass: spacer.className,
    spacerOverflowX: getComputedStyle(spacer).overflowX,
    viewportOverflowX: getComputedStyle(document.getElementById('shop-viewport')).overflowX,
    heroOverflow: getComputedStyle(document.getElementById('hero')).overflow,
  };
});
console.log(JSON.stringify(pin, null, 2));
await browser.close();
