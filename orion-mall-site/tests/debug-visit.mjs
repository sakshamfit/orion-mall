/** debug: inside #visit, what extends past the viewport? */
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
  document.getElementById('visit').querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1) {
      rows.push(`${el.tagName}.${String(el.className).split(' ').slice(0, 2).join('.')} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
    }
  });
  return rows.slice(0, 10);
});
console.log(res.join('\n') || 'none');
await browser.close();
