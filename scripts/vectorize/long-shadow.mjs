#!/usr/bin/env bun
/* A flat-design long shadow: the silhouette (polygons + ellipses) swept along a diagonal to the canvas edge,
   traced as one clean polygon (SVG path data). Paint it under the silhouette with a linear gradient along the
   sweep (measure the stops from the source pixels; typically black 15 % -> 0 %).
   usage: bun long-shadow.mjs --size 400,400 --shapes shapes.json [--dir 1,1] [--ss 4] [--eps 0.4] --out shadow.txt
   shapes.json: [{ "polygonFile": "dense.json" }, { "polygon": [[x,y],...] }, { "ellipse": { "cx":..,"cy":..,"rx":..,"ry":.. } }] */
import fs from "node:fs";
import { args, fillPolygon, fillEllipse, dp } from "./lib.mjs";
const { opt } = args(process.argv.slice(2));
const [W, H] = String(opt.size).split(",").map(Number);
const SS = +(opt.ss || 4);
const [dx, dy] = String(opt.dir || "1,1").split(",").map(Number);
const shapes = JSON.parse(fs.readFileSync(String(opt.shapes), "utf8"));
const GW = W * SS, GH = H * SS;
const m = new Uint8Array(GW * GH);
for (const s of shapes) {
  if (s.ellipse) fillEllipse(m, GW, GH, SS, s.ellipse);
  else fillPolygon(m, GW, GH, SS, s.polygon || JSON.parse(fs.readFileSync(s.polygonFile, "utf8")));
}
// sweep: every cell inherits its upstream neighbour along the direction (raster order follows the direction)
const ys = dy >= 0 ? [...Array(GH).keys()] : [...Array(GH).keys()].reverse();
const xs = dx >= 0 ? [...Array(GW).keys()] : [...Array(GW).keys()].reverse();
for (const gy of ys) for (const gx of xs) {
  const ux = gx - dx, uy = gy - dy;
  if (ux >= 0 && uy >= 0 && ux < GW && uy < GH && m[uy * GW + ux]) m[gy * GW + gx] = 1;
}
// trace the binary mask
const v = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH ? 0 : m[y * GW + x]);
const segs = [];
for (let y = -1; y < GH; y++) for (let x = -1; x < GW; x++) {
  const a = v(x, y), b = v(x + 1, y), c = v(x + 1, y + 1), d = v(x, y + 1);
  const code = (a << 3) | (b << 2) | (c << 1) | d;
  if (code === 0 || code === 15) continue;
  const X = x + 0.5, Y = y + 0.5;
  const T = [X + 0.5, Y], R = [X + 1, Y + 0.5], B = [X + 0.5, Y + 1], L = [X, Y + 0.5];
  const tab = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: [[L, T], [B, R]], 6: [[T, B]], 7: [[L, T]], 8: [[L, T]],
    9: [[T, B]], 10: [[L, B], [T, R]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]] }[code];
  for (const sg of tab) segs.push(sg);
}
const key = (p) => `${p[0]},${p[1]}`;
const adj = new Map();
segs.forEach((s, i) => s.forEach((p) => { const k = key(p); if (!adj.has(k)) adj.set(k, []); adj.get(k).push(i); }));
const used = new Uint8Array(segs.length);
let best = null;
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
  if (!best || loop.length > best.length) best = loop;
}
const pts = best.map(([x, y]) => [Math.max(0, Math.min(W, x / SS)), Math.max(0, Math.min(H, y / SS))]);
let far = 0;
pts.forEach((p, i) => { if (Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) > Math.hypot(pts[far][0] - pts[0][0], pts[far][1] - pts[0][1])) far = i; });
const eps = +(opt.eps || 0.4);
const simp = [...dp(pts.slice(0, far + 1), eps).slice(0, -1), ...dp(pts.slice(far), eps).slice(0, -1)];
const f = (n) => Math.round(n * 100) / 100;
fs.writeFileSync(String(opt.out), "M " + simp.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L ") + " Z");
console.log(`shadow: ${best.length} boundary pts → ${simp.length} vertices → ${opt.out}`);
