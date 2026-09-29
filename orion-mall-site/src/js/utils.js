/** utils.js — small shared helpers. */

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Low-end / data-saving devices get the cheap experience. */
export const isLowEnd = () => {
  if (navigator.connection && navigator.connection.saveData) return true;
  if ((navigator.hardwareConcurrency ?? 8) <= 4) return true;
  if (navigator.deviceMemory && navigator.deviceMemory <= 4) return true;
  return false;
};

/** Coarse pointer / touch device? */
export const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

/** Indian-format grouping: 200000 -> "2,00,000". */
export function formatIndian(n) {
  const s = Math.round(n).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** requestIdleCallback with a timeout fallback. */
export function onIdle(cb, timeout = 400) {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(cb, 120);
  return () => window.clearTimeout(id);
}

/** rAF-throttled resize handler. */
export function onResize(fn) {
  let raf = 0;
  const handler = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fn);
  };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}

/** Debounce. */
export function debounce(fn, ms) {
  let t = 0;
  return (...args) => {
    clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}
