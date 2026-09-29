/**
 * main.js — bootstrap: Lenis smooth scroll synced to the GSAP ticker,
 * then the hero walkthrough, nav, cursor, sections and ambient WebGL layer.
 */
import '../css/tokens.css';
import '../css/base.css';
import '../css/loader.css';
import '../css/nav.css';
import '../css/cursor.css';
import '../css/hero.css';
import '../css/sections.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { initHero } from './hero.js';
import { initNav } from './nav.js';
import { initCursor } from './cursor.js';
import { initSections } from './sections.js';
// three-layer is code-split below (dynamic import) so three.js lands in a lazy
// chunk and the initial payload stays small.

gsap.registerPlugin(ScrollTrigger);

const teardowns = [];
let lenis = null;

async function boot() {
  document.documentElement.dataset.env = import.meta.env.DEV ? 'dev' : 'production';
  document.body.setAttribute('aria-busy', 'true');

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Lenis + GSAP ticker sync ---------- */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- hero (async: waits for tier-1 frames) ---------- */
  const heroTeardown = await initHero({
    loaderEl: document.getElementById('loader'),
    fillEl: document.getElementById('loader-fill'),
    pctEl: document.getElementById('loader-pct'),
    posterEl: document.getElementById('hero-poster'),
    canvasEl: document.getElementById('hero-canvas'),
    overlaysEl: document.getElementById('hero-overlays'),
    floorsEl: document.getElementById('floors'),
  });
  if (heroTeardown) teardowns.push(heroTeardown);

  /* ---------- the rest ---------- */
  teardowns.push(initNav({ lenis }));
  teardowns.push(initCursor());
  teardowns.push(initSections());

  /* ---------- ambient WebGL (lazy chunk) ---------- */
  import('./three-layer.js')
    .then(({ initAmbient }) => {
      teardowns.push(initAmbient());
    })
    .catch((err) => console.warn('[ambient] failed to initialise', err));

  // Everything that affects measurements is in place: refresh once.
  ScrollTrigger.refresh();

  // Expose a teardown handle + debug counters (used by the test harness).
  window.__orionDebug = () => ({
    triggers: ScrollTrigger.getAll().length,
    lenis: !!lenis,
    frames: window.__frameCount ?? null,
  });
  window.__orionTeardown = () => {
    teardowns.forEach((fn) => fn());
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
    ScrollTrigger.getAll().forEach((st) => st.kill());
  };
}

boot();

/* HMR: tear everything down before re-running. */
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.__orionTeardown?.();
    delete window.__orionTeardown;
  });
}
