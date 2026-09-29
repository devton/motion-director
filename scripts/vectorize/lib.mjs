/* Shared helpers for the vectorize scripts: raw RGB I/O, scalar fields, blur, marching squares, simplification,
   polygon rasterization. Dependency-free; run with bun. */
import fs from "node:fs";

export function loadRaw(path, W, H) {
  const buf = fs.readFileSync(path);
  if (buf.length !== W * H * 3) throw new Error(`${path}: expected ${W}x${H}x3 bytes, got ${buf.length}`);
  const px = (x, y) => {
    x = Math.max(0, Math.min(W - 1, x | 0));
    y = Math.max(0, Math.min(H - 1, y | 0));
    const i = (y * W + x) * 3;
    return [buf[i], buf[i + 1], buf[i + 2]];
  };
  return { buf, W, H, px };
}

export const luma = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * A scalar field in [0, 1] that is 1 inside the shape.
 *   luma:<yOut>:<yIn>[:<yOut2>]   JPEG-safe (luma is full resolution). With yOut2 the shape sits between a darker
 *                                 neighbour (yOut) and a lighter one (yOut2).
 *   channel:<r|g|b>:<vIn>:<vOut>  one channel (beware of chroma subsampling in JPEGs)
 *   color:<rrggbb>:<radius>       distance to a colour
 */
export function fieldFn(spec) {
  const [kind, a, b, c] = spec.split(":");
  if (kind === "luma") {
    const yOut = +a, yIn = +b, yOut2 = c === undefined ? null : +c;
    return (rgb) => {
      const Y = luma(rgb);
      if (yOut2 === null || Y <= yIn) return clamp01((Y - yOut) / (yIn - yOut));
      return clamp01((yOut2 - Y) / (yOut2 - yIn));
    };
  }
  if (kind === "channel") {
    const ch = { r: 0, g: 1, b: 2 }[a];
    const vIn = +b, vOut = +c;
    return (rgb) => clamp01((rgb[ch] - vOut) / (vIn - vOut));
  }
  if (kind === "color") {
    const hex = a.replace("#", "");
    const col = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const radius = +b;
    return (rgb) => clamp01(1 - Math.hypot(rgb[0] - col[0], rgb[1] - col[1], rgb[2] - col[2]) / radius);
  }
  throw new Error(`unknown field spec ${spec}`);
}

export function buildField(img, spec, sigma = 0) {
  const { W, H, px } = img;
  const f = fieldFn(spec);
  let F = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) F[y * W + x] = f(px(x, y));
  if (sigma > 0) F = blur(F, W, H, sigma);
  return F;
}

export function blur(F, W, H, sigma) {
  const R = Math.ceil(sigma * 3);
  const K = [];
  for (let i = -R; i <= R; i++) K.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const KS = K.reduce((s, v) => s + v, 0);
  const cl = (v, m) => Math.max(0, Math.min(m - 1, v));
  const A = new Float32Array(W * H);
  const B = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let s = 0;
    for (let i = -R; i <= R; i++) s += K[i + R] * F[y * W + cl(x + i, W)];
    A[y * W + x] = s / KS;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let s = 0;
    for (let i = -R; i <= R; i++) s += K[i + R] * A[cl(y + i, H) * W + x];
    B[y * W + x] = s / KS;
  }
  return B;
}

/** Marching squares at `iso` over cell centres; returns closed loops (arrays of [x, y]), largest first. */
export function contours(F, W, H, iso = 0.5) {
  const f = (x, y) => F[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
  const edge = (x0, y0, v0, x1, y1, v1) => {
    const t = (iso - v0) / (v1 - v0);
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  };
  const segs = [];
  for (let y = -1; y < H; y++) for (let x = -1; x < W; x++) {
    const a = f(x, y), b = f(x + 1, y), c = f(x + 1, y + 1), d = f(x, y + 1);
    const code = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
    if (code === 0 || code === 15) continue;
    const X = x + 0.5, Y = y + 0.5;
    const T = () => edge(X, Y, a, X + 1, Y, b), R = () => edge(X + 1, Y, b, X + 1, Y + 1, c);
    const Bm = () => edge(X, Y + 1, d, X + 1, Y + 1, c), Lf = () => edge(X, Y, a, X, Y + 1, d);
    const tab = { 1: [[Lf, Bm]], 2: [[Bm, R]], 3: [[Lf, R]], 4: [[T, R]], 5: [[Lf, T], [Bm, R]], 6: [[T, Bm]], 7: [[Lf, T]],
      8: [[Lf, T]], 9: [[T, Bm]], 10: [[Lf, Bm], [T, R]], 11: [[T, R]], 12: [[Lf, R]], 13: [[Bm, R]], 14: [[Lf, Bm]] }[code];
    for (const [p, q] of tab) segs.push([p(), q()]);
  }
  const key = (p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
  const adj = new Map();
  segs.forEach((s, i) => s.forEach((p) => {
    const k = key(p);
    if (!adj.has(k)) adj.set(k, []);
    adj.get(k).push(i);
  }));
  const used = new Uint8Array(segs.length);
  const loops = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const loop = [segs[i][0], segs[i][1]];
    for (;;) {
      const k = key(loop[loop.length - 1]);
      const nx = (adj.get(k) || []).find((j) => !used[j]);
      if (nx === undefined) break;
      used[nx] = 1;
      const s = segs[nx];
      loop.push(key(s[0]) === k ? s[1] : s[0]);
    }
    loops.push(loop);
  }
  return loops.sort((p, q) => q.length - p.length);
}

/** Douglas-Peucker on an open chain. */
export function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const a = pts[0], b = pts[pts.length - 1];
  let idx = -1, dmax = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1);
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= eps) return [a, b];
  return [...dp(pts.slice(0, idx + 1), eps).slice(0, -1), ...dp(pts.slice(idx), eps)];
}

/** Simplify a closed ring: split at the point farthest from the start (a ring has no baseline). */
export function simplifyRing(ring, eps) {
  const r = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring.slice();
  let top = 0;
  r.forEach((p, i) => { if (p[1] < r[top][1]) top = i; });
  const R = [...r.slice(top), ...r.slice(0, top), r[top]];
  let far = 0;
  R.forEach((p, i) => { if (Math.hypot(p[0] - R[0][0], p[1] - R[0][1]) > Math.hypot(R[far][0] - R[0][0], R[far][1] - R[0][1])) far = i; });
  const out = [...dp(R.slice(0, far + 1), eps).slice(0, -1), ...dp(R.slice(far), eps).slice(0, -1)];
  return out.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
}

/** Scanline fill of a polygon into a supersampled mask (SS samples per px). */
export function fillPolygon(mask, GW, GH, SS, poly) {
  for (let gy = 0; gy < GH; gy++) {
    const y = (gy + 0.5) / SS;
    const xs = [];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y)) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil(xs[k] * SS - 0.5)), b = Math.min(GW - 1, Math.floor(xs[k + 1] * SS - 0.5));
      for (let gx = a; gx <= b; gx++) mask[gy * GW + gx] = 1;
    }
  }
}

export function fillEllipse(mask, GW, GH, SS, { cx, cy, rx, ry }) {
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const x = (gx + 0.5) / SS, y = (gy + 0.5) / SS;
    if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) mask[gy * GW + gx] = 1;
  }
}

/** Parse "--key value" flags after positional args. */
export function args(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) opt[argv[i].slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    else pos.push(argv[i]);
  }
  return { pos, opt };
}
