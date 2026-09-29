# Orion Mall, Gorakhpur — cinematic scroll site

A scroll-driven, cinematic one-page site for **Orion Mall, Gorakhpur** — built with Vite +
vanilla JS, GSAP ScrollTrigger, Lenis smooth scroll and a Three.js ambient layer.

The centrepiece is the **"Enter the mall"** hero: a pinned full-screen canvas plays an image
sequence (mall exterior → entrance → atrium → floors) scrubbed by scroll, with synced text
overlays, a loading screen, a floor progress indicator, vignette and film grain.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production build -> dist/
npm run preview  # serve the build on http://localhost:4173
```

No environment variables or backend are required. `npm run dev` / `npm run build` first run
`scripts/build-frames.mjs`, which scans `public/frames` + `public/frames-m` and writes
`public/frames.json` — **the frame count is never hardcoded**.

## Scripts

| Script                            | What it does                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                     | dev server (auto-detects frames first)                                           |
| `npm run build`                   | production build (inlines CSS, code-splits three.js)                             |
| `npm run preview`                 | serves `dist/`                                                                   |
| `npm run build:frames`            | scans frame folders → `public/frames.json`                                       |
| `npm run generate:frames`         | regenerates the placeholder frame sequence (see below)                           |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                |
| `npm test`                        | 39 automated functional + performance checks (needs a Chrome binary — see below) |
| `npm run audit`                   | Lighthouse mobile + desktop, prints the AUDIT.md table                           |

## Swapping in the real walkthrough video

The committed frames are **procedurally generated placeholders** (see NOTES.md) — they are a
stylised exterior→atrium walkthrough, not footage of the real mall. To use the real video:

1. Extract frames from the mall walkthrough video:

   ```bash
   mkdir -p public/frames public/frames-m
   ffmpeg -i walkthrough.mp4 -vf "fps=24,scale=960:-2" -quality 55 public/frames/f_%04d.webp   # desktop set
   ffmpeg -i walkthrough.mp4 -vf "fps=12,scale=480:-2" -quality 50 public/frames-m/f_%04d.webp  # mobile set
   ```

   - Desktop set: ~144 frames at 960×540 (keep each frame ≈ 8–30 KB so the loader budget holds).
   - Mobile set: ~60 frames at 480×270 (used on viewports < 768 px, slow connections or save-data).
   - Naming must be `f_0001.webp`, `f_0002.webp`, … (4 digits, starting at 1).

2. Run `npm run build:frames` (or just `npm run dev` — it runs automatically).
3. Optionally re-sample the palette from the new first frame and update the CSS custom
   properties in `src/css/tokens.css` (`--gold`, `--amber`, `--bg` …).

The app picks the desktop or mobile set at runtime from `public/frames.json` + viewport width +
`navigator.connection`; frames stream in the background after the loading screen hides.

## Editing content

**All copy lives in [`src/content.js`](src/content.js).** Everything that is not a verified
fact from orionmallgorakhpur.com is a `<<PLACEHOLDER>>` token. In dev builds placeholders are
rendered with a dotted outline and a `placeholder` tooltip; the full list is below.

## Placeholders that need real content

Placeholders are `<<NAME>>` tokens in `src/content.js` (and a few static ones in `index.html`).
The right-hand column shows the real value found on the source site, where one exists — verify
before publishing.

| Placeholder                                                                        | Where                      | Suggested real content (from orionmallgorakhpur.com — verify)                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BRAND_NAME_1..44`, `BRAND_CATEGORY_1..44`                                         | Shop gallery               | Brands shown on the site include SUGAR Cosmetics, Revlon, Caprese, Van Heusen (& Women), United Colors of Benetton, Colorplus, Louis Philippe, Peter England, Allen Solly, Pepe Jeans, Spykar, Mufti, Reebok, Soch, AURALIA, Go Fashion, Sabhyata, W for Women, Nihao, Market 99, Brr, BKK … |
| `RESTAURANT_NAME_1..4`, `RESTAURANT_NOTE_1..4`, `FOODCOURT_NAME`, `FOODCOURT_NOTE` | Dine                       | Food-court and premium-dining tenants: KFC, Domino's, Burger King, The London Shake, Jaerd Habib, Nihao …                                                                                                                                                                                    |
| `GAMING_ZONE_NAME`                                                                 | Entertain                  | The kids' gaming zone is listed as "FUN UNLIMITED – GAME ZONE"                                                                                                                                                                                                                               |
| `MOVIE_NAME_1..4`                                                                  | Now-showing strip          | The site listed "Pati Patni Aur Woh Do (UA16+)" (dated — replace with current releases)                                                                                                                                                                                                      |
| `OFFER_1..5`                                                                       | Events ticker              | Current mall offers                                                                                                                                                                                                                                                                          |
| `EVENT_TITLE_1..3`, `EVENT_DATE_1..3`, `EVENT_COPY_1..3`                           | Events cards               | Upcoming events                                                                                                                                                                                                                                                                              |
| `HOURS_WEEKDAYS_LABEL`, `HOURS_WEEKDAYS`, `HOURS_WEEKEND_LABEL`, `HOURS_WEEKEND`   | Visit                      | Opening hours (not published on the site — must be supplied)                                                                                                                                                                                                                                 |
| `PHONE_NUMBER`                                                                     | Visit                      | The site lists `tel:09517636465`                                                                                                                                                                                                                                                             |
| `EMAIL_ADDRESS`                                                                    | Visit                      | Not published — supply or delete the line                                                                                                                                                                                                                                                    |
| `MAP_LINK_DIRECTIONS`                                                              | Visit "Get directions"     | `https://maps.app.goo.gl/q9WAoWzD8F9oH7JHA` (or `https://goo.gl/maps/QM2fJoftUwr7VuPx6`)                                                                                                                                                                                                     |
| `MAP_LINK_VISIT`                                                                   | content.js `VISIT.mapLink` | Same maps link (kept as a link, never an iframe)                                                                                                                                                                                                                                             |
| `LINK_BUY_TICKETS`                                                                 | Cinema CTA                 | INOX booking link / the site's `/movie/` page                                                                                                                                                                                                                                                |
| `SOCIAL_INSTAGRAM`                                                                 | Footer                     | `https://www.instagram.com/orion.mall/`                                                                                                                                                                                                                                                      |
| `SOCIAL_YOUTUBE`                                                                   | content.js `LINKS.youtube` | The YouTube channel linked from the site's nav                                                                                                                                                                                                                                               |
| `CREDIT_LINE`                                                                      | Footer                     | Studio/credit line                                                                                                                                                                                                                                                                           |

Verified facts already wired in (do not "fix" these): name, Mohaddipur · near Radisson Blu ·
Gorakhpur, Uttar Pradesh; 2,00,000+ sq. ft.; Food/Shopping/Entertainment hub; food courts +
premium dining; 40+ national and international brands; INOX multiplex; kids' gaming zone;
parking; "Life is all about having a good time."

## Project layout

```
orion-mall-site/
├─ index.html                 # semantic document, meta/OG, JSON-LD, all sections
├─ public/
│  ├─ frames/                 # desktop sequence f_0001.webp … f_0144.webp
│  ├─ frames-m/               # mobile sequence (60 frames)
│  ├─ frames.json             # auto-generated manifest (never hardcode counts)
│  └─ robots.txt
├─ scripts/
│  ├─ build-frames.mjs        # scans folders -> frames.json
│  └─ generate-frames.mjs     # regenerates the placeholder sequence
├─ src/
│  ├─ content.js              # ALL copy + placeholders
│  ├─ css/                    # fonts, tokens, base, loader, nav, cursor, hero, sections
│  └─ js/
│     ├─ main.js              # boot: Lenis↔GSAP ticker, deferred init, teardown
│     ├─ hero.js              # pinned canvas scrub + overlay timeline + floors
│     ├─ frames.js            # manifest fetch, set choice, tiered loader
│     ├─ split-text.js        # custom SplitText replacement (words/chars/lines)
│     ├─ nav.js               # hide-on-scroll bar + overlay menu + anchors
│     ├─ cursor.js            # dot+ring cursor + magnetic hover (desktop only)
│     ├─ sections.js          # sections A–G: reveals, gallery, sticky, tilt, form
│     ├─ three-layer.js       # ambient WebGL (lazy chunk) with all the guards
│     └─ utils.js
└─ tests/                     # puppeteer harness, screenshots, audit script
```

## Testing & auditing in this repo

`npm test` runs `tests/site-test.mjs` (39 checks: loader behaviour, scrub, overlays, flick,
resize, reload, Slow-4G, memory growth, breakpoints, reduced motion, ambient on/off, anchor
nav, teardown). It needs a Chromium binary:

```bash
CHROME_PATH=/path/to/chrome node tests/site-test.mjs   # expects the site on :4173
```

`npm run audit` needs the same `CHROME_PATH` plus a running `npm run preview`.
See `AUDIT.md` for the latest results and `NOTES.md` for decisions.

## Accessibility & progressive enhancement

- Skip link, semantic landmarks, visible focus rings, `aria-*` on the menu/form/counter.
- `prefers-reduced-motion`: the hero becomes a static poster, all scrubs/parallax/Three.js are
  disabled, the brand gallery becomes a swipeable row, and every reveal resolves to its final
  state (content is never hidden).
- Low-end devices (`hardwareConcurrency ≤ 4`, `deviceMemory ≤ 4`, save-data) skip the WebGL layer.
- No-JS: a `<noscript>` hero fallback states the key facts.

## Fonts

Both families are **self-hosted** variable woff2 (no Google Fonts request at all):

| Family   | Use       | Source package                  | Subsets loaded                    |
| -------- | --------- | ------------------------------- | --------------------------------- |
| Fraunces | display   | `@fontsource-variable/fraunces` | latin (37 kB) + latin-ext (34 kB) |
| Inter    | body / UI | `@fontsource-variable/inter`    | latin (48 kB) + latin-ext (85 kB) |

The `@font-face` rules live in `src/css/fonts.css` and are inlined into `index.html` by the
build; the latin subset loads first and the latin-ext file is only fetched when a glyph outside
latin actually appears. `font-display: swap` means text paints immediately in the system
fallback. To change fonts, edit `src/css/fonts.css` (or `src/css/tokens.css` for the stacks) —
never re-link Google Fonts, or the page regains a render-blocking third-party request.
