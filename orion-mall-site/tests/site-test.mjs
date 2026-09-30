/**
 * site-test.mjs — automated functional + performance checks for the built site.
 * Run:  LD_LIBRARY_PATH=/tmp/al2023/lib node tests/site-test.mjs
 * (expects `vite preview` on http://127.0.0.1:4173 and Chromium at /tmp/chrome2)
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'tests', 'screens');
const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const CHROME = process.env.CHROME || '/tmp/chrome2';

mkdirSync(SHOTS, { recursive: true });

const results = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(browser, { width = 1440, height = 900, reduced = false, hiConcurrency = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const console_ = [];
  // Google Fonts CDN is unreachable from this sandbox; abort those requests so
  // they don't pollute the console (real users load them normally).
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) {
      req.respond({ status: 200, contentType: 'text/css', body: '' });
    } else req.continue();
  });
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) console_.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => console_.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => console_.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`));
  // CLS collection from the very first byte
  await page.evaluateOnNewDocument(() => {
    window.__cls = 0;
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__cls += entry.value;
          window.__shifts.push({
            value: entry.value,
            t: Math.round(entry.startTime),
            src: entry.sources?.[0]?.node?.nodeName,
          });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  if (hiConcurrency) {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    });
  }
  return { page, console_ };
}

async function waitForLoaderGone(page, timeout = 20000) {
  const t0 = Date.now();
  try {
    await page.waitForFunction(() => !document.getElementById('loader'), { timeout, polling: 200 });
  } catch {
    return { gone: false, ms: Date.now() - t0 };
  }
  return { gone: true, ms: Date.now() - t0 };
}

async function scrollTo(page, y, steps = 30) {
  await page.evaluate(
    async (target, steps) => {
      const start = window.scrollY;
      for (let i = 1; i <= steps; i++) {
        window.scrollTo(0, start + ((target - start) * i) / steps);
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 16)));
      }
    },
    y,
    steps,
  );
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
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
      '--font-render-hinting=none',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    /* ============ 1. Desktop load + console cleanliness ============ */
    {
      const { page, console_ } = await newPage(browser);
      const resp = await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
      record('page loads HTTP 200', resp.status() === 200, `status ${resp.status()}`);
      const loader = await waitForLoaderGone(page);
      record('loader hides after tier1 + 30%', loader.gone, `${loader.ms}ms`);
      await sleep(1200);

      record('no console errors/warnings', console_.length === 0, console_.slice(0, 4).join(' | '));

      const cls = await page.evaluate(() => window.__cls || 0);
      record('CLS < 0.05', cls < 0.05, `CLS=${cls.toFixed(4)}`);

      /* payload transferred before the loader hid */
      const payload = await page.evaluate(() => {
        const res = performance.getEntriesByType('resource');
        const doc = performance.getEntriesByType('navigation')[0];
        const t = window.__loaderHiddenAt ?? Infinity;
        let bytes = doc ? doc.transferSize : 0;
        for (const r of res) {
          if (r.startTime <= t) bytes += r.transferSize || 0;
        }
        return bytes;
      });
      record(
        'initial payload before loader < 2.5 MB',
        payload < 2.5 * 1024 * 1024,
        `${(payload / 1048576).toFixed(2)} MB`,
      );

      /* scrub frame-rate probe: rAF deltas while scrolling through the pin */
      const fps = await page.evaluate(async () => {
        const deltas = [];
        let last = performance.now();
        let frames = 0;
        const vh = window.innerHeight;
        return await new Promise((resolve) => {
          const tick = () => {
            const now = performance.now();
            deltas.push(now - last);
            last = now;
            frames++;
            const target = vh * 6 * 0.5;
            if (window.scrollY < target) {
              window.scrollTo(0, Math.min(target, window.scrollY + 60));
              requestAnimationFrame(tick);
            } else {
              deltas.sort((a, b) => a - b);
              const median = deltas[Math.floor(deltas.length / 2)];
              resolve({ medianDelta: Math.round(median * 10) / 10, frames });
            }
          };
          requestAnimationFrame(tick);
        });
      });
      console.log(
        `INFO  scrub median frame time: ${fps.medianDelta}ms (~${Math.round(1000 / fps.medianDelta)}fps) over ${fps.frames} frames`,
      );

      const hero = await page.evaluate(() => {
        const c = document.getElementById('hero-canvas');
        const r = c.getBoundingClientRect();
        return { w: r.width, h: r.height, cw: c.width, ready: c.classList.contains('is-ready') };
      });
      record('hero canvas sized + ready', hero.ready && hero.cw > 0 && hero.w > 800, JSON.stringify(hero));

      await page.screenshot({ path: join(SHOTS, '01-desktop-hero.png') });

      /* ============ 2. Scroll scrub behaviour ============ */
      const sample = async () =>
        page.evaluate(() => {
          const c = document.getElementById('hero-canvas');
          const d = c.toDataURL();
          let h = 0;
          for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) | 0;
          return `${d.length}:${h}`;
        });
      const s0 = await sample();
      const docHeight = await page.evaluate(() => document.body.scrollHeight);
      const heroPin = await page.evaluate(() => window.innerHeight * 6);
      const vh = await page.evaluate(() => window.innerHeight);
      await scrollTo(page, heroPin * 0.35, 40);
      await sleep(400);
      const s1 = await sample();
      await page.screenshot({ path: join(SHOTS, '02-desktop-scrub-mid.png') });
      record('scrub changes canvas frames', s0 !== s1);

      // overlay state at ~35% of the hero pin
      const ovState = await page.evaluate(() => {
        const vis = [...document.querySelectorAll('.ov')].map((el) => getComputedStyle(el).opacity);
        return vis;
      });
      record(
        'overlays animated (one visible mid-scroll)',
        ovState.filter((o) => parseFloat(o) > 0.5).length === 1,
        JSON.stringify(ovState),
      );

      await scrollTo(page, heroPin + vh * 1.5, 40);
      await sleep(300);
      const inSections = await page.evaluate(() => {
        const about = document.getElementById('about');
        return about.getBoundingClientRect().top < window.innerHeight * 0.5;
      });
      record('scrolled into content sections', inSections);

      /* ============ 3. Fast flick ============ */
      for (let i = 0; i < 8; i++) {
        await page.mouse.wheel({ deltaY: i % 2 ? -2500 : 2500 });
        await sleep(30);
      }
      await sleep(600);
      const afterFlick = await page.evaluate(() => document.documentElement.scrollWidth);
      const vw = await page.evaluate(() => window.innerWidth);
      record('no horizontal scroll after fast flick', afterFlick <= vw + 1, `${afterFlick}px vs ${vw}`);
      const errsAfterFlick = console_.filter((m) => m.startsWith('error') || m.startsWith('pageerror'));
      record(
        'no errors after fast flick',
        errsAfterFlick.length === 0,
        errsAfterFlick.slice(0, 2).join(' | '),
      );

      /* ============ 4. Resize mid-scroll ============ */
      await page.setViewport({ width: 1024, height: 768 });
      await sleep(700);
      const canvasResized = await page.evaluate(() => {
        const c = document.getElementById('hero-canvas');
        return c.width > 0 && Math.abs(c.getBoundingClientRect().width - window.innerWidth) < 2;
      });
      record('canvas resizes correctly', canvasResized);
      await scrollTo(page, heroPin * 0.5, 20);
      await sleep(400);
      const errsAfterResize = console_.filter((m) => m.startsWith('error') || m.startsWith('pageerror'));
      record(
        'no errors after resize mid-scroll',
        errsAfterResize.length === 0,
        errsAfterResize.slice(0, 2).join(' | '),
      );

      /* ============ 5. Reload while scrolled ============ */
      await page.setViewport({ width: 1440, height: 900 });
      await scrollTo(page, 4000, 10);
      await page.reload({ waitUntil: 'load' });
      const loader2 = await waitForLoaderGone(page);
      record('reload while scrolled works', loader2.gone, `${loader2.ms}ms`);
      const errsAfterReload = console_.filter((m) => m.startsWith('error') || m.startsWith('pageerror'));
      record('no errors after reload', errsAfterReload.length === 0, errsAfterReload.slice(0, 2).join(' | '));

      /* ============ 6. Memory growth over 3 scroll cycles ============ */
      const heap = async () => (await page.metrics()).JSHeapUsedSize;
      await scrollTo(page, docHeight, 25);
      await sleep(500);
      await scrollTo(page, 0, 25);
      await sleep(500);
      const h0 = await heap();
      for (let cycle = 0; cycle < 3; cycle++) {
        await scrollTo(page, docHeight, 25);
        await sleep(300);
        await scrollTo(page, 0, 25);
        await sleep(300);
      }
      const h1 = await heap();
      const growth = ((h1 - h0) / Math.max(1, h0)) * 100;
      record(
        'memory growth < 25% over 3 cycles',
        growth < 25,
        `${h0} -> ${h1} bytes (${growth.toFixed(1)}%)`,
      );

      // (CLS is a load-time metric — measured above before any interaction;
      // user-driven scrolls/resizes legitimately shift layout and are excluded
      // from the Lighthouse-style score.)
      const finalConsole = console_.filter(
        (m) => m.startsWith('error') || m.startsWith('pageerror') || m.startsWith('warning'),
      );
      record(
        'zero console errors/warnings (full session)',
        finalConsole.length === 0,
        finalConsole.slice(0, 3).join(' | '),
      );
      await page.close();
    }

    /* ============ 7. Responsive sweep ============ */
    for (const [w, h] of [
      [360, 780],
      [768, 1024],
      [1024, 800],
      [1440, 900],
      [1920, 1080],
    ]) {
      const { page, console_ } = await newPage(browser, { width: w, height: h });
      await page.goto(BASE, { waitUntil: 'load' });
      await waitForLoaderGone(page);
      await sleep(800);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      record(`no horizontal scroll @${w}`, sw <= w + 1, `scrollWidth=${sw}`);
      await scrollTo(page, await page.evaluate(() => document.body.scrollHeight * 0.6), 15);
      await sleep(300);
      await page.screenshot({ path: join(SHOTS, `responsive-${w}.png`) });
      const errs = console_.filter((m) => m.startsWith('error') || m.startsWith('pageerror'));
      record(`no console errors @${w}`, errs.length === 0, errs.slice(0, 2).join(' | '));
      await page.close();
    }

    /* ============ 8. Slow 4G + 4x CPU throttling ============ */
    {
      const { page, console_ } = await newPage(browser);
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        latency: 150,
      });
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const t0 = Date.now();
      await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
      const loader = await waitForLoaderGone(page, 30000);
      const ms = Date.now() - t0;
      record('loader hides on Slow 4G + 4x CPU', loader.gone, `${ms}ms total`);
      await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await sleep(1000);
      const errs = console_.filter((m) => m.startsWith('error') || m.startsWith('pageerror'));
      record('no errors on throttled load', errs.length === 0, errs.slice(0, 2).join(' | '));
      await page.screenshot({ path: join(SHOTS, 'slow4g-hero.png') });
      await page.close();
    }

    /* ============ 9. Reduced motion ============ */
    {
      const { page, console_ } = await newPage(browser, { reduced: true });
      await page.goto(BASE, { waitUntil: 'load' });
      await sleep(1500);
      const state = await page.evaluate(() => {
        const poster = document.getElementById('hero-poster');
        const canvas = document.getElementById('hero-canvas');
        const aboutOpacity = getComputedStyle(document.querySelector('[data-words-fill]')).opacity;
        const kickerOpacity = getComputedStyle(document.querySelector('.kicker')).opacity;
        return {
          posterVisible: getComputedStyle(poster).opacity === '1' && !poster.classList.contains('is-hidden'),
          canvasHidden: getComputedStyle(canvas).opacity === '0',
          aboutOpacity,
          kickerOpacity,
        };
      });
      record(
        'reduced-motion: static poster hero',
        state.posterVisible && state.canvasHidden,
        JSON.stringify(state),
      );
      record(
        'reduced-motion: content readable',
        parseFloat(state.aboutOpacity) > 0.9 && parseFloat(state.kickerOpacity) > 0.9,
      );
      await scrollTo(page, 3000, 20);
      const stillStatic = await page.evaluate(
        () => document.getElementById('hero-poster').classList.contains('is-hidden') === false,
      );
      record('reduced-motion: hero stays static on scroll', stillStatic);
      const errs = console_.filter((m) => m.startsWith('error') || m.startsWith('pageerror'));
      record('reduced-motion: no console errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await page.screenshot({ path: join(SHOTS, 'reduced-motion.png') });
      await page.close();
    }

    /* ============ 10. Ambient WebGL layer (forced on) ============ */
    {
      const { page } = await newPage(browser, { hiConcurrency: true });
      await page.goto(BASE, { waitUntil: 'load' });
      await waitForLoaderGone(page);
      await scrollTo(page, await page.evaluate(() => window.innerHeight * 7), 25);
      await sleep(1800);
      const ambient = await page.evaluate(() => {
        const c = document.getElementById('ambient-canvas');
        return { w: c.width, h: c.height, display: getComputedStyle(c).display };
      });
      record(
        'ambient WebGL canvas active (hi-concurrency)',
        ambient.w > 0 && ambient.display !== 'none',
        JSON.stringify(ambient),
      );
      // low-end device -> disabled
      const { page: p2, console_: console2 } = await newPage(browser);
      await p2.goto(BASE, { waitUntil: 'load' });
      await waitForLoaderGone(p2);
      await scrollTo(p2, await p2.evaluate(() => window.innerHeight * 7), 25);
      await sleep(1200);
      const disabled = await p2.evaluate(
        () => getComputedStyle(document.getElementById('ambient-canvas')).display === 'none',
      );
      record('ambient disabled on low-end device', disabled);
      const errs = console2.filter((m) => m.startsWith('error') || m.startsWith('pageerror'));
      record('ambient: no console errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await p2.close();
      await page.close();
    }

    /* ============ 11. Anchor navigation ============ */
    {
      const { page, console_ } = await newPage(browser);
      await page.goto(BASE, { waitUntil: 'load' });
      await waitForLoaderGone(page);
      await sleep(1200); // let the deferred sections init run
      await page.click('.nav__links a[href="#dine"]');
      await sleep(2200);
      const landed = await page.evaluate(() => {
        const dine = document.getElementById('dine');
        const r = dine.getBoundingClientRect();
        return Math.abs(r.top) < window.innerHeight * 0.35;
      });
      record('nav anchor scrolls to the right section', landed);
      const errs = console_.filter((m) => m.startsWith('error') || m.startsWith('pageerror'));
      record('anchor nav: no console errors', errs.length === 0, errs.slice(0, 2).join(' | '));
      await page.close();
    }

    /* ============ 12. Teardown handle ============ */
    {
      const { page } = await newPage(browser);
      await page.goto(BASE, { waitUntil: 'load' });
      await waitForLoaderGone(page);
      await sleep(800);
      const before = await page.evaluate(() => (window.__orionDebug ? window.__orionDebug().triggers : -1));
      await page.evaluate(() => window.__orionTeardown && window.__orionTeardown());
      await sleep(300);
      const after = await page.evaluate(() => (window.__orionDebug ? window.__orionDebug().triggers : -1));
      record(
        'teardown kills all ScrollTriggers',
        after === 0 && before > 0,
        `before=${before} after=${after}`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }

  /* ============ summary ============ */
  const failed = results.filter((r) => !r.pass);
  writeFileSync(join(ROOT, 'tests', 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach((f) => console.log(` - ${f.name}: ${f.detail}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('test harness crashed:', err);
  process.exitCode = 1;
});
