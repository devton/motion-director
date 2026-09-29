#!/usr/bin/env bun
/* Find upward-pointing tips (spikes, flames, ears) as local minima of the shape's top profile, with sub-pixel
   crossing and a prominence filter. Feed the result to corners.mjs.
   usage: bun tips.mjs <raw> <W> <H> --field <spec> [--x0 0] [--x1 W] [--y0 0] [--y1 H] [--prominence 5] */
import { loadRaw, args, fieldFn } from "./lib.mjs";
const { pos, opt } = args(process.argv.slice(2));
const [raw, W, H] = [pos[0], +pos[1], +pos[2]];
const img = loadRaw(raw, W, H);
const f = fieldFn(String(opt.field));
const x0 = +(opt.x0 || 0), x1 = +(opt.x1 || W - 1), y0 = +(opt.y0 || 0), y1 = +(opt.y1 || H - 1);
const prof = [];
for (let x = x0; x <= x1; x++) {
  let yv = null;
  for (let y = y0; y < y1; y++) {
    const a = f(img.px(x, y)), b = f(img.px(x, y + 1));
    if (a < 0.5 && b >= 0.5) { yv = y + 0.5 + (0.5 - a) / (b - a); break; }
  }
  prof.push([x + 0.5, yv]);
}
const prom = +(opt.prominence || 5);
const tips = [];
for (let i = 3; i < prof.length - 3; i++) {
  const [x, y] = prof[i];
  if (y == null) continue;
  let isMin = true;
  for (let k = -3; k <= 3; k++) if (k && prof[i + k][1] != null && prof[i + k][1] < y) isMin = false;
  if (!isMin) continue;
  let l = 0, r = 0;
  for (let k = 1; k <= 12; k++) {
    if (prof[i - k] && prof[i - k][1] != null) l = Math.max(l, prof[i - k][1] - y);
    if (prof[i + k] && prof[i + k][1] != null) r = Math.max(r, prof[i + k][1] - y);
  }
  if (Math.min(l, r) > prom && !tips.some((t) => Math.abs(t[0] - x) < 4)) tips.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
}
console.log(JSON.stringify(tips));
