/**
 * frames.js — hero image-sequence loading.
 *
 * - Fetches public/frames.json (written by scripts/build-frames.mjs) so the
 *   frame count is NEVER hardcoded.
 * - Chooses the desktop or mobile set from viewport width + connection.
 * - Tiered loading: tier 1 (first 10 frames) gates the loading screen; the
 *   rest streams in background chunks so scrolling works immediately.
 * - If the user outruns the loader, the last loaded frame is held.
 */

const TIER1_SIZE = 10;
const CHUNK_SIZE = 8;

export async function fetchManifest(url = '/frames.json') {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`frames.json: HTTP ${res.status}`);
  return res.json();
}

/** Pick a frame set: mobile-sized frames on small screens / slow networks. */
export function chooseFrameSet(manifest) {
  const conn = navigator.connection || {};
  const slow = conn.effectiveType && /(^|-)(2g|slow-2g)$/.test(conn.effectiveType);
  const narrow = window.matchMedia('(max-width: 767px)').matches;
  const wantMobile = (narrow || slow || conn.saveData) && manifest.mobile;
  const set = wantMobile ? manifest.mobile : manifest.desktop;
  const digits = set.digits ?? 4;
  return {
    name: wantMobile ? 'mobile' : 'desktop',
    count: set.count,
    url: (i) => `/${set.dir}/f_${String(i + 1).padStart(digits, '0')}.webp`,
  };
}

const supportsBitmap = 'createImageBitmap' in window;

async function loadOne(url) {
  if (supportsBitmap) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const blob = await res.blob();
    return await createImageBitmap(blob);
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`${url}: load error`));
    img.src = url;
  });
}

export class FrameLoader {
  constructor(set) {
    this.set = set;
    this.frames = new Array(set.count).fill(null);
    this.failed = new Array(set.count).fill(false);
    this.loadedCount = 0;
    this.tier1Done = false;
    this._cancelled = false;
  }

  get total() {
    return this.set.count;
  }

  /** Frame at index i, or the closest loaded frame before it (never null after tier 1). */
  get(i) {
    if (this.frames[i]) return this.frames[i];
    for (let j = Math.min(i, this.frames.length - 1); j >= 0; j--) {
      if (this.frames[j]) return this.frames[j];
    }
    return null;
  }

  /** Weighted progress used by the loading screen: tier 1 = 70%, rest = 30%. */
  get percent() {
    const restTotal = this.total - TIER1_SIZE;
    const restLoaded = Math.max(0, this.loadedCount - TIER1_SIZE);
    const t1 = Math.min(this.loadedCount, TIER1_SIZE) / TIER1_SIZE;
    const r = restTotal > 0 ? restLoaded / restTotal : 1;
    return Math.round((t1 * 0.7 + r * 0.3) * 100);
  }

  /** The loading screen may hide once tier 1 is done and 30% of the rest is in. */
  get readyToReveal() {
    if (!this.tier1Done) return false;
    const restTotal = this.total - TIER1_SIZE;
    const restLoaded = Math.max(0, this.loadedCount - TIER1_SIZE);
    return restTotal <= 0 || restLoaded >= Math.ceil(restTotal * 0.3);
  }

  /** Loads the first TIER1_SIZE frames. Resolves even if some fail. */
  async loadTier1(onProgress) {
    const n = Math.min(TIER1_SIZE, this.total);
    await Promise.all(
      Array.from({ length: n }, (_, i) =>
        loadOne(this.set.url(i))
          .then((img) => {
            this.frames[i] = img;
            this.loadedCount++;
            onProgress?.(this.percent);
          })
          .catch(() => {
            this.failed[i] = true;
          }),
      ),
    );
    // If some tier-1 frames failed, retry them once before giving up.
    const missing = [];
    for (let i = 0; i < n; i++) if (!this.frames[i]) missing.push(i);
    if (missing.length) {
      await Promise.all(
        missing.map((i) =>
          loadOne(this.set.url(i))
            .then((img) => {
              this.frames[i] = img;
              this.loadedCount++;
              onProgress?.(this.percent);
            })
            .catch(() => {
              this.failed[i] = true;
            }),
        ),
      );
    }
    this.tier1Done = true;
    onProgress?.(this.percent);
    return this;
  }

  /** Streams the remaining frames in background chunks during idle time. */
  streamRest(onProgress, onIdleFn) {
    let next = TIER1_SIZE;
    const step = () => {
      if (this._cancelled || next >= this.total) return;
      const end = Math.min(next + CHUNK_SIZE, this.total);
      const jobs = [];
      for (let i = next; i < end; i++) {
        jobs.push(
          loadOne(this.set.url(i))
            .then((img) => {
              this.frames[i] = img;
              this.loadedCount++;
              onProgress?.(this.percent);
            })
            .catch(() => {
              this.failed[i] = true;
            }),
        );
      }
      next = end;
      Promise.all(jobs).then(() => {
        if (!this._cancelled) onIdleFn(step, 200);
      });
    };
    if (next < this.total) onIdleFn(step, 200);
  }

  cancel() {
    this._cancelled = true;
  }
}
