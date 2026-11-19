const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
function setMenu(open) { nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); }
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); } });
document.addEventListener('click', (event) => { if (!event.target.closest('.header')) setMenu(false); });
window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => { if (event.matches) setMenu(false); });

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!motionPreference.matches && 'IntersectionObserver' in window) {
  const sections = document.querySelectorAll('.intro > div, .section-top, .experience-card, .brands-heading, .brand-grid, .cinema-image, .cinema-copy, .visit-inner > div');
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  sections.forEach((section) => { section.classList.add('reveal'); observer.observe(section); });
  document.body.classList.add('motion-ready');
  motionPreference.addEventListener('change', (event) => {
    if (event.matches) { document.body.classList.remove('motion-ready'); observer.disconnect(); }
  });
}

const heroBackground = document.getElementById('hero-video-background');
if (heroBackground && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const iframe = document.createElement('iframe');
  const params = new URLSearchParams({ autoplay: '1', mute: '1', loop: '1', playlist: 'EaEdZmbsStI', controls: '0', playsinline: '1', rel: '0', origin: window.location.origin });
  iframe.src = 'https://www.youtube-nocookie.com/embed/EaEdZmbsStI?' + params.toString();
  iframe.title = 'Orion Mall background video';
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; web-share';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.tabIndex = -1;
  heroBackground.appendChild(iframe);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => { if (event.matches) iframe.remove(); });
}

// Group every exported floor-based directory into consistent, readable store cards.
{
  const copy = document.querySelector('.export-copy');
  if (copy) {
    copy.classList.add('store-listings');
    let entry = null;
    Array.from(copy.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H3' && /(?:ground|first|second|third|fourth|fifth|\d+(?:st|nd|rd|th)?)\s*floor/i.test(node.textContent.trim())) {
        entry = document.createElement('article');
        entry.className = 'store-listing';
        copy.insertBefore(entry, node);
      }
      if (entry) entry.appendChild(node);
    });
    copy.querySelectorAll('.store-listing').forEach((item) => {
      let gallery = null;
      Array.from(item.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'FIGURE') {
          if (!gallery) { gallery = document.createElement('div'); gallery.className = 'store-gallery'; item.insertBefore(gallery, node); }
          gallery.appendChild(node);
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'A' && node.tagName !== 'FIGURE') gallery = null;
      });
    });
  }
}

// Exported social items without destinations remain non-clickable; never invent links.
const socialPaths = {
  facebook: '<path d="M13.5 21v-8h2.8l.4-3h-3.2V8.2c0-.9.3-1.5 1.6-1.5h1.8V4.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2V10H8v3h2.5v8z" fill="currentColor"/>',
  twitter: '<path d="M4 4l6.2 8.3L4.4 20h2.2l4.6-6.2L15.8 20H20l-6.6-8.9L18.7 4h-2.2l-4.1 5.6L8.2 4H4zm2.2 1.2h1.4l10.2 13.6h-1.4z" fill="currentColor"/>',
  youtube: '<path fill="currentColor" d="M21 7.1a2.7 2.7 0 0 0-1.9-1.9C17.4 4.7 12 4.7 12 4.7s-5.4 0-7.1.5A2.7 2.7 0 0 0 3 7.1 28 28 0 0 0 2.5 12c0 1.7.2 3.3.5 4.9a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.1.5 7.1.5s5.4 0 7.1-.5a2.7 2.7 0 0 0 1.9-1.9c.3-1.6.5-3.2.5-4.9s-.2-3.3-.5-4.9ZM10 15.4V8.6l5.9 3.4z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>'
};
document.querySelectorAll('.export-copy a').forEach((link) => {
  const name = link.textContent.trim().toLowerCase();
  if (!socialPaths[name] || link.children.length) return;
  const label = link.textContent.trim();
  if (!link.hasAttribute('href')) {
    // The export contains labels but no social URL for these stores.
    link.remove();
    return;
  }
  link.classList.add('export-social-icon');
  link.setAttribute('aria-label', label);
  link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + socialPaths[name] + '</svg><span class="social-sr">' + label + '</span>';
});

// Fashion campaigns rotate automatically; pause for keyboard focus and reduced motion.
{
  const carousel = document.querySelector('.fashion-carousel');
  const track = carousel?.querySelector('.fashion-track');
  const controls = carousel?.querySelector('.fashion-controls');
  if (carousel && track && controls) {
    const slides = Array.from(track.querySelectorAll('a'));
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let timer, focused = false;
    const visible = () => matchMedia('(max-width: 650px)').matches ? 1 : 2;
    const page = () => {
      const positions = Array.from({ length: count() }, (_, i) => Math.min(slides[i * visible()].offsetLeft - track.offsetLeft, track.scrollWidth - track.clientWidth));
      return positions.reduce((best, value, i) => Math.abs(value - track.scrollLeft) < Math.abs(positions[best] - track.scrollLeft) ? i : best, 0);
    };
    const count = () => Math.ceil(slides.length / visible());
    const update = () => {
      const current = page();
      Array.from(controls.children).forEach((dot, i) => {
        dot.classList.toggle('is-active', i === current);
        if (i === current) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };
    const go = n => { const index = ((n % count()) + count()) % count(); track.scrollTo({ left: slides[index * visible()].offsetLeft - track.offsetLeft, behavior: motion.matches ? 'auto' : 'smooth' }); };
    const stop = () => { clearInterval(timer); timer = undefined; };
    const start = () => { stop(); if (!motion.matches && !focused) timer = setInterval(() => go(page() + 1), 5000); };
    const renderDots = () => {
      controls.replaceChildren();
      for (let i = 0; i < count(); i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show fashion carousel page ${i + 1} of ${count()}`);
        dot.addEventListener('click', () => go(i));
        controls.append(dot);
      }
      update();
    };
    carousel.addEventListener('focusin', () => { focused = true; stop(); });
    carousel.addEventListener('focusout', event => { if (!carousel.contains(event.relatedTarget)) { focused = false; start(); } });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', () => { if (controls.children.length !== count()) renderDots(); else update(); });
    motion.addEventListener('change', start);
    controls.hidden = false; carousel.classList.add('is-enhanced'); renderDots(); start();
  }
}

