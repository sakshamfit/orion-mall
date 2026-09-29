/** debug: inside #dine, what extends past the viewport? */
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
  const vw = window.innerWidth;
  const rows = [];
  const dine = document.getElementById('dine');
  dine.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1) {
      const s = getComputedStyle(el);
      rows.push(`${el.tagName}.${String(el.className).split(' ').slice(0, 2).join('.')} right=${Math.round(r.right)} w=${Math.round(r.width)} ws=${s.whiteSpace.slice(0, 9)} pos=${s.position}`);
    }
  });
  // measure the whole main scrollWidth contribution by hiding dine children one by one
  const kids = [...dine.children].map((k) => ({ tag: k.tagName + '.' + k.className, sw0: 0 }));
  kids.forEach((k, i) => {
    const el = dine.children[i];
    const prev = el.style.display;
    el.style.display = 'none';
    k.sw = document.documentElement.scrollWidth;
    el.style.display = prev;
  });
  return { rows: rows.slice(0, 12), kids };
});
console.log(JSON.stringify(res, null, 2));
await browser.close();
