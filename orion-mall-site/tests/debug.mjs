/** debug script: find CLS sources + horizontal overflow culprits */
import puppeteer from 'puppeteer-core';

const BASE = 'http://127.0.0.1:4173/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
await page.evaluateOnNewDocument(() => {
  window.__shifts = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (!e.hadRecentInput) {
        window.__shifts.push({
          v: +e.value.toFixed(4),
          t: Math.round(e.startTime),
          nodes: (e.sources || []).map((s) => `${s.node?.nodeName}${s.node?.className ? '.' + String(s.node.className).split(' ')[0] : ''}${s.node?.id ? '#' + s.node.id : ''}`).join(','),
        });
      }
    }
  }).observe({ type: 'layout-shift', buffered: true });
});

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('loader'), { timeout: 20000, polling: 200 });

// overflow culprits
const overflow = await page.evaluate(() => {
  const vw = window.innerWidth;
  const bad = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) {
      bad.push(`${el.tagName}.${String(el.className).split(' ').slice(0, 2).join('.')} right=${Math.round(r.right)} left=${Math.round(r.left)} w=${Math.round(r.width)}`);
    }
  });
  return bad.slice(0, 15);
});
console.log('OVERFLOW @360:', overflow.length ? '\n  ' + overflow.join('\n  ') : 'none');

// slow scroll the whole page, collecting shifts
const docHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y <= docHeight; y += 400) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await sleep(120);
}
await sleep(500);
const shifts = await page.evaluate(() => window.__shifts);
console.log(`\nSHIFTS (${shifts.length}):`);
shifts.slice(0, 20).forEach((s) => console.log(`  v=${s.v} t=${s.t}ms nodes=${s.nodes}`));

await browser.close();
