/**
 * build-frames.mjs — auto-detects the hero frame sequences and writes
 * public/frames.json. The app NEVER hardcodes the frame count: it fetches
 * this file at runtime.
 *
 * Run automatically by `npm run dev` and `npm run build`.
 */
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

/** Lists a frame folder and returns the sequence metadata. */
function scanDir(relDir, digits) {
  const dir = join(PUBLIC, relDir);
  if (!existsSync(dir)) return null;
  const re = new RegExp(`^f_(\\d{${digits}})\\.webp$`);
  const nums = readdirSync(dir)
    .map((f) => {
      const m = f.match(re);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter((n) => n !== null)
    .sort((a, b) => a - b);
  if (nums.length === 0) return null;
  // verify the sequence is contiguous from 1
  const contiguous = nums.every((n, i) => n === i + 1);
  if (!contiguous) {
    console.warn(
      `[build-frames] WARNING: ${relDir} has a non-contiguous sequence (${nums.length} files, first=${nums[0]}, last=${nums[nums.length - 1]}). Using detected count anyway.`,
    );
  }
  return {
    dir: relDir,
    count: nums.length,
    first: nums[0],
    last: nums[nums.length - 1],
    digits,
    pattern: (i) => `${relDir}/f_${String(i + 1).padStart(digits, '0')}.webp`,
  };
}

const desktop = scanDir('frames', 4);
const mobile = scanDir('frames-m', 4);

if (!desktop) {
  console.error('[build-frames] No frames found in public/frames. Run `npm run generate:frames` first.');
  process.exit(1);
}

const manifest = {
  generatedBy: 'scripts/build-frames.mjs',
  desktop: { count: desktop.count, digits: desktop.digits, dir: desktop.dir },
  mobile: mobile ? { count: mobile.count, digits: mobile.digits, dir: mobile.dir } : null,
};

writeFileSync(join(PUBLIC, 'frames.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `[build-frames] desktop=${manifest.desktop.count}` +
    (manifest.mobile ? ` mobile=${manifest.mobile.count}` : ' mobile=(none, desktop will be used)'),
  '-> public/frames.json',
);
