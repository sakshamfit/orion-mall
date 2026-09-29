/**
 * nav.js — fixed bar that hides on scroll-down / shows on scroll-up,
 * fullscreen overlay menu with staggered links, smooth anchor scrolling
 * and current-section highlighting.
 */
import gsap from 'gsap';
import { prefersReducedMotion } from './utils.js';

export function initNav({ lenis } = {}) {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('menu-overlay');
  if (!nav || !toggle || !menu) return () => {};
  const reduced = prefersReducedMotion();

  let lastY = window.scrollY;
  let menuOpen = false;

  /* ---------- hide / show on scroll direction ---------- */
  const onScroll = (e) => {
    const y = e.scroll ?? window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (menuOpen) return;
    if (y > 120 && y > lastY + 2) nav.classList.add('is-hidden');
    else if (y < lastY - 2 || y <= 120) nav.classList.remove('is-hidden');
    lastY = y;
  };
  lenis?.on('scroll', onScroll);

  /* ---------- overlay menu ---------- */
  const links = [...menu.querySelectorAll('.menu__nav a, .menu__foot a')];
  const menuTl = reduced
    ? null
    : gsap.timeline({ paused: true })
        .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'power4.inOut' })
        .from(links, { y: 70, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, 0.15);

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    lenis?.stop();
    if (reduced) {
      menu.style.clipPath = 'inset(0 0 0% 0)';
    } else {
      menuTl.timeScale(1).play();
    }
    links[0]?.focus({ preventScroll: true });
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    lenis?.start();
    if (reduced) {
      menu.style.clipPath = 'inset(0 0 100% 0)';
      menu.classList.remove('is-open');
    } else {
      menuTl.timeScale(1.6).reverse();
      menu.addEventListener('transitionend', () => {}, { once: true });
      gsap.delayedCall(0.5, () => {
        if (!menuOpen) menu.classList.remove('is-open');
      });
    }
  }

  toggle.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) {
      closeMenu();
      toggle.focus();
    }
  });
  // close when a menu link is used
  links.forEach((a) => a.addEventListener('click', () => closeMenu()));

  /* ---------- smooth anchors via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.2 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- current-section highlight ---------- */
  const navLinks = [...nav.querySelectorAll('.nav__links a')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) =>
          a.classList.toggle('is-current', a.getAttribute('href') === `#${entry.target.id}`),
        );
      });
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  sections.forEach((s) => io.observe(s));

  /* ---------- teardown ---------- */
  return function teardown() {
    lenis?.off('scroll', onScroll);
    io.disconnect();
    menuTl?.kill();
  };
}
