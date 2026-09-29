# AUDIT.md — final results

**Environment:** Vite production build (`npm run build`) served by `vite preview`; Lighthouse
13.5.0 driving Chromium 153 in a 2-vCPU sandbox with software (SwiftShader) GL. All fonts are
self-hosted variable woff2 (`src/css/fonts.css`), so the page makes **no third-party request at
all** — nothing has to be blocked for the audit and the numbers below are the real thing.
Absolute numbers are still pessimistic for this box — see notes.

## Lighthouse

| Metric         | Target | Mobile                           | Desktop     | Status |
| -------------- | ------ | -------------------------------- | ----------- | ------ |
| Performance    | ≥ 85   | **86–94** (runs: 92, 94, 91, 86) | **99–100**  | PASS   |
| Accessibility  | ≥ 95   | **100**                          | **100**     | PASS   |
| Best Practices | ≥ 95   | **100** (3/3 paired runs)        | **100**     | PASS   |
| SEO            | ≥ 95   | **100**                          | **100**     | PASS   |
| CLS            | < 0.05 | **0.032**                        | **0–0.003** | PASS   |
| LCP (mobile)   | —      | 2.2–2.3 s                        | 0.5–0.6 s   | —      |
| TBT (mobile)   | —      | 220–490 ms                       | 0 ms        | —      |
| FCP (mobile)   | —      | 1.6 s                            | 0.4 s       | —      |

Reproduce with `npm run build && npx vite preview --port 4173` then
`CHROME_PATH=… node tests/audit.mjs`.

**Best Practices note:** an earlier version linked Google Fonts from `index.html`. This sandbox
has no route to fonts.googleapis.com, so that request always logged a console error
(Lighthouse's `errors-in-console` audit) and Best Practices flaked between 96 and 100. Moving the
two families to self-hosted woff2 files removed the external request entirely — BP is now 100 on
every run, mobile _and_ desktop, across three consecutive paired runs. The residual CLS of 0.003–0.032 is
`font-display: swap` trading a sub-pixel reflow for instant text, far inside the "good" band
(< 0.1).

## Functional + performance harness (`npm test` — 39/39 PASS)

| Check                                                 | Result                                              |
| ----------------------------------------------------- | --------------------------------------------------- |
| Loader hides after tier 1 + 30% (desktop)             | PASS (~3.6 s cold, ~0.9 MB transferred before hide) |
| Initial payload before loader hides < 2.5 MB          | PASS — **0.90 MB**                                  |
| Zero console errors/warnings (full session)           | PASS                                                |
| CLS during load < 0.05                                | PASS — 0.0000                                       |
| Hero canvas sized + ready (DPR-aware)                 | PASS                                                |
| Scroll scrub changes canvas frames                    | PASS                                                |
| Overlay timeline (one overlay visible at a time)      | PASS                                                |
| Fast flick (8 × ±2500 px) — no errors, no h-scroll    | PASS                                                |
| Resize mid-scroll — canvas resizes, no errors         | PASS                                                |
| Reload while scrolled                                 | PASS                                                |
| Memory growth over 3 full scroll cycles < 25%         | PASS — **+0.2%** (3.35 MB → 3.36 MB)                |
| No horizontal scroll @ 360 / 768 / 1024 / 1440 / 1920 | PASS (5/5)                                          |
| No console errors at every breakpoint                 | PASS (5/5)                                          |
| Loader hides on Slow 4G + 4× CPU throttling           | PASS (~5.6 s)                                       |
| Reduced motion: static poster hero, no canvas scrub   | PASS                                                |
| Reduced motion: content readable (no hidden reveals)  | PASS                                                |
| Reduced motion: hero stays static on scroll           | PASS                                                |
| Ambient WebGL active when forced on (hi-concurrency)  | PASS                                                |
| Ambient WebGL disabled on low-end device / save-data  | PASS                                                |
| Nav anchor scrolls to the correct section             | PASS                                                |
| Teardown kills every ScrollTrigger (40 → 0)           | PASS                                                |
| Scrub frame rate                                      | ~60 fps (median frame 16.6 ms over 46 frames)       |

## Bundle size

| Asset                             | Raw              | Gzip     |
| --------------------------------- | ---------------- | -------- |
| `index.html` (CSS inlined)        | 46.6 kB          | 11.3 kB  |
| `index-*.js` (GSAP + Lenis + app) | 157.6 kB         | 58.6 kB  |
| `three-layer-*.js` (lazy chunk)   | 466.7 kB         | 117.6 kB |
| Frame sequences (streamed)        | 1.2 MB + 0.24 MB | —        |

## Responsive

Verified with screenshots at 360, 768, 1024, 1440, 1920 (`tests/screens/`): no horizontal
scroll, no overflow, menu overlay and swipeable gallery below 900 px.

## Accessibility

Lighthouse a11y = 100. Manual checks: skip link, focus-visible rings on every interactive
element, `aria-expanded`/`aria-controls` on the menu, labelled form fields with `aria-live`
error/status messages, `aria-hidden` on decorative canvas/grain/cursor, alt text policy
(decorative imagery is `aria-hidden`, no missing-alt failures), contrast: cream `#F3EAD9` on
`#12100D` ≈ 15:1, dim ink `#B8A891` ≈ 8:1, gold `#E8B25A` ≈ 10:1.

## What is intentionally not done

- Real brand/restaurant/offer content, hours, phone and socials — placeholders by design
  (see README placeholder table).
- No backend for the contact form; no real map embed (link only).
- Frame sequence is procedural (see NOTES.md) until the real walkthrough frames are dropped in.

**Verdict: no FAILs against the acceptance criteria.**
