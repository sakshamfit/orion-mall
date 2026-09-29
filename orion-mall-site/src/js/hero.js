/**
 * hero.js — the "ENTER THE MALL" scroll experience.
 *
 * Pinned 100svh hero with a <canvas> playing the extracted image sequence,
 * scrubbed by one ScrollTrigger (pin + scrub 0.5). Text overlays run on a
 * single GSAP timeline driven by the same scroll progress.
 *
 * Reduced motion: no pin, no scrub — the poster frame stays as a static hero
 * and the overlays show without animation.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchManifest, chooseFrameSet, FrameLoader } from './frames.js';
import { splitChars, splitWords } from './split-text.js';
import { clamp, formatIndian, prefersReducedMotion, onResize, onIdle } from './utils.js';

const END = '+=600%'; // pin length — tuned for ~6 viewport-heights of walkthrough

export async function initHero({ loaderEl, fillEl, pctEl, posterEl, canvasEl, overlaysEl, floorsEl }) {
  const reduced = prefersReducedMotion();
  const canvas = canvasEl;
  const ctx = canvas.getContext('2d', { alpha: false });

  /* ---------------- frame manifest + loader ---------------- */
  let manifest;
  try {
    manifest = await fetchManifest();
  } catch (err) {
    console.error('[hero] frames.json failed to load', err);
    hideLoader(loaderEl);
    return null;
  }
  const set = chooseFrameSet(manifest);
  const loader = new FrameLoader(set);

  const setPercent = (p) => {
    if (fillEl) fillEl.style.width = `${p}%`;
    if (pctEl) pctEl.textContent = String(p);
  };
  setPercent(0);

  await loader.loadTier1(setPercent);

  if (!loader.frames[0]) {
    // nothing loaded at all — bail out to the static poster
    console.error('[hero] tier 1 failed to load');
    hideLoader(loaderEl);
    return null;
  }

  /* ---------------- canvas sizing (cover fit, DPR <= 2) ---------------- */
  let dpr = 1;
  let viewW = 0;
  let viewH = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    viewW = Math.max(1, rect.width);
    viewH = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    drawCurrent(); // no dropped frames on resize: immediate redraw
  }

  function drawFrame(img) {
    if (!img) return;
    const iw = img.width;
    const ih = img.height;
    if (!iw || !ih) return;
    // cover fit
    const scale = Math.max(canvas.width / iw, canvas.height / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ---------------- scroll state ---------------- */
  let progress = 0;
  let currentIndex = -1;
  let canvasReady = false;

  function frameIndexFor(p) {
    return Math.round(clamp(p, 0, 1) * (loader.total - 1));
  }

  function drawCurrent() {
    const idx = frameIndexFor(progress);
    if (idx === currentIndex && canvasReady) return; // skip redraw when unchanged
    const img = loader.get(idx); // holds last loaded frame if the user outran the loader
    if (!img) return;
    drawFrame(img);
    currentIndex = idx;
    if (!canvasReady) {
      canvasReady = true;
      canvas.classList.add('is-ready');
      posterEl?.classList.add('is-hidden');
    }
  }

  /* ---------------- overlays timeline ---------------- */
  const ovEls = [...overlaysEl.querySelectorAll('.ov')];
  const wordmarkSpans = overlaysEl.querySelectorAll('.ov[data-ov="1"] .ov__wordmark span');
  const chars = [];
  wordmarkSpans.forEach((s) => splitChars(s).forEach((c) => chars.push(c)));
  const countEl = document.getElementById('area-count');
  const counter = { v: 0 };

  const ov2Line = overlaysEl.querySelector('.ov[data-ov="2"] .ov__line');
  if (ov2Line) splitWords(ov2Line);

  const dots = [...floorsEl.querySelectorAll('.floors__dot')];
  const floorLabels = [...floorsEl.querySelectorAll('.floors__label')];

  const overlayTl = gsap.timeline({ paused: true });
  overlayTl.set(ovEls[0], { autoAlpha: 1 }, 0);
  overlayTl.from(chars, { yPercent: 115, duration: 0.035, stagger: 0.006, ease: 'power3.out' }, 0.005);
  overlayTl.from('.ov[data-ov="1"] .ov__city', { opacity: 0, y: 18, duration: 0.03 }, 0.03);
  overlayTl.from('.ov[data-ov="1"] .ov__cue', { opacity: 0, duration: 0.03 }, 0.045);
  overlayTl.to(ovEls[0], { autoAlpha: 0, duration: 0.04, ease: 'power2.in' }, 0.11);

  overlayTl.set(ovEls[1], { autoAlpha: 1 }, 0.155);
  overlayTl.from('.ov[data-ov="2"] .w', { opacity: 0, duration: 0.02 }, 0.155);
  overlayTl.from(
    [...overlaysEl.querySelectorAll('.ov[data-ov="2"] .w-in')],
    { yPercent: 115, duration: 0.04, stagger: 0.012, ease: 'power3.out' },
    0.155,
  );
  overlayTl.to(ovEls[1], { autoAlpha: 0, duration: 0.04, ease: 'power2.in' }, 0.29);

  overlayTl.set(ovEls[2], { autoAlpha: 1 }, 0.345);
  const tripleSpans = [...overlaysEl.querySelectorAll('.ov[data-ov="3"] span')];
  overlayTl.from(tripleSpans, { opacity: 0, y: 40, duration: 0.035, stagger: 0.02, ease: 'power3.out' }, 0.345);
  tripleSpans.forEach((s, i) => {
    overlayTl.call(() => s.classList.add('is-hot'), null, 0.4 + i * 0.045);
    if (i < tripleSpans.length - 1) {
      overlayTl.call(() => s.classList.remove('is-hot'), null, 0.44 + i * 0.045);
    }
  });
  overlayTl.to(ovEls[2], { autoAlpha: 0, duration: 0.04, ease: 'power2.in' }, 0.53);

  overlayTl.set(ovEls[3], { autoAlpha: 1 }, 0.6);
  overlayTl.from('.ov[data-ov="4"]', { opacity: 0, scale: 0.94, duration: 0.035, ease: 'power2.out' }, 0.6);
  overlayTl.to(
    counter,
    {
      v: 200000,
      duration: 0.16,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (countEl) countEl.textContent = formatIndian(counter.v);
      },
    },
    0.62,
  );
  overlayTl.to(ovEls[3], { autoAlpha: 0, duration: 0.05, ease: 'power2.in' }, 0.86);

  /* ---------------- floors indicator ---------------- */
  function updateFloors(p) {
    const floor = clamp(Math.floor(p * 3), 0, 2);
    dots.forEach((d, i) => {
      const active = Math.floor(i / 2) === floor;
      d.classList.toggle('is-active', active);
    });
    floorLabels.forEach((l, i) => {
      l.style.color = i === floor ? 'var(--gold)' : '';
    });
  }

  /* ---------------- main ScrollTrigger ---------------- */
  let st;
  let tickerCb;

  if (!reduced) {
    resizeCanvas();
    drawCurrent();

    st = ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: END,
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        progress = self.progress;
        drawCurrent();
      },
      onUpdate: (self) => {
        progress = self.progress;
        overlayTl.progress(self.progress);
        updateFloors(self.progress);
      },
    });

    // Redraw on the GSAP ticker, but only when the frame index actually changed.
    tickerCb = () => drawCurrent();
    gsap.ticker.add(tickerCb);

    // Start streaming the remaining frames immediately — scroll works while
    // they arrive (drawCurrent holds the last loaded frame if needed).
    loader.streamRest(
      () => {
        if (loader.readyToReveal) hideLoader(loaderEl);
        // once every frame is in, refresh so pin measurements are exact
        if (loader.loadedCount === loader.total) ScrollTrigger.refresh();
      },
      (fn) => onIdle(fn, 250),
    );
    // Safety: never keep the loader up longer than 6s even on a bad network.
    const failSafe = window.setTimeout(() => hideLoader(loaderEl), 6000);
    hideLoader.onFailSafe = failSafe;
  } else {
    // reduced motion: static poster hero, first overlay only, no canvas work
    progress = 0;
    overlayTl.progress(0.02);
    updateFloors(0);
    hideLoader(loaderEl);
  }

  /* ---------------- reveal loader as soon as we may ---------------- */
  if (loader.readyToReveal) hideLoader(loaderEl);

  const offResize = onResize(() => {
    if (reduced) return;
    resizeCanvas();
    ScrollTrigger.refresh();
  });

  /* ---------------- teardown ---------------- */
  return function teardown() {
    offResize();
    loader.cancel();
    if (tickerCb) gsap.ticker.remove(tickerCb);
    if (st) st.kill();
    overlayTl.kill();
    if (hideLoader.onFailSafe) window.clearTimeout(hideLoader.onFailSafe);
  };
}

function hideLoader(loaderEl) {
  if (!loaderEl || loaderEl.dataset.hidden === '1') return;
  loaderEl.dataset.hidden = '1';
  const done = () => {
    loaderEl.style.transition = 'opacity .6s ease, visibility .6s';
    loaderEl.style.opacity = '0';
    loaderEl.style.visibility = 'hidden';
    document.body.removeAttribute('aria-busy');
    loaderEl.addEventListener(
      'transitionend',
      () => {
        loaderEl.remove();
      },
      { once: true },
    );
  };
  if (prefersReducedMotion()) {
    done();
  } else {
    gsap.to(loaderEl, {
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power2.inOut',
      onComplete: () => {
        loaderEl.style.visibility = 'hidden';
        document.body.removeAttribute('aria-busy');
        loaderEl.remove();
      },
    });
  }
}
