/**
 * cursor.js — desktop-only custom cursor (dot + ring, grows over links)
 * plus a subtle magnetic pull on [data-magnetic] elements.
 */
import gsap from 'gsap';
import { isTouch, prefersReducedMotion } from './utils.js';

export function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || isTouch() || prefersReducedMotion()) return () => {};

  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const reduced = prefersReducedMotion();

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

  const onMove = (e) => {
    mx = e.clientX;
    my = e.clientY;
    dotX(mx);
    dotY(my);
    ringX(mx);
    ringY(my);
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const onOver = (e) => {
    const interactive = e.target.closest('a, button, input, textarea, [data-cursor="link"]');
    cursor.classList.toggle('is-link', !!interactive);
  };
  document.addEventListener('pointerover', onOver, { passive: true });

  const onDown = () => cursor.classList.add('is-down');
  const onUp = () => cursor.classList.remove('is-down');
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);

  /* ---------- magnetic hover ---------- */
  const magnets = [...document.querySelectorAll('[data-magnetic]')];
  const cleanups = magnets.map((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    const move = (e) => {
      if (reduced) return;
      const r = el.getBoundingClientRect();
      const relX = e.clientX - (r.left + r.width / 2);
      const relY = e.clientY - (r.top + r.height / 2);
      xTo(relX * 0.28);
      yTo(relY * 0.28);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  });

  return function teardown() {
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerover', onOver);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    cleanups.forEach((fn) => fn());
  };
}
