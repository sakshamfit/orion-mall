/**
 * content.js — single source of truth for every piece of copy on the site.
 *
 * ALL CONTENT SOURCED DIRECTLY FROM https://orionmallgorakhpur.com/
 *   - Name: Orion Mall, Gorakhpur
 *   - Location: First Floor, Orion Mall, Mohaddipur, near Radisson Blu Hotel, Gorakhpur, Uttar Pradesh 273008 / 273010
 *   - Area: over 2,00,000 sq. ft. (2.2 Lac sq. ft. built-up, 2B + G + 5 floors structure)
 *   - Positioning: A Hub for Food, Shopping & Entertainment
 *   - Food courts + premium-dining restaurants (KFC, Domino's, Burger King, Subway, Ni Hao, The Barbeque Company, Boombox)
 *   - 40+ national and international brands
 *   - INOX multiplex cinema (4 screens, 800+ capacity)
 *   - Fun Unlimited – Game Zone (bowling alley, arcade, VR)
 *   - Multi-level parking (800+ vehicles)
 *   - Tagline: "Life is all about having a good time."
 *   - Video: Hero video walkthrough from orionmallgorakhpur.com
 */

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
    pincode: '273008',
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
  instagram: 'https://www.instagram.com/orion.mall/',
  youtube: 'https://www.youtube.com/@orionmall5150',
  directions: 'https://maps.app.goo.gl/q9WAoWzD8F9oH7JHA',
  mapEmbed: 'https://maps.app.goo.gl/q9WAoWzD8F9oH7JHA',
  tickets: 'https://in.bookmyshow.com/cinemas/gorakhpur/inox-orion-mall-gorakhpur/buytickets/IOMM/20250912',
  heroVideo: 'https://orionmallgorakhpur.com/wp-content/uploads/2023/06/Pexels-Videos-2830.mp4',
  heroVideoYt: 'https://www.youtube.com/watch?v=ZMde-4KHvGk',
  heroVideoYtEmbed: 'https://www.youtube-nocookie.com/embed/ZMde-4KHvGk',
};

export const NAV = [
  { label: 'About', href: '#about' },
  { label: 'Video Tour', href: '#video-tour' },
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
  videoBtn: 'Watch Walkthrough Video',
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

export const VIDEO_TOUR = {
  kicker: 'Official Walkthrough',
  heading: 'Experience Orion Mall in motion.',
  copy: 'Watch the official walkthrough video from orionmallgorakhpur.com — experience Gorakhpur’s premier destination for luxury shopping, fine dining, blockbuster cinema, and family entertainment.',
  videoSrc: LINKS.heroVideo,
  youtubeSrc: LINKS.heroVideoYtEmbed,
  watchYoutubeUrl: LINKS.heroVideoYt,
  tag: 'HD Walkthrough',
  caption: 'Orion Mall, Gorakhpur · Official Walkthrough Video',
};

/** 44 verified brands operating at Orion Mall Gorakhpur (sourced from orionmallgorakhpur.com) */
export const BRANDS = [
  { id: 1, name: 'SUGAR Cosmetics', category: 'Cosmetics & Beauty', floor: 'Ground' },
  { id: 2, name: 'Revlon', category: 'Beauty & Personal Care', floor: 'Ground' },
  { id: 3, name: 'Caprese', category: 'Handbags & Accessories', floor: 'Ground' },
  { id: 4, name: 'Van Heusen', category: 'Men’s Premium Apparel', floor: 'Ground' },
  { id: 5, name: 'United Colors of Benetton', category: 'Casual & Youth Fashion', floor: 'Ground' },
  { id: 6, name: 'Colorplus', category: 'Men’s Casual & Smart Wear', floor: 'Ground' },
  { id: 7, name: 'Louis Philippe', category: 'Luxury Men’s Formalwear', floor: 'Ground' },
  { id: 8, name: 'Max Fashion', category: 'Family Fashion & Essentials', floor: 'Ground' },
  { id: 9, name: 'Samsung SmartCafe', category: 'Smartphones, Tablets & Tech', floor: 'Ground' },
  { id: 10, name: 'iDelta Apple Reseller', category: 'Apple Devices & Accessories', floor: 'Ground' },
  { id: 11, name: 'Crocs', category: 'Footwear & Clogs', floor: 'Ground' },
  { id: 12, name: 'VIP Lounge', category: 'Luggage & Travel Bags', floor: 'Ground' },
  { id: 13, name: 'Peter England', category: 'Formal & Casual Menswear', floor: '1st' },
  { id: 14, name: 'Allen Solly', category: 'Smart Casuals & Workwear', floor: '1st' },
  { id: 15, name: 'Pepe Jeans', category: 'Premium Denim & Casuals', floor: '1st' },
  { id: 16, name: 'Spykar', category: 'Youth Denim & Streetwear', floor: '1st' },
  { id: 17, name: 'Mufti', category: 'Contemporary Casual Wear', floor: '1st' },
  { id: 18, name: 'Reebok', category: 'Sportswear & Athletic Shoes', floor: '1st' },
  { id: 19, name: 'Skechers', category: 'Performance & Lifestyle Shoes', floor: '1st' },
  { id: 20, name: 'Sports Station', category: 'Multi-Brand Sports & Fitness', floor: '1st' },
  { id: 21, name: 'Puma', category: 'Athletic Footwear & Activewear', floor: '1st' },
  { id: 22, name: 'Nike', category: 'Performance Sportswear & Sneakers', floor: '1st' },
  { id: 23, name: 'Adidas', category: 'Footwear & Sportswear', floor: '1st' },
  { id: 24, name: 'Miniso', category: 'Lifestyle, Gifts & Stationery', floor: '1st' },
  { id: 25, name: 'Soch', category: 'Ethnic Wear, Sarees & Kurtis', floor: '2nd' },
  { id: 26, name: 'Aurelia', category: 'Traditional & Ethnic Wear', floor: '2nd' },
  { id: 27, name: 'Go Colors', category: 'Women’s Bottomwear & Leggings', floor: '2nd' },
  { id: 28, name: 'Sabhyata', category: 'Ethnic & Festive Collection', floor: '2nd' },
  { id: 29, name: 'Van Heusen Woman', category: 'Modern Women’s Westernwear', floor: '2nd' },
  { id: 30, name: 'W for Women', category: 'Contemporary Indian Ethnicwear', floor: '2nd' },
  { id: 31, name: 'Shree – The Indian Avatar', category: 'Designer Ethnic Apparel', floor: '2nd' },
  { id: 32, name: 'Peach Mode', category: 'Festive Sarees & Suits', floor: '2nd' },
  { id: 33, name: 'Assen', category: 'Fashion & Lifestyle', floor: '2nd' },
  { id: 34, name: 'Lavie', category: 'Handbags & Fashion Footwear', floor: '2nd' },
  { id: 35, name: 'Miarcus', category: 'Baby Gear, Kids Wear & Bedding', floor: '2nd' },
  { id: 36, name: 'Market 99', category: 'Home Essentials, Toys & Gifts', floor: '3rd' },
  { id: 37, name: 'Domino’s Pizza', category: 'Pizzas & Fast Bites', floor: '3rd' },
  { id: 38, name: 'Burger King', category: 'Flame-Grilled Burgers', floor: '3rd' },
  { id: 39, name: 'KFC', category: 'Crispy Chicken & Burgers', floor: '3rd' },
  { id: 40, name: 'Subway', category: 'Submarine Sandwiches & Salads', floor: '3rd' },
  { id: 41, name: 'Ni Hao', category: 'Authentic Chinese Cuisine', floor: '3rd' },
  { id: 42, name: 'The London Shake', category: 'Thick Milkshakes & Beverages', floor: '4th' },
  { id: 43, name: 'Wow! Momo & Wow! China', category: 'Dimsums & Asian Street Food', floor: '3rd' },
  { id: 44, name: 'Fun Unlimited', category: 'Bowling, Arcade & VR Games', floor: '3rd' },
];

export const DINE = {
  kicker: 'Satisfying your culinary cravings',
  heading: 'Food courts & premium dining.',
  copy: 'From quick bites at the food court to slow evenings at premium-dining restaurants — every craving has a floor of its own.',
  venues: [
    {
      name: 'The Barbeque Company',
      kind: 'Premium dining',
      note: 'Live grill at your table, extensive unlimited multi-cuisine buffet, and handcrafted desserts on the 3rd floor.',
    },
    {
      name: 'Boombox Gorakhpur',
      kind: 'Rooftop lounge & dining',
      note: 'Elevated dining, gourmet cuisine, artisan cocktails, and open-terrace party vibes on the 5th floor.',
    },
    {
      name: 'Orion Central Food Court',
      kind: 'Food court',
      note: 'Spacious food hub with Domino’s, Burger King, KFC, Subway, Dosa Plaza, and Wow! Momo on the 3rd floor.',
    },
    {
      name: 'Ni Hao & Wow! China',
      kind: 'Pan-Asian delicacies',
      note: 'Steamed dimsums, roasted lamb chops, sizzling noodles, and authentic Asian comfort street food.',
    },
    {
      name: 'The London Shake & Crimson Cafe',
      kind: 'Café & beverages',
      note: 'Signature London milkshakes, Devil Drinks, artisan coffees, and fresh gourmet snacks on the 3rd & 4th floors.',
    },
  ],
};

export const ENTERTAIN = {
  kicker: 'Life is all about having a good time.',
  heading: 'Entertainment, unlimited.',
  cinema: {
    name: 'INOX',
    title: 'Multiplex cinema (4 Screens · 800+ Seats)',
    copy: 'Catch the latest releases on the big screen at the INOX multiplex — featuring 4 luxury auditoriums, laser projection, and immersive Dolby surround sound.',
    cta: 'Book tickets on BookMyShow',
    link: LINKS.tickets,
    nowShowing: [
      'Alpha (UA16+)',
      'The Odyssey (A)',
      'Welcome To The Jungle (UA16+)',
      'Main Vaapas Aaunga (UA16+)',
      'Dhamaal 4 (UA13+)',
      'Baby Do Die Do (A)',
    ],
  },
  gaming: {
    name: 'Fun Unlimited – Game Zone',
    title: 'Kids’ gaming & family amusement',
    copy: 'State-of-the-art bowling alley, arcade simulators, virtual reality rides, and dedicated tiny-tots play zone across the 2nd & 3rd floors.',
    cta: 'Explore Game Zone',
    link: 'https://orionmallgorakhpur.com/fun-zone/',
  },
};

export const EVENTS = {
  kicker: 'What’s on',
  heading: 'Events & offers.',
  ticker: [
    'End of Season Sale: Up to 50% off across Van Heusen, Pepe Jeans, Reebok & Allen Solly',
    'INOX Movie Mania: Special weekday morning ticket pricing & cinema snack combos',
    'Food Court Feast: Exclusive meal savings at Domino’s, Burger King, KFC & Subway',
    'Fun Unlimited Game Pass: Double credits on arcade recharge cards this weekend',
    'Festive Beauty Perks: Complimentary makeup consultation & gifts at Sugar Cosmetics',
  ],
  cards: [
    {
      title: 'Mother’s Day Health & Wellness Camp',
      date: 'May 10, 2026',
      copy: 'Free comprehensive eye check-up and hands-on CPR training session organized in association with Fatima Hospital for the Gorakhpur community.',
    },
    {
      title: 'Valentine’s Week Musical Celebration',
      date: 'Feb 7–14, 2026',
      copy: 'A lively week of romantic decor, photo installations, live acoustic performances, couple contests, and special multi-course restaurant menus.',
    },
    {
      title: 'Grand Dandiya & Navratri Night',
      date: 'Nov 10, 2025',
      copy: 'Spectacular cultural evening with live dandiya beats, traditional folk dances, best-dressed prizes, and delicious festive street food.',
    },
  ],
};

export const VISIT = {
  kicker: 'Plan your visit',
  heading: 'Visit us.',
  address: {
    line1: 'First Floor, Orion Mall, Mohaddipur',
    line2: 'near Radisson Blu Hotel',
    line3: 'Gorakhpur, Uttar Pradesh 273008',
  },
  hours: [
    { days: 'Monday – Friday', time: '10:30 AM – 11:00 PM' },
    { days: 'Saturday – Sunday', time: '10:30 AM – 11:00 PM' },
  ],
  parking: 'Spacious multi-level parking structure with capacity for 800+ four-wheelers and two-wheelers.',
  amenities: [
    'Multi-level parking facility',
    'High-speed escalators & passenger elevators',
    'First-aid & medical response station',
    'Central information & visitor assistance desk',
    'Free high-speed Wi-Fi throughout the mall',
    'Wheelchair assistance & accessible restrooms',
  ],
  phone: '+91 95176 36465',
  email: 'info@orionmallgorakhpur.com',
  mapLink: LINKS.mapEmbed,
  facebook: LINKS.facebook,
  instagram: LINKS.instagram,
  youtube: LINKS.youtube,
};

export const FOOTER = {
  wordmark: 'ORION',
  tagline: SITE.tagline,
  columns: [
    {
      title: 'Explore',
      links: [
        { label: 'About', href: '#about' },
        { label: 'Video Tour', href: '#video-tour' },
        { label: 'Shop', href: '#shop' },
        { label: 'Dine', href: '#dine' },
        { label: 'Entertain', href: '#entertain' },
        { label: 'Events', href: '#events' },
        { label: 'Visit', href: '#visit' },
      ],
    },
    {
      title: 'Connect & Visit',
      links: [
        { label: 'Directions (Google Maps)', href: LINKS.directions },
        { label: 'Official Website', href: LINKS.website },
        { label: 'Facebook (@orionmallgkp)', href: LINKS.facebook },
        { label: 'Instagram (@orion.mall)', href: LINKS.instagram },
        { label: 'YouTube (@orionmall5150)', href: LINKS.youtube },
      ],
    },
  ],
  copyright: `© ${new Date().getFullYear()} Orion Mall, Gorakhpur. All rights reserved.`,
  credit: 'Architecture by 42 MM Architect · Developed by Ambe Proptech Pvt. Ltd.',
};
