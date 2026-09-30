/**
 * audit.mjs — runs Lighthouse (mobile + desktop) against a local preview
 * server and prints a markdown results table for AUDIT.md.
 *
 * Usage:
 *   npm run build && npx vite preview --port 4173 &
 *   node tests/audit.mjs
 *
 * Chrome binary: set CHROME_PATH (defaults to /tmp/chrome2 in the dev sandbox).
 * Fonts are self-hosted, so nothing has to be blocked: the audit measures the
 * page exactly as a visitor receives it.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const FLAGS =
  '--no-sandbox --no-zygote --disable-dev-shm-usage --enable-unsafe-swiftshader --use-angle=swiftshader';

function run(formFactor) {
  const out = join(mkdtempSync(join(tmpdir(), 'lh-')), 'report.json');
  const args = [
    'lighthouse',
    BASE,
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    `--output-path=${out}`,
    '--quiet',
    `--chrome-flags=${FLAGS}`,
  ];
  if (formFactor === 'mobile') args.push('--form-factor=mobile');
  else args.push('--preset=desktop');
  execFileSync('npx', args, { stdio: 'inherit' });
  const r = JSON.parse(readFileSync(out, 'utf8'));
  const c = r.categories;
  const a = r.audits;
  return {
    formFactor,
    perf: Math.round((c.performance.score ?? 0) * 100),
    a11y: Math.round((c.accessibility.score ?? 0) * 100),
    bp: Math.round((c['best-practices'].score ?? 0) * 100),
    seo: Math.round((c.seo.score ?? 0) * 100),
    fcp: a['first-contentful-paint'].displayValue,
    lcp: a['largest-contentful-paint'].displayValue,
    cls: a['cumulative-layout-shift'].displayValue,
    tbt: a['total-blocking-time'].displayValue,
    si: a['speed-index'].displayValue,
  };
}

const rows = [run('mobile'), run('desktop')];
const fmt = (r) =>
  [
    `| ${r.formFactor} | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} | ${r.fcp} | ${r.lcp} | ${r.cls} | ${r.tbt} | ${r.si} |`,
  ].join('\n');

console.log(
  '\n| Profile | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT | Speed Index |',
);
console.log('|---|---|---|---|---|---|---|---|---|---|');
rows.forEach((r) => console.log(fmt(r)));
