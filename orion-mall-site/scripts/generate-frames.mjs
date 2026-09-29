/**
 * generate-frames.mjs — one-time generator for the Orion Mall hero image sequence.
 *
 * Renders a stylised cinematic "walk into the mall" sequence as PNG frames with a
 * tiny pure-Node software renderer (no native deps), then they are converted to
 * .webp with ImageMagick (see README). The frames in /public/frames are inputs
 * to the site — they are committed so `npm run dev` works offline.
 *
 * Swap instructions: replace /public/frames/*.webp with frames extracted from
 * the real walkthrough video (same naming) and run `npm run build:frames`.
 *
 * Usage: node scripts/generate-frames.mjs [--desktop 144] [--mobile 60]
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? parseInt(process.argv[i + 1], 10) : dflt;
};
const N_DESKTOP = arg('--desktop', 144);
const N_MOBILE = arg('--mobile', 60);

/* ---------------------------------------------------------------- PNG encoder */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------------- math */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

/* ------------------------------------------------------- camera + projection */
// Camera: position, yaw (around Y), pitch (around X, + looks down).
function makeCamera(pos, yaw, pitch, f, w, h) {
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw);
  const cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  // view matrix rows (world -> camera space): R = Ry(-yaw) * Rx(-pitch) applied as transpose
  const m = [
    [cy, sy * sp, sy * cp],
    [0, cp, -sp],
    [-sy, cy * sp, cy * cp],
  ];
  return {
    pos,
    m,
    f,
    w,
    h,
    cx: w / 2,
    cy: h / 2,
    toCam(p) {
      const dx = p[0] - pos[0],
        dy = p[1] - pos[1],
        dz = p[2] - pos[2];
      return [
        m[0][0] * dx + m[0][1] * dy + m[0][2] * dz,
        m[1][0] * dx + m[1][1] * dy + m[1][2] * dz,
        m[2][0] * dx + m[2][1] * dy + m[2][2] * dz,
      ];
    },
  };
}
const FOG_COL = [26, 17, 11];
const FOG_DENSITY = 0.016;
function fogged(color, dist) {
  const f = 1 - Math.exp(-FOG_DENSITY * Math.max(0, dist));
  return mix(color, FOG_COL, clamp(f, 0, 1));
}

/* ------------------------------------------------------------- polygon fill */
// Convex quad, per-vertex colors (already fogged). Painter-sorted by caller.
function fillQuad(buf, W, H, cam, pts, colors, alpha = 1, additive = false) {
  const NEAR = 0.35;
  // transform + near-plane clip (Sutherland-Hodgman)
  let P = [],
    C = [];
  for (let i = 0; i < 4; i++) {
    const c = cam.toCam(pts[i]);
    P.push(c);
    C.push(colors[i]);
  }
  const clip = (inP, inC) => {
    const outP = [],
      outC = [];
    for (let i = 0; i < inP.length; i++) {
      const j = (i + 1) % inP.length;
      const a = inP[i],
        b = inP[j];
      const ca = inC[i],
        cb = inC[j];
      const ain = a[2] >= NEAR,
        bin = b[2] >= NEAR;
      if (ain) {
        outP.push(a);
        outC.push(ca);
      }
      if (ain !== bin) {
        const t = (NEAR - a[2]) / (b[2] - a[2]);
        outP.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), NEAR]);
        outC.push(mix(ca, cb, t));
      }
    }
    return [outP, outC];
  };
  [P, C] = clip(P, C);
  if (P.length < 3) return;
  // project
  const S = P.map((p) => [cam.cx + (p[0] * cam.f) / p[2], cam.cy - (p[1] * cam.f) / p[2]]);
  let ymin = Infinity,
    ymax = -Infinity;
  for (const s of S) {
    ymin = Math.min(ymin, s[1]);
    ymax = Math.max(ymax, s[1]);
  }
  ymin = Math.max(0, Math.ceil(ymin));
  ymax = Math.min(H - 1, Math.floor(ymax));
  const n = P.length;
  for (let y = ymin; y <= ymax; y++) {
    const sy = y + 0.5;
    const xs = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const y0 = S[i][1],
        y1 = S[j][1];
      if (y0 === y1) continue;
      if (sy >= Math.min(y0, y1) && sy < Math.max(y0, y1)) {
        const t = (sy - y0) / (y1 - y0);
        xs.push([lerp(S[i][0], S[j][0], t), t, i]);
      }
    }
    if (xs.length < 2) continue;
    xs.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const [xl, tl, il] = xs[k],
        [xr, tr, ir] = xs[k + 1];
      const jl = (il + 1) % n,
        jr = (ir + 1) % n;
      const cl = mix(C[il], C[jl], tl),
        cr = mix(C[ir], C[jr], tr);
      const x0 = Math.max(0, Math.ceil(xl - 0.5)),
        x1 = Math.min(W - 1, Math.floor(xr + 0.5));
      const span = xr - xl || 1;
      for (let x = x0; x <= x1; x++) {
        const t = clamp((x + 0.5 - xl) / span, 0, 1);
        const o = (y * W + x) * 4;
        const r = lerp(cl[0], cr[0], t),
          g = lerp(cl[1], cr[1], t),
          b = lerp(cl[2], cr[2], t);
        if (additive) {
          buf[o] = clamp(buf[o] + r * alpha, 0, 255);
          buf[o + 1] = clamp(buf[o + 1] + g * alpha, 0, 255);
          buf[o + 2] = clamp(buf[o + 2] + b * alpha, 0, 255);
        } else {
          buf[o] = lerp(buf[o], r, alpha);
          buf[o + 1] = lerp(buf[o + 1], g, alpha);
          buf[o + 2] = lerp(buf[o + 2], b, alpha);
        }
      }
    }
  }
}

/* ------------------------------------------------------------------- glow */
function addGlow(buf, W, H, sx, sy, radius, color, intensity) {
  const x0 = Math.max(0, Math.floor(sx - radius)),
    x1 = Math.min(W - 1, Math.ceil(sx + radius));
  const y0 = Math.max(0, Math.floor(sy - radius)),
    y1 = Math.min(H - 1, Math.ceil(sy + radius));
  const r2 = radius * radius;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d2 = (x + 0.5 - sx) ** 2 + (y + 0.5 - sy) ** 2;
      if (d2 >= r2) continue;
      const f = (1 - d2 / r2) ** 2 * intensity;
      const o = (y * W + x) * 4;
      buf[o] = clamp(buf[o] + color[0] * f, 0, 255);
      buf[o + 1] = clamp(buf[o + 1] + color[1] * f, 0, 255);
      buf[o + 2] = clamp(buf[o + 2] + color[2] * f, 0, 255);
    }
  }
}
// project world point -> screen (or null if behind)
function project(cam, p) {
  const c = cam.toCam(p);
  if (c[2] < 0.35) return null;
  return [cam.cx + (c[0] * cam.f) / c[2], cam.cy - (c[1] * cam.f) / c[2], c[2]];
}

/* -------------------------------------------------------------- scene build */
// Corridor half width: narrow inside the mall, atrium opens up.
function corridorHalfWidth(z) {
  return lerp(6, 15, smoothstep(36, 48, z));
}
const FLOOR_Y = 0,
  CEIL_Y = 7;

// Camera keyframes: p in [0,1] -> {x,y,z,pitch}
const CAM_PATH = [
  [0.0, 0.0, 2.9, -32, 0.005],
  [0.09, 0.9, 2.9, -21, 0.01],
  [0.16, 0.4, 2.9, -11, 0.02],
  [0.24, 0.0, 2.7, -3.5, 0.03],
  [0.34, -0.4, 2.6, 3.0, 0.02],
  [0.5, 0.4, 2.8, 15.0, 0.0],
  [0.62, -0.5, 3.0, 27.0, -0.01],
  [0.74, 0.5, 3.3, 39.0, -0.02],
  [0.86, 0.0, 4.3, 50.0, -0.055],
  [1.0, -0.3, 5.1, 57.0, -0.085],
];
function cameraAt(p) {
  let i = 0;
  while (i < CAM_PATH.length - 2 && p > CAM_PATH[i + 1][0]) i++;
  const a = CAM_PATH[i],
    b = CAM_PATH[i + 1];
  const t = smoothstep(a[0], b[0], p);
  return {
    pos: [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)],
    pitch: lerp(a[4], b[4], t),
    yaw: 0.028 * Math.sin(p * Math.PI * 2.2),
  };
}

const GOLD = [232, 178, 90];
const AMBER = [217, 138, 43];
const CREAM = [245, 227, 192];
const SIGN_COLS = [GOLD, AMBER, CREAM, [214, 120, 60]];

// Static dust field — generated ONCE so particles keep their identity across frames.
const DUST = (() => {
  const r = mulberry32(42);
  const arr = [];
  for (let i = 0; i < 130; i++) {
    arr.push([(r() - 0.5) * 26, r() * (CEIL_Y - 0.4) + 0.2, -34 + r() * 100]);
  }
  return arr;
})();

function buildScene(p) {
  const quads = []; // {pts, colors, alpha, additive}
  const glows = []; // {p, r, color, i}
  const camPos = cameraAt(p).pos;

  const quad = (pts, color, opts = {}) => {
    const dist = opts.dist ?? avgDist(pts, camPos);
    const c = fogged(color, dist);
    quads.push({ pts, colors: [c, c, c, c], alpha: opts.alpha ?? 1, additive: !!opts.additive });
  };
  const glow = (p3, r, color, i) => {
    const d = Math.hypot(p3[0] - camPos[0], p3[1] - camPos[1], p3[2] - camPos[2]);
    glows.push({ p: p3, r, color, i: i * 0.5 * clamp(1 - d / 90, 0.05, 1) });
  };

  const inside = smoothstep(-3, 3.5, camPos[2]); // 0 outside -> 1 inside

  /* ---- exterior ground / forecourt (asphalt) ---- */
  quad(
    [
      [-46, -0.02, -70],
      [46, -0.02, -70],
      [46, -0.02, 0.4],
      [-46, -0.02, 0.4],
    ],
    [22, 18, 15],
    { dist: 18 },
  );
  // parking stripes
  for (let i = -4; i <= 4; i++) {
    if (Math.abs(i) < 1) continue;
    quad(
      [
        [i * 4 - 1.7, 0.0, -16],
        [i * 4 - 1.5, 0.0, -16],
        [i * 4 - 1.5, 0.0, -8],
        [i * 4 - 1.7, 0.0, -8],
      ],
      [58, 48, 34],
      { alpha: 0.5, dist: 14 + Math.abs(i) * 2 },
    );
  }
  // warm light reflection pools on asphalt
  for (const [lx, lz] of [
    [-7, -11],
    [7, -11],
    [-7, -21],
    [7, -21],
    [0, -4],
  ]) {
    glow([lx, 0.05, lz], 3.6, [110, 76, 36], 0.3);
  }

  /* ---- facade at z = 0 with entrance hole ---- */
  const FW = 13,
    FH = 9.5;
  const hole = { x0: -2.3, x1: 2.3, y0: 0, y1: 4.7 };
  const facadeCol = [30, 24, 19];
  // four wall pieces around the hole
  quad(
    [
      [-FW, 0, 0],
      [hole.x0, 0, 0],
      [hole.x0, FH, 0],
      [-FW, FH, 0],
    ],
    facadeCol,
    { dist: -camPos[2] + 1 },
  );
  quad(
    [
      [hole.x1, 0, 0],
      [FW, 0, 0],
      [FW, FH, 0],
      [hole.x1, FH, 0],
    ],
    facadeCol,
    { dist: -camPos[2] + 1 },
  );
  quad(
    [
      [hole.x0, hole.y1, 0],
      [hole.x1, hole.y1, 0],
      [hole.x1, FH, 0],
      [hole.x0, FH, 0],
    ],
    facadeCol,
    { dist: -camPos[2] + 1 },
  );
  // vertical light strips on facade
  for (let i = -5; i <= 5; i++) {
    if (Math.abs(i) <= 1) continue;
    quad(
      [
        [i * 1.15 - 0.05, 0.3, 0.02],
        [i * 1.15 + 0.05, 0.3, 0.02],
        [i * 1.15 + 0.05, FH - 0.8, 0.02],
        [i * 1.15 - 0.05, FH - 0.8, 0.02],
      ],
      [130, 92, 42],
      { alpha: 0.95, dist: -camPos[2] + 1 },
    );
  }
  // glowing signage band above entrance
  quad(
    [
      [-4.4, 6.2, 0.06],
      [4.4, 6.2, 0.06],
      [4.4, 7.6, 0.06],
      [-4.4, 7.6, 0.06],
    ],
    GOLD,
    { alpha: 0.95, dist: -camPos[2] + 1 },
  );
  glow([0, 6.9, 0.5], 6, GOLD, 0.5);
  // side wings angling toward the viewer
  for (const s of [-1, 1]) {
    quad(
      [
        [s * FW, 0, 0],
        [s * (FW + 4), 0, -15],
        [s * (FW + 4), FH + 1, -15],
        [s * FW, FH + 1, 0],
      ],
      [24, 19, 15],
      { dist: 10 },
    );
    // wing edge light
    quad(
      [
        [s * FW, FH + 1, 0],
        [s * (FW + 4), FH + 1, -15],
        [s * (FW + 4), FH + 1.12, -15],
        [s * FW, FH + 1.12, 0],
      ],
      [110, 74, 32],
      { alpha: 0.85, dist: 10 },
    );
  }
  // entrance canopy
  quad(
    [
      [-3.6, 4.75, 2.2],
      [3.6, 4.75, 2.2],
      [3.6, 4.75, -3.2],
      [-3.6, 4.75, -3.2],
    ],
    [26, 21, 17],
    { dist: 4 },
  );
  quad(
    [
      [-3.6, 4.72, 2.2],
      [3.6, 4.72, 2.2],
      [3.6, 4.72, -3.2],
      [-3.6, 4.72, -3.2],
    ],
    [140, 96, 44],
    { alpha: 0.8, dist: 4 },
  );
  glow([0, 4.3, 0], 5, [200, 150, 80], 0.5);
  // door frames
  for (const s of [-1, 1]) {
    quad(
      [
        [s * hole.x1 - (s > 0 ? 0 : 0.22), hole.y0, 0.03],
        [s * hole.x1, hole.y0, 0.03],
        [s * hole.x1, hole.y1, 0.03],
        [s * hole.x1 - (s > 0 ? 0 : 0.22), hole.y1, 0.03],
      ],
      [120, 84, 38],
      { alpha: 0.9, dist: -camPos[2] + 1 },
    );
  }

  /* ---- cars on the forecourt ---- */
  const cars = [
    [-6.5, -13, 0],
    [7.2, -19, 0.4],
    [-8.5, -24, -0.15],
    [5.5, -27, 0.1],
  ];
  for (const [cx0, cz, yaw] of cars) {
    const c = Math.cos(yaw),
      s = Math.sin(yaw);
    const P = (x, y, z) => [cx0 + x * c - z * s, y, cz + x * s + z * c];
    const body = [46, 40, 36];
    quad([P(-1.1, 0.25, -2.3), P(1.1, 0.25, -2.3), P(1.1, 0.25, 2.3), P(-1.1, 0.25, 2.3)], body, {
      dist: Math.abs(cz - camPos[2]),
    });
    quad([P(-1.05, 0.85, -1.5), P(1.05, 0.85, -1.5), P(1.05, 0.85, 1.4), P(-1.05, 0.85, 1.4)], [60, 52, 46], {
      dist: Math.abs(cz - camPos[2]),
    });
    quad([P(-1.1, 0.25, 2.3), P(1.1, 0.25, 2.3), P(1.05, 0.85, 1.4), P(-1.05, 0.85, 1.4)], [70, 62, 55], {
      dist: Math.abs(cz - camPos[2]),
    });
    glow(P(0, 0.6, 2.5), 1.3, [255, 120, 60], 0.55); // tail lights
    glow(P(-0.7, 0.6, 2.5), 0.8, [255, 90, 50], 0.4);
    glow(P(0.7, 0.6, 2.5), 0.8, [255, 90, 50], 0.4);
    glow(P(0, 0.6, -2.5), 1.5, [255, 210, 150], 0.3); // headlights
  }
  // light poles
  for (const [px, pz] of [
    [-7.5, -11],
    [7.5, -11],
    [-7.5, -21],
    [7.5, -21],
  ]) {
    quad(
      [
        [px - 0.07, 0, pz],
        [px + 0.07, 0, pz],
        [px + 0.07, 4.6, pz],
        [px - 0.07, 4.6, pz],
      ],
      [35, 30, 25],
      { dist: Math.abs(pz - camPos[2]) },
    );
    glow([px, 4.6, pz], 2.0, [255, 214, 150], 0.5);
  }

  /* ---- interior floor + ceiling (drawn far -> near by painter sort) ---- */
  const farZ = 66,
    wFar = corridorHalfWidth(farZ);
  // floor: single big quad, color varies via two quads for subtle banding
  quad(
    [
      [-wFar, FLOOR_Y, farZ],
      [wFar, FLOOR_Y, farZ],
      [wFar, FLOOR_Y, 0],
      [-wFar, FLOOR_Y, 0],
    ],
    [38, 28, 19],
    { dist: 24 },
  );
  for (let z = 62; z > 2; z -= 6) {
    const wA = corridorHalfWidth(z),
      wB = corridorHalfWidth(z - 6);
    quad(
      [
        [-wA, FLOOR_Y + 0.005, z],
        [wA, FLOOR_Y + 0.005, z],
        [wB, FLOOR_Y + 0.005, z - 6],
        [-wB, FLOOR_Y + 0.005, z - 6],
      ],
      [46, 34, 22],
      { alpha: 0.5, dist: Math.abs(z - camPos[2]) },
    );
  }
  // center inlay strip
  quad(
    [
      [-0.5, FLOOR_Y + 0.01, 64],
      [0.5, FLOOR_Y + 0.01, 64],
      [0.5, FLOOR_Y + 0.01, 2],
      [-0.5, FLOOR_Y + 0.01, 2],
    ],
    [96, 70, 34],
    { alpha: 0.55, dist: 20 },
  );

  /* ---- side walls + storefronts (both sides) ---- */
  const wallQuads = [];
  for (const s of [-1, 1]) {
    const w0 = corridorHalfWidth(0),
      w1 = corridorHalfWidth(farZ);
    wallQuads.push({
      pts: [
        [s * w0, 0, 0],
        [s * w1, 0, farZ],
        [s * w1, CEIL_Y, farZ],
        [s * w0, CEIL_Y, 0],
      ],
      color: [31, 24, 18],
      z: 20,
    });
  }
  for (const q of wallQuads) quad(q.pts, q.color, { dist: 20 });

  // storefronts: rows on each side, z from 6..44
  let si = 0;
  for (let z = 11; z <= 43; z += 8) {
    const side = si % 2 === 0 ? -1 : 1;
    const w = corridorHalfWidth(z);
    const x0 = side * (w - 0.55),
      x1 = side * (w - 0.05);
    const col = SIGN_COLS[si % SIGN_COLS.length];
    const d = Math.abs(z - camPos[2]);
    // shop interior (dark warm)
    quad(
      [
        [x0, 0.15, z - 2.6],
        [x1, 0.15, z - 2.6],
        [x1, 3.6, z - 2.6],
        [x0, 3.6, z - 2.6],
      ],
      [44, 29, 16],
      { dist: d },
    );
    quad(
      [
        [x0, 0.15, z + 2.6],
        [x1, 0.15, z + 2.6],
        [x1, 3.6, z + 2.6],
        [x0, 3.6, z + 2.6],
      ],
      [44, 29, 16],
      { dist: d },
    );
    // sign band
    quad(
      [
        [x0, 3.7, z - 2.6],
        [x1, 3.7, z - 2.6],
        [x1, 4.55, z - 2.6],
        [x0, 4.55, z - 2.6],
      ],
      col,
      { alpha: 0.92, dist: d },
    );
    quad(
      [
        [x0, 3.7, z + 2.6],
        [x1, 3.7, z + 2.6],
        [x1, 4.55, z + 2.6],
        [x0, 4.55, z + 2.6],
      ],
      col,
      { alpha: 0.92, dist: d },
    );
    // mullions
    for (let mz = z - 2.2; mz <= z + 2.6; mz += 1.1) {
      quad(
        [
          [x0 - 0.02, 0.15, mz],
          [x1 + 0.02, 0.15, mz],
          [x1 + 0.02, 3.6, mz],
          [x0 - 0.02, 3.6, mz],
        ],
        [18, 14, 11],
        { alpha: 0.9, dist: d },
      );
    }
    // practicals inside shop
    glow([(x0 + x1) / 2, 3.3, z - 2.2], 1.4, col, 0.45);
    glow([(x0 + x1) / 2, 3.3, z + 2.2], 1.4, col, 0.45);
    // floor reflection of sign
    glow([(x0 + x1) / 2, 0.1, z], 2.0, col, 0.16);
    si++;
  }

  /* ---- escalators on the left wall ---- */
  for (let k = 0; k < 2; k++) {
    const z0 = 47 + k * 8,
      z1 = z0 + 7;
    const w = corridorHalfWidth(z0);
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const ta = i / steps,
        tb = (i + 1) / steps;
      const ya = lerp(0.3, 3.3, ta),
        yb = lerp(0.3, 3.3, tb);
      const za = lerp(z0, z1, ta),
        zb = lerp(z0, z1, tb);
      quad(
        [
          [-w + 0.02, ya, za],
          [-w + 0.02, yb, zb],
          [-w + 0.02, yb, zb + 0.45],
          [-w + 0.02, ya, za + 0.45],
        ],
        [70, 52, 30],
        { dist: Math.abs(z0 - camPos[2]) },
      );
    }
    glow([-w + 0.1, 3.5, z0 + 3], 1.7, GOLD, 0.4);
  }

  /* ---- atrium balconies (upper floors) ---- */
  for (const [by, zA, zB] of [
    [3.7, 40, 66],
    [CEIL_Y + 0.9, 44, 66],
  ]) {
    for (const s of [-1, 1]) {
      const wA = corridorHalfWidth(zA),
        wB = corridorHalfWidth(zB);
      quad(
        [
          [s * wA, by, zA],
          [s * wB, by, zB],
          [s * wB, by + 0.35, zB],
          [s * wA, by + 0.35, zA],
        ],
        [40, 30, 21],
        { dist: Math.abs(zA - camPos[2]) },
      );
      quad(
        [
          [s * wA, by + 0.35, zA],
          [s * wB, by + 0.35, zB],
          [s * wB, by + 0.5, zB],
          [s * wA, by + 0.5, zA],
        ],
        [150, 104, 46],
        { alpha: 0.9, dist: Math.abs(zA - camPos[2]) },
      );
      // railing posts
      for (let z = zA + 1; z < zB; z += 4) {
        const w = corridorHalfWidth(z);
        quad(
          [
            [s * w - 0.06, by, z],
            [s * w + 0.06, by, z],
            [s * w + 0.06, by + 1.0, z],
            [s * w - 0.06, by + 1.0, z],
          ],
          [120, 88, 40],
          { alpha: 0.75, dist: Math.abs(z - camPos[2]) },
        );
      }
    }
  }

  /* ---- ceiling + skylight ---- */
  const wCeil = corridorHalfWidth(farZ);
  quad(
    [
      [-wCeil, CEIL_Y, farZ],
      [wCeil, CEIL_Y, farZ],
      [wCeil, CEIL_Y, 0],
      [-wCeil, CEIL_Y, 0],
    ],
    [20, 16, 13],
    { dist: 22 },
  );
  // skylight: bright band in the ceiling z 46..64
  quad(
    [
      [-3.4, CEIL_Y - 0.01, 64],
      [3.4, CEIL_Y - 0.01, 64],
      [3.4, CEIL_Y - 0.01, 46],
      [-3.4, CEIL_Y - 0.01, 46],
    ],
    [255, 236, 200],
    { alpha: 0.95, dist: 40 },
  );
  glow([0, CEIL_Y - 0.4, 56], 8, [255, 230, 180], 0.55);
  // ceiling practicals
  for (let z = 4; z <= 62; z += 5) {
    const w = corridorHalfWidth(z);
    for (const s of [-1, 1]) {
      quad(
        [
          [s * (w - 1.4) - 0.35, CEIL_Y - 0.06, z],
          [s * (w - 1.4) + 0.35, CEIL_Y - 0.06, z],
          [s * (w - 1.4) + 0.35, CEIL_Y - 0.06, z + 0.5],
          [s * (w - 1.4) - 0.35, CEIL_Y - 0.06, z + 0.5],
        ],
        [255, 220, 160],
        { alpha: 0.9, dist: Math.abs(z - camPos[2]) },
      );
      glow([s * (w - 1.4), CEIL_Y - 0.3, z + 0.2], 1.8, [255, 214, 150], 0.42);
    }
  }
  // light beams from ceiling (soft additive blobs along a line)
  const beam = (x0, z0, len, spread, col, inten) => {
    const stepsN = 10;
    for (let i = 0; i < stepsN; i++) {
      const t = i / (stepsN - 1);
      const y = lerp(CEIL_Y, 0.4, t);
      const z = z0 + len * t;
      const r = lerp(1.0, spread, t);
      glow([x0, y, z], r, col, inten * (1 - t * 0.55));
    }
  };
  for (const [bx, bz] of [
    [-3.5, 10],
    [3.5, 18],
    [-3.5, 30],
    [3.5, 38],
    [-2.5, 50],
    [2.5, 54],
  ]) {
    beam(bx, bz, 9, 2.6, [255, 206, 140], 0.26 * (0.35 + 0.65 * inside));
  }
  // skylight shaft (bright, straight down)
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    glow([0, lerp(CEIL_Y - 0.2, 0.5, t), 56], lerp(2.2, 5.5, t), [255, 232, 190], 0.3);
  }

  /* ---- far end wall of the atrium (z = 66) ---- */
  {
    const wEnd = corridorHalfWidth(66);
    quad(
      [
        [-wEnd, 0, 66],
        [wEnd, 0, 66],
        [wEnd, CEIL_Y + 1.4, 66],
        [-wEnd, CEIL_Y + 1.4, 66],
      ],
      [24, 19, 15],
      { dist: Math.abs(66 - camPos[2]) },
    );
    // glowing back-wall artwork
    quad(
      [
        [-5, 1.6, 65.9],
        [5, 1.6, 65.9],
        [5, 5.4, 65.9],
        [-5, 5.4, 65.9],
      ],
      [120, 84, 38],
      { alpha: 0.85, dist: Math.abs(66 - camPos[2]) },
    );
    glow([0, 3.5, 65.5], 5, GOLD, 0.45);
    // vertical light strips
    for (let i = -6; i <= 6; i++) {
      if (Math.abs(i) < 2) continue;
      quad(
        [
          [i - 0.06, 0.4, 65.95],
          [i + 0.06, 0.4, 65.95],
          [i + 0.06, 6.6, 65.95],
          [i - 0.06, 6.6, 65.95],
        ],
        [96, 66, 30],
        { alpha: 0.8, dist: Math.abs(66 - camPos[2]) },
      );
    }
  }

  /* ---- entrance interior glow seen through the doors ---- */
  glow([0, 3.2, 1.5], 6 * (1 - inside * 0.6), [255, 200, 130], 0.5);

  return { quads, glows, dust: null, inside };
}

function avgDist(pts, camPos) {
  let d = 0;
  for (const p of pts) d += Math.hypot(p[0] - camPos[0], p[1] - camPos[1], p[2] - camPos[2]);
  return d / pts.length;
}

/* ------------------------------------------------------------------ render */
function renderFrame(W, H, p, seed) {
  const rnd = mulberry32(seed);
  const buf = Buffer.alloc(W * H * 4, 0);
  const cam = cameraAt(p);
  const camera = makeCamera(cam.pos, cam.yaw, cam.pitch, H * 1.15, W, H);
  const scene = buildScene(p);
  const inside = scene.inside;

  /* sky gradient (dusk) with stars + distant city */
  const skyTop = [13, 11, 20],
    skyMid = [43, 26, 34],
    skyHor = [138, 74, 36];
  for (let y = 0; y < H; y++) {
    const ty = y / H;
    let c;
    if (ty < 0.55) c = mix(skyTop, skyMid, ty / 0.55);
    else c = mix(skyMid, skyHor, (ty - 0.55) / 0.45);
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      buf[o] = c[0];
      buf[o + 1] = c[1];
      buf[o + 2] = c[2];
      buf[o + 3] = 255;
    }
  }
  // stars
  for (let i = 0; i < 70; i++) {
    const sx = rnd() * W,
      sy = rnd() * H * 0.5;
    const b = 0.25 + rnd() * 0.75;
    addGlow(buf, W, H, sx, sy, 1.1, [255, 240, 220], b * 0.45);
  }
  // distant skyline silhouette
  for (let i = 0; i < 14; i++) {
    const bw = 20 + rnd() * 60,
      bh = 10 + rnd() * 46;
    const bx = rnd() * (W + 100) - 50,
      by = H * 0.62 - bh;
    for (let y = Math.max(0, by | 0); y < H * 0.62; y++) {
      for (let x = Math.max(0, bx | 0); x < Math.min(W, bx + bw); x++) {
        const o = (y * W + x) * 4;
        buf[o] *= 0.55;
        buf[o + 1] *= 0.5;
        buf[o + 2] *= 0.5;
      }
    }
    // a few lit windows
    for (let k = 0; k < 5; k++) {
      const wx = bx + 4 + rnd() * (bw - 8),
        wy = by + 4 + rnd() * (bh - 8);
      if (wy < H * 0.6) addGlow(buf, W, H, wx, wy, 1.0, [255, 190, 120], 0.4);
    }
  }

  /* interior background over sky (fades in as we enter) */
  if (inside > 0.001) {
    for (let y = 0; y < H; y++) {
      const ty = y / H;
      const c = mix([11, 8, 6], [23, 16, 11], ty);
      for (let x = 0; x < W; x++) {
        const o = (y * W + x) * 4;
        buf[o] = lerp(buf[o], c[0], inside);
        buf[o + 1] = lerp(buf[o + 1], c[1], inside);
        buf[o + 2] = lerp(buf[o + 2], c[2], inside);
      }
    }
  }

  /* geometry: painter's algorithm (far to near) */
  const withDist = scene.quads.map((q) => {
    let d = 0;
    for (const pt of q.pts)
      d += Math.hypot(pt[0] - camera.pos[0], pt[1] - camera.pos[1], pt[2] - camera.pos[2]);
    return { q, d: d / 4 };
  });
  withDist.sort((a, b) => b.d - a.d);
  for (const { q } of withDist) fillQuad(buf, W, H, camera, q.pts, q.colors, q.alpha, q.additive);

  /* additive glows (after opaque, far to near) */
  const g2 = scene.glows
    .map((g) => {
      const s = project(camera, g.p);
      return { g, s };
    })
    .filter((x) => x.s);
  g2.sort((a, b) => b.s[2] - a.s[2]);
  for (const { g, s } of g2) {
    const r = (g.r * camera.f) / s[2];
    if (r > 0.4 && r < W * 1.5) addGlow(buf, W, H, s[0], s[1], r, g.color, g.i);
  }

  /* dust particles (static field, parallax from camera motion) */
  const t = p * Math.PI * 2;
  for (const d of DUST) {
    const dp = [d[0] + Math.sin(t + d[2]) * 0.3, d[1] + Math.sin(t * 0.7 + d[0]) * 0.25, d[2]];
    const s = project(camera, dp);
    if (!s) continue;
    const r = clamp((0.05 * camera.f) / s[2], 0.4, 2.4);
    const b = 0.32 * clamp(1 - s[2] / 80, 0.05, 1) * (0.6 + 0.4 * Math.sin(t * 3 + d[0] * 5));
    if (b > 0.02) addGlow(buf, W, H, s[0], s[1], r, [255, 224, 180], b);
  }

  /* vignette + warm tone + grain */
  const vigR2 = (W * 0.62) ** 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const dx = x - W / 2,
        dy = y - H / 2;
      const v = 1 - 0.5 * clamp((dx * dx + dy * dy) / vigR2, 0, 1) ** 1.5;
      const n = (rnd() - 0.5) * 9;
      buf[o] = clamp((buf[o] * 1.045 + n) * v, 0, 255);
      buf[o + 1] = clamp((buf[o + 1] * 0.995 + n) * v, 0, 255);
      buf[o + 2] = clamp((buf[o + 2] * 0.93 + n) * v, 0, 255);
      buf[o + 3] = 255;
    }
  }
  return buf;
}

/* -------------------------------------------------------------------- main */
function generate(dir, N, W, H, seedBase) {
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < N; i++) {
    const p = i / (N - 1);
    const buf = renderFrame(W, H, p, seedBase + i * 7919);
    const name = `f_${String(i + 1).padStart(4, '0')}.png`;
    writeFileSync(join(dir, name), encodePNG(W, H, buf));
    if (i % 20 === 0) console.log(`  ${dir}: ${i + 1}/${N}`);
  }
}
function toWebp(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.png'));
  for (const f of files) {
    execSync(
      `convert "${join(dir, f)}" -quality 54 -define webp:method=5 -define webp:alpha-filter=none "${join(dir, f.replace('.png', '.webp'))}"`,
      { stdio: 'ignore' },
    );
    rmSync(join(dir, f));
  }
}

console.log('Generating desktop frames...');
generate(join(ROOT, 'public/frames'), N_DESKTOP, 960, 540, 1000);
console.log('Generating mobile frames...');
generate(join(ROOT, 'public/frames-m'), N_MOBILE, 480, 270, 5000);
console.log('Converting to WebP...');
toWebp(join(ROOT, 'public/frames'));
toWebp(join(ROOT, 'public/frames-m'));
console.log('Done.');
