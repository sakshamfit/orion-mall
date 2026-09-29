/** debug: min-content widths inside #visit */
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
  const probe = (el) => {
    const prev = el.style.width;
    el.style.width = 'min-content';
    const w = el.getBoundingClientRect().width;
    el.style.width = prev;
    return Math.round(w);
  };
  const rows = [];
  const visit = document.getElementById('visit');
  visit.querySelectorAll('*').forEach((el) => {
    if (el.children.length === 0 || el.tagName === 'ADDRESS' || el.tagName === 'DL' || el.tagName === 'P' || el.tagName === 'UL') {
      const mc = probe(el);
      if (mc > 360) rows.push(`${el.tagName}.${String(el.className).split(' ').slice(0, 2).join('.')} min-content=${mc} text="${(el.textContent || '').trim().slice(0, 40)}"`);
    }
  });
  return rows.slice(0, 12);
});
console.log(res.join('\n') || 'none > 360');
await browser.close();
