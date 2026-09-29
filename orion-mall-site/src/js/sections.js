/**
 * sections.js — everything after the hero walkthrough (sections A–G).
 * Each section uses a different reveal so the page never feels repetitive:
 *   A  word-by-word colour fill + stat counters
 *   B  pinned horizontal gallery with magnetic tiles
 *   C  sticky parallax media + list items that highlight at viewport centre
 *   D  tilt-on-hover cards
 *   E  marquee ticker + staggered cards
 *   F  address/hours + validated contact form (front-end only)
 *   G  giant footer wordmark revealed with a clip-path wipe
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BRANDS, DINE, EVENTS } from '../content.js';
import { splitWords } from './split-text.js';
import { formatIndian, prefersReducedMotion } from './utils.js';

const INK = '#f3ead9';
const GOLD = '#e8b25a';
const INK_FAINT = '#8a7c68';

export function initSections() {
  const reduced = prefersReducedMotion();
  const cleanups = [];

  renderBrandTiles();
  renderDineList();
  renderEvents();

  /* ---------------- generic reveals (with a safety net) ---------------- */
  if (!reduced) {
    const reveal = (targets, vars) =>
      ScrollTrigger.batch(targets, {
        start: 'top 86%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, ...vars, overwrite: true }),
      });
    reveal('[data-reveal]', { duration: 0.9, stagger: 0.08, ease: 'power3.out' });
    reveal('[data-reveal-stagger] > *', { duration: 0.8, stagger: 0.1, ease: 'power3.out' });
  }
  // Safety net: nothing may stay invisible if a trigger never fires.
  const safety = window.setTimeout(() => {
    document.querySelectorAll('[data-reveal], [data-reveal-stagger] > *').forEach((el) => {
      if (parseFloat(getComputedStyle(el).opacity) < 0.05) {
        gsap.set(el, { opacity: 1, y: 0 });
      }
    });
  }, 4000);
  cleanups.push(() => window.clearTimeout(safety));

  /* ---------------- A. word-by-word colour fill ---------------- */
  const statement = document.querySelector('[data-words-fill]');
  if (statement && !reduced) {
    const words = splitWords(statement);
    const inners = [...words].map((w) => w.firstElementChild);
    inners.forEach((inner) => gsap.set(inner, { color: INK_FAINT }));
    const keyWords = ['Food,', 'Shopping', '&', 'Entertainment,', 'brands.'];
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: statement,
        start: 'top 78%',
        end: 'bottom 55%',
        scrub: 0.4,
      },
    });
    tl.to(inners, { color: INK, stagger: 0.35, ease: 'none', duration: 1 }, 0);
    inners.forEach((inner, i) => {
      const txt = inner.textContent.trim();
      if (keyWords.includes(txt)) {
        tl.to(inner, { color: GOLD, duration: 0.4, ease: 'none' }, 0.35 + i * 0.35 * 0.6);
      }
    });
  }

  /* ---------------- A. stat counters ---------------- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseInt(el.dataset.count, 10);
    if (Number.isNaN(end)) return;
    const run = () => {
      const o = { v: 0 };
      gsap.to(o, {
        v: end,
        duration: 1.7,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = formatIndian(o.v);
        },
      });
    };
    if (reduced) {
      el.textContent = formatIndian(end);
    } else {
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: run });
    }
  });

  /* ---------------- B. pinned horizontal gallery ---------------- */
  // The trigger (and therefore its pin-spacer) is created up-front so that
  // anchor links to sections below the gallery resolve to the right place even
  // before the user has scrolled there.
  const shopSection = document.getElementById('shop');
  const viewport = document.getElementById('shop-viewport');
  const track = document.getElementById('shop-track');
  if (shopSection && viewport && track && !reduced) {
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: shopSection,
        start: 'top top',
        end: () => `+=${distance() + window.innerHeight * 0.4}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { x: 0 });
    });
  }

  /* magnetic tiles (pointer-fine only, handled in cursor.js via data-magnetic) */

  /* ---------------- C. sticky parallax + centre highlight ---------------- */
  const media = document.querySelector('.dine__media-inner');
  if (media && !reduced) {
    const t = gsap.from(media, {
      yPercent: 14,
      scale: 1.08,
      ease: 'none',
      scrollTrigger: {
        trigger: '.dine__media',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
    cleanups.push(() => {
      t.scrollTrigger?.kill();
      t.kill();
    });
  }
  document.querySelectorAll('.dine__item').forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top center',
      end: 'bottom center',
      toggleClass: 'is-active',
    });
  });

  /* ---------------- D. tilt-on-hover ---------------- */
  if (!reduced) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const rotX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
      const rotY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
      const move = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rotX(-py * 9);
        rotY(px * 9);
      };
      const leave = () => {
        rotX(0);
        rotY(0);
      };
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerleave', leave);
        gsap.set(card, { rotationX: 0, rotationY: 0 });
      });
    });
  }

  /* ---------------- G. footer wordmark reveal ---------------- */
  const footerWord = document.getElementById('footer-word');
  if (footerWord && !reduced) {
    const t = gsap.fromTo(
      footerWord,
      { clipPath: 'inset(0 0 100% 0)', yPercent: 18 },
      {
        clipPath: 'inset(0 0 0% 0)',
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.footer',
          start: 'top 82%',
          end: 'bottom 65%',
          scrub: 0.5,
        },
      },
    );
    cleanups.push(() => {
      t.scrollTrigger?.kill();
      t.kill();
    });
  }

  /* ---------------- F. contact form validation ---------------- */
  initForm();

  /* ---------------- teardown ---------------- */
  return function teardown() {
    cleanups.forEach((fn) => fn());
  };
}

/* ------------------------------------------------------------------ */
/* renderers                                                          */
/* ------------------------------------------------------------------ */
function ph(text) {
  // placeholders arrive as <<NAME>> — render as a marked <span class="ph">
  const m = /^<<(.+)>>$/.exec(text);
  if (!m) return document.createTextNode(text);
  const span = document.createElement('span');
  span.className = 'ph';
  span.dataset.placeholder = m[1];
  span.title = `Placeholder: ${m[1]}`;
  span.textContent = text;
  return span;
}

function renderBrandTiles() {
  const track = document.getElementById('shop-track');
  if (!track) return;
  const frag = document.createDocumentFragment();
  BRANDS.forEach((brand, i) => {
    const li = document.createElement('li');
    li.className = 'tile';
    li.dataset.magnetic = '';

    const idx = document.createElement('span');
    idx.className = 'tile__idx';
    idx.textContent = String(i + 1).padStart(2, '0');

    const logo = document.createElement('span');
    logo.className = 'tile__logo';
    logo.setAttribute('aria-hidden', 'true');
    logo.textContent = 'logo';

    const name = document.createElement('p');
    name.className = 'tile__name';
    name.appendChild(ph(brand.name));

    const cat = document.createElement('p');
    cat.className = 'tile__cat';
    cat.appendChild(ph(brand.category));

    const floor = document.createElement('span');
    floor.className = 'tile__floor';
    floor.textContent = brand.floor;

    li.append(idx, logo, name, cat, floor);
    frag.appendChild(li);
  });
  track.appendChild(frag);
}

function renderDineList() {
  const list = document.getElementById('dine-list');
  if (!list) return;
  const frag = document.createDocumentFragment();
  DINE.venues.forEach((venue) => {
    const li = document.createElement('li');
    li.className = 'dine__item';

    const name = document.createElement('p');
    name.className = 'dine__item-name';
    const nameText = document.createElement('span');
    nameText.appendChild(ph(venue.name));
    const kind = document.createElement('span');
    kind.className = 'dine__item-kind';
    kind.appendChild(ph(venue.kind));
    name.append(nameText, kind);

    const note = document.createElement('p');
    note.className = 'dine__item-note';
    note.appendChild(ph(venue.note));

    li.append(name, note);
    frag.appendChild(li);
  });
  list.appendChild(frag);
}

function renderEvents() {
  const ticker = document.getElementById('events-ticker');
  if (ticker) {
    const frag = document.createDocumentFragment();
    const buildSet = () => {
      const set = document.createElement('span');
      EVENTS.ticker.forEach((offer) => {
        const s = document.createElement('span');
        s.appendChild(ph(offer));
        set.appendChild(s);
      });
      return set;
    };
    frag.append(buildSet(), buildSet()); // duplicated for the seamless -50% loop
    ticker.appendChild(frag);
  }
  const cards = document.getElementById('events-cards');
  if (cards) {
    const frag = document.createDocumentFragment();
    EVENTS.cards.forEach((card) => {
      const li = document.createElement('li');
      li.className = 'ecard2';
      const date = document.createElement('p');
      date.className = 'ecard2__date';
      date.appendChild(ph(card.date));
      const title = document.createElement('p');
      title.className = 'ecard2__title';
      title.appendChild(ph(card.title));
      const copy = document.createElement('p');
      copy.className = 'ecard2__copy';
      copy.appendChild(ph(card.copy));
      li.append(date, title, copy);
      frag.appendChild(li);
    });
    cards.appendChild(frag);
  }
}

/* ------------------------------------------------------------------ */
/* contact form (front-end only — no backend)                          */
/* ------------------------------------------------------------------ */
function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const fields = [
    {
      input: form.querySelector('#cf-name'),
      err: form.querySelector('#cf-name-err'),
      test: (v) => v.trim().length >= 2,
      msg: 'Please enter your name (2+ characters).',
    },
    {
      input: form.querySelector('#cf-email'),
      err: form.querySelector('#cf-email-err'),
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      msg: 'Please enter a valid email address.',
    },
    {
      input: form.querySelector('#cf-msg'),
      err: form.querySelector('#cf-msg-err'),
      test: (v) => v.trim().length >= 10,
      msg: 'Please write at least 10 characters.',
    },
  ];

  const validateField = (f, showOnValid = false) => {
    const ok = f.test(f.input.value);
    f.input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    f.err.textContent = ok ? (showOnValid ? '' : f.err.textContent) : f.msg;
    return ok;
  };

  fields.forEach((f) => {
    f.input.addEventListener('input', () => validateField(f));
    f.input.addEventListener('blur', () => validateField(f));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = fields.map((f) => validateField(f));
    if (results.every(Boolean)) {
      status.textContent = 'Thanks! This is a front-end demo — no message was actually sent.';
      form.reset();
      fields.forEach((f) => f.input.setAttribute('aria-invalid', 'false'));
    } else {
      status.textContent = 'Please fix the highlighted fields.';
      fields.find((f) => !f.test(f.input.value))?.input.focus();
    }
  });
}
