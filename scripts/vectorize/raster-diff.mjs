#!/usr/bin/env bun
/* Validate a vector rebuild without a browser: rasterize the layer stack with SS x SS supersampling and diff it
   against the source raw. Prints the mean absolute difference per channel and the count of pixels off by > 30;
   --out writes the render (raw RGB24; view it with ffmpeg -f rawvideo -pix_fmt rgb24 -s WxH -i render.rgb x.png).
   usage: bun raster-diff.mjs <raw> <W> <H> --layers layers.json [--ss 4] [--out render.rgb]
   layers.json (painted in order):
     { "fill": [r,g,b] }
     { "shadow": { "shapes": [...as long-shadow.mjs], "dir": [1,1], "color": [0,0,0], "axis": [1,1],
                   "stops": [[450, 0.15], [540, 0.075], [640, 0.035], [800, 0]] } }   stops along axis·(x,y)
     { "ellipse": { "cx":..,"cy":..,"rx":..,"ry":.. }, "color": [r,g,b], "split": { "x": 199.07, "left": [r,g,b] } }
     { "polygonFile": "dense.json", "color": [r,g,b] }  or  { "polygon": [[x,y],...], "color": [r,g,b] } */
import fs from "node:fs";
import { loadRaw, args, fillPolygon, fillEllipse } from "./lib.mjs";
const { pos, opt } = args(process.argv.slice(2));
const [raw, W, H] = [pos[0], +pos[1], +pos[2]];
const img = loadRaw(raw, W, H);
const SS = +(opt.ss || 4);
const GW = W * SS, GH = H * SS;
const layers = JSON.parse(fs.readFileSync(String(opt.layers), "utf8"));
const loadPoly = (s) => s.polygon || JSON.parse(fs.readFileSync(s.polygonFile, "utf8"));
const masks = layers.map((l) => {
  if (l.fill) return null;
  const m = new Uint8Array(GW * GH);
  if (l.shadow) {
    for (const s of l.shadow.shapes) s.ellipse ? fillEllipse(m, GW, GH, SS, s.ellipse) : fillPolygon(m, GW, GH, SS, loadPoly(s));
    const [dx, dy] = l.shadow.dir || [1, 1];
    const ys = dy >= 0 ? [...Array(GH).keys()] : [...Array(GH).keys()].reverse();
    const xs = dx >= 0 ? [...Array(GW).keys()] : [...Array(GW).keys()].reverse();
    for (const gy of ys) for (const gx of xs) {
      const ux = gx - dx, uy = gy - dy;
      if (ux >= 0 && uy >= 0 && ux < GW && uy < GH && m[uy * GW + ux]) m[gy * GW + gx] = 1;
    }
  } else if (l.ellipse) fillEllipse(m, GW, GH, SS, l.ellipse);
  else fillPolygon(m, GW, GH, SS, loadPoly(l));
  return m;
});
const alphaAt = (stops, s) => {
  if (s <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (s <= stops[i][0]) {
    const [s0, a0] = stops[i - 1], [s1, a1] = stops[i];
    return a0 + ((a1 - a0) * (s - s0)) / (s1 - s0);
  }
  return stops[stops.length - 1][1];
};
const out = Buffer.alloc(W * H * 3);
let tot = 0, bad = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const acc = [0, 0, 0];
  for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) {
    const gx = x * SS + i, gy = y * SS + j, k = gy * GW + gx, X = (gx + 0.5) / SS, Y = (gy + 0.5) / SS;
    let c = [0, 0, 0];
    layers.forEach((l, li) => {
      if (l.fill) { c = l.fill; return; }
      if (!masks[li][k]) return;
      if (l.shadow) {
        const ax = l.shadow.axis || [1, 1];
        const a = alphaAt(l.shadow.stops, ax[0] * X + ax[1] * Y);
        const sc = l.shadow.color || [0, 0, 0];
        c = c.map((v, n) => v * (1 - a) + sc[n] * a);
      } else if (l.split && X < l.split.x) c = l.split.left;
      else c = l.color;
    });
    acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
  }
  const r = acc.map((v) => v / (SS * SS));
  const o = img.px(x, y);
  const d = (Math.abs(r[0] - o[0]) + Math.abs(r[1] - o[1]) + Math.abs(r[2] - o[2])) / 3;
  tot += d;
  if (d > 30) bad++;
  out[(y * W + x) * 3] = r[0]; out[(y * W + x) * 3 + 1] = r[1]; out[(y * W + x) * 3 + 2] = r[2];
}
if (opt.out) fs.writeFileSync(String(opt.out), out);
console.log(`mean abs diff ${(tot / (W * H)).toFixed(2)} per channel · pixels off by > 30: ${bad} of ${W * H}`);
