/** debug: which element's scrollWidth exceeds its client width (unclipped)? */
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
  const out = [];
  const walk = (el, depth) => {
    const s = getComputedStyle(el);
    const clips = ['hidden', 'clip', 'auto', 'scroll'].includes(s.overflowX);
    if (!clips && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      out.push(`${'  '.repeat(depth)}${el.tagName}.${String(el.className).split(' ').slice(0, 2).join('.')} sw=${el.scrollWidth} cw=${el.clientWidth}`);
    }
    [...el.children].forEach((c) => walk(c, depth + 1));
  };
  walk(document.documentElement, 0);
  return out.slice(0, 25);
});
console.log(info.join('\n') || 'no unclipped overflow');
await browser.close();
