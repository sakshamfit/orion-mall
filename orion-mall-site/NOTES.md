# NOTES.md — decisions & assumptions

## Content

- Every fact on the page comes from orionmallgorakhpur.com: name, location (Mohaddipur, near
  Radisson Blu, Gorakhpur, UP), 2,00,000+ sq. ft., Food/Shopping/Entertainment positioning,
  food courts + premium dining, 40+ national and international brands, INOX multiplex, kids'
  gaming zone, parking, and the tagline "Life is all about having a good time."
- **Everything else is a `<<PLACEHOLDER>>`** — brand names, restaurant names, offers, movies,
  hours, phone, email, socials, credit line. Even though the source site lists real brands, the
  brief required marked placeholders, so the real names are documented in README.md as the
  content to fill in rather than shipped as facts.
- Placeholders are visibly marked in dev builds (dotted outline + tooltip) and never look like
  real content. Long placeholder tokens are allowed to wrap mid-word so they can never force a
  horizontal overflow (this was a real bug found in testing at 360 px).
- JSON-LD (`ShoppingCenter`) uses only the verified facts; `url`/`sameAs` point at the real site
  and Facebook page.

## The hero frames (biggest assumption)

The brief asks for frames extracted from the mall's walkthrough video. That video is not
available to this project, so `scripts/generate-frames.mjs` **procedurally renders a stylised
144-frame desktop + 60-frame mobile sequence** (a tiny pure-Node software renderer: projected
quads, painter sorting, fog, additive glow, dust, vignette, grain) that follows the required
narrative: exterior at dusk → approach → entrance → atrium → floors → skylight. It is a
deliberate placeholder: swap in real frames per README (naming, sizes and the manifest are
already wired for it). The generator is deterministic (seeded) and documented; frames are
committed so `npm run dev` works offline.

## Stack choices

- **Vanilla JS + Vite** (not React): the site is one long scroll narrative with no app state;
  vanilla keeps the initial bundle at ~58 KB gzipped. Documented here as the brief allows.
- **GSAP 3 + ScrollTrigger** for all scroll choreography; **Lenis** synced to the GSAP ticker
  exactly as specified. No CSS transitions animate anything GSAP also controls.
- **SplitText**: GSAP's SplitText is members-only, so `src/js/split-text.js` is a custom
  words/chars/lines splitter (overflow-hidden wrappers + inner spans), used by the hero
  wordmark, the "Step inside." line and the section headlines.
- **Three.js** is imported with named imports and **code-split into its own lazy chunk**
  (~118 KB gz) that is only fetched when the first content section scrolls into view — the hero
  never needs it. It is fully disposed on teardown.

## Performance decisions (measured, see AUDIT.md)

- Tiered frame loading: the loading screen waits for the first 10 frames + 30% of the rest
  (~0.9 MB in this sandbox), the remainder streams in idle chunks; if the user outruns the
  loader the last loaded frame is held. A 6 s failsafe hides the loader regardless.
- The built CSS is **inlined into `index.html`** at build time (small Vite plugin) so there is
  no render-blocking stylesheet request.
- Boot is split: critical path is Lenis + GSAP + hero; nav/cursor/sections initialise in
  **separate macrotasks** during idle time, which is what keeps TBT ≈ 200 ms on a throttled
  mobile profile.
- Canvas is `devicePixelRatio`-aware capped at 2, cover-fit, and only redraws when the frame
  index changes. Ambient layer caps DPR at 1.5 and pauses via IntersectionObserver +
  `visibilitychange`.
- Fonts are **self-hosted** (variable woff2 from `@fontsource-variable/fraunces` and
  `@fontsource-variable/inter`, latin + latin-ext subsets only, declared in
  `src/css/fonts.css`). The page makes no request to fonts.googleapis.com /
  fonts.gstatic.com at all: no third-party DNS + TLS handshakes, nothing to fail when the
  visitor is offline, and no console error under Lighthouse's blocked-URL patterns.

## Design

- Palette sampled from the first hero frame (ImageMagick histogram): dominant `#1C140F`, deep
  amber `#50311D`, amber `#8E6537`, gold `#BD8B49` → tokens in `src/css/tokens.css` with a
  brighter gold `#E8B25A` for accents. Dark theme only, as specified.
- Type: Fraunces (display serif) + Inter (body), fluid `clamp()` scale, self-hosted as
  variable woff2 (~37 kB + ~85 kB latin subsets; the latin-ext subset only downloads when a
  glyph outside latin is actually used).
- Each section uses a different reveal so the page doesn't feel repetitive: word-by-word colour
  fill (A), pinned horizontal gallery with magnetic tiles (B), sticky parallax + centre-line
  list highlight (C), tilt cards (D), marquee + staggered cards (E), split info/form (F),
  clip-path wordmark wipe (G).

## Known limitations / environment notes

- The audit sandbox has 2 vCPUs and software (SwiftShader) GL, so absolute Lighthouse numbers
  are pessimistic; desktop (unthrottled) scores 99–100. Mobile performance is noisy here —
  86–94 across repeated runs, dominated by TBT on a throttled 4× CPU — but a11y, SEO and Best
  Practices are 100 every time.
- All fonts are self-hosted, so no audit/test needs URL blocking (an earlier version linked
  Google Fonts, which this sandbox cannot reach and which made Best Practices flake at 96).
- Lenis reverts single programmatic `window.scrollTo` jumps; anchor links therefore use
  `lenis.scrollTo()` (tested), and the test harness scrolls with real wheel events.
- The contact form is front-end only (validated, `aria-live` status); there is no backend.
- The map is a link placeholder, never an iframe, as specified.
