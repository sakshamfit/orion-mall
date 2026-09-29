/** debug: pinpoint the 360px horizontal overflow source */
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

const info = await page.evaluate(() => {
  const vw = window.innerWidth;
  const clipped = (el) => {
    let n = el.parentElement;
    while (n) {
      const s = getComputedStyle(n);
      if (['hidden', 'clip', 'auto', 'scroll'].includes(s.overflowX)) return true;
      n = n.parentElement;
    }
    return false;
  };
  const bad = [];
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 && !clipped(el)) {
      bad.push(`${el.tagName}.${String(el.className).split(' ').slice(0, 2).join('.')} right=${Math.round(r.right)}`);
    }
  });
  return {
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bad: bad.slice(0, 10),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
