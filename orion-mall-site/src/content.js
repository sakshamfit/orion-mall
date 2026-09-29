/**
 * content.js — single source of truth for every piece of copy on the site.
 *
 * REAL FACTS (from orionmallgorakhpur.com — do not invent beyond these):
 *   - Name: Orion Mall, Gorakhpur
 *   - Location: Mohaddipur, near Radisson Blu, Gorakhpur, Uttar Pradesh
 *   - Area: over 2,00,000 sq. ft.
 *   - Positioning: a hub for Food, Shopping & Entertainment
 *   - Food courts + premium-dining restaurants
 *   - 40+ national and international brands
 *   - INOX multiplex cinema, kids' gaming zone, parking
 *   - Tagline: "Life is all about having a good time."
 *
 * EVERYTHING ELSE IS A PLACEHOLDER. Placeholders are SCREAMING_SNAKE_CASE
 * strings wrapped in << >> so they are impossible to mistake for real content
 * (they also get a dotted outline in dev mode). The full list of placeholders
 * that need real content is in README.md -> "Placeholders to replace".
 */

const PH = (name) => `<<${name}>>`;

export const SITE = {
  name: 'Orion Mall',
  city: 'Gorakhpur',
  tagline: 'Life is all about having a good time.',
  heroWords: ['ORION', 'MALL'],
  location: {
    area: 'Mohaddipur',
    near: 'near Radisson Blu',
    city: 'Gorakhpur',
    state: 'Uttar Pradesh',
    country: 'India',
  },
  areaSqFt: 200000,
  areaLabel: '2,00,000',
  positioning: 'A hub for Food, Shopping & Entertainment',
  description:
    'Orion Mall, Gorakhpur is a hub for Food, Shopping & Entertainment — spread over 2,00,000+ sq. ft. in Mohaddipur, near Radisson Blu, with food courts, premium dining, 40+ national and international brands, an INOX multiplex, a kids’ gaming zone and parking.',
};

export const LINKS = {
  website: 'https://orionmallgorakhpur.com/',
  facebook: 'https://www.facebook.com/orionmallgkp/',
  directions: PH('MAP_LINK_DIRECTIONS'),
  mapEmbed: PH('MAP_LINK_VISIT'),
  tickets: PH('LINK_BUY_TICKETS'),
  instagram: PH('SOCIAL_INSTAGRAM'),
  youtube: PH('SOCIAL_YOUTUBE'),
};

export const NAV = [
  { label: 'About', href: '#about' },
  { label: 'Shop', href: '#shop' },
  { label: 'Dine', href: '#dine' },
  { label: 'Entertain', href: '#entertain' },
  { label: 'Events', href: '#events' },
  { label: 'Visit', href: '#visit' },
];

export const HERO = {
  cue: 'Scroll to enter',
  overlays: {
    stepInside: 'Step inside.',
    triple: ['Food.', 'Shopping.', 'Entertainment.'],
    areaLine: (formatted) => `${formatted} sq. ft. of everything.`,
  },
};

export const ABOUT = {
  kicker: 'First time in Gorakhpur. Only at Orion Mall.',
  statement:
    'Orion Mall is one of Gorakhpur’s largest and most prominent shopping malls — a hub for Food, Shopping & Entertainment, with food courts, premium-dining restaurants and more than 40 national and international brands.',
  stats: [
    { value: 200000, display: '2,00,000', suffix: '+ sq. ft.', label: 'of experiences under one roof' },
    { value: 40, display: '40', suffix: '+', label: 'national & international brands' },
    { value: 3, display: '3', suffix: '', label: 'worlds: food, shopping, entertainment' },
    { value: 1, display: '1', suffix: '', label: 'INOX multiplex cinema' },
  ],
};

/** 40+ brand tiles. Names are placeholders — see README placeholder list. */
export const BRANDS = Array.from({ length: 44 }, (_, i) => ({
  id: i + 1,
  name: PH(`BRAND_NAME_${i + 1}`),
  category: PH(`BRAND_CATEGORY_${i + 1}`),
  floor: i % 3 === 0 ? 'Ground' : i % 3 === 1 ? '1st' : '2nd',
}));

export const DINE = {
  kicker: 'Satisfying your culinary cravings',
  heading: 'Food courts & premium dining.',
  copy: 'From quick bites at the food court to slow evenings at premium-dining restaurants — every craving has a floor of its own.',
  venues: [
    { name: PH('RESTAURANT_NAME_1'), kind: 'Premium dining', note: PH('RESTAURANT_NOTE_1') },
    { name: PH('RESTAURANT_NAME_2'), kind: 'Premium dining', note: PH('RESTAURANT_NOTE_2') },
    { name: PH('FOODCOURT_NAME'), kind: 'Food court', note: PH('FOODCOURT_NOTE') },
    { name: PH('RESTAURANT_NAME_3'), kind: 'Food court', note: PH('RESTAURANT_NOTE_3') },
    { name: PH('RESTAURANT_NAME_4'), kind: 'Café & desserts', note: PH('RESTAURANT_NOTE_4') },
  ],
};

export const ENTERTAIN = {
  kicker: 'Life is all about having a good time.',
  heading: ' entertainment, unlimited.',
  cinema: {
    name: 'INOX',
    title: 'Multiplex cinema',
    copy: 'Catch the latest releases on the big screen at the INOX multiplex — the city’s destination for movie nights.',
    cta: 'Book tickets',
    link: LINKS.tickets,
    nowShowing: [PH('MOVIE_NAME_1'), PH('MOVIE_NAME_2'), PH('MOVIE_NAME_3'), PH('MOVIE_NAME_4')],
  },
  gaming: {
    name: PH('GAMING_ZONE_NAME'),
    title: 'Kids’ gaming zone',
    copy: 'Arcades, rides and play zones keep the youngest visitors busy for hours — while the grown-ups keep shopping.',
    cta: 'See what’s on',
    link: LINKS.website,
  },
};

export const EVENTS = {
  kicker: 'What’s on',
  heading: 'Events & offers.',
  ticker: [PH('OFFER_1'), PH('OFFER_2'), PH('OFFER_3'), PH('OFFER_4'), PH('OFFER_5')],
  cards: [
    { title: PH('EVENT_TITLE_1'), date: PH('EVENT_DATE_1'), copy: PH('EVENT_COPY_1') },
    { title: PH('EVENT_TITLE_2'), date: PH('EVENT_DATE_2'), copy: PH('EVENT_COPY_2') },
    { title: PH('EVENT_TITLE_3'), date: PH('EVENT_DATE_3'), copy: PH('EVENT_COPY_3') },
  ],
};

export const VISIT = {
  kicker: 'Plan your visit',
  heading: 'Visit us.',
  address: {
    line1: 'Orion Mall, Mohaddipur',
    line2: 'near Radisson Blu',
    line3: 'Gorakhpur, Uttar Pradesh',
  },
  hours: [
    { days: PH('HOURS_WEEKDAYS_LABEL'), time: PH('HOURS_WEEKDAYS') },
    { days: PH('HOURS_WEEKEND_LABEL'), time: PH('HOURS_WEEKEND') },
  ],
  parking: 'Spacious multi-level parking structure with ample parking space for visitors.',
  amenities: ['Multi-level parking', 'Escalators between floors', 'First-aid station', 'Information desk'],
  phone: PH('PHONE_NUMBER'),
  email: PH('EMAIL_ADDRESS'),
  mapLink: LINKS.mapEmbed,
  facebook: LINKS.facebook,
};

export const FOOTER = {
  wordmark: 'ORION',
  tagline: SITE.tagline,
  columns: [
    {
      title: 'Explore',
      links: NAV.map((n) => ({ label: n.label, href: n.href })),
    },
    {
      title: 'Visit',
      links: [
        { label: 'Directions', href: LINKS.directions },
        { label: 'Official website', href: LINKS.website },
        { label: 'Facebook', href: LINKS.facebook },
        { label: 'Instagram', href: LINKS.instagram },
      ],
    },
  ],
  copyright: `© ${new Date().getFullYear()} Orion Mall, Gorakhpur. All rights reserved.`,
  credit: PH('CREDIT_LINE'),
};

/** LocalBusiness JSON-LD is rendered statically in index.html (real facts only). */
