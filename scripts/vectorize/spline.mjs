#!/usr/bin/env bun
/* Closed Catmull-Rom spline through a polygon's vertices, keeping the listed corners sharp (the neighbour is
   mirrored so the tangent follows the chord). Writes the SVG path data and, optionally, a dense polygon
   (12 samples per segment) for rasterizing and for the long-shadow sweep.
   usage: bun spline.mjs <poly.json> [--corners poly.corners.json] --path out.txt [--dense dense.json] */
import fs from "node:fs";
import { args } from "./lib.mjs";
const { pos, opt } = args(process.argv.slice(2));
const P = JSON.parse(fs.readFileSync(pos[0], "utf8"));
const C = opt.corners ? JSON.parse(fs.readFileSync(String(opt.corners), "utf8")) : [];
const isCorner = (p) => C.some((c) => Math.abs(c[0] - p[0]) < 0.05 && Math.abs(c[1] - p[1]) < 0.05);
const N = P.length;
const f = (v) => Math.round(v * 100) / 100;
let d = `M ${f(P[0][0])} ${f(P[0][1])}`;
const dense = [];
for (let i = 0; i < N; i++) {
  const p1 = P[i], p2 = P[(i + 1) % N];
  let p0 = P[(i - 1 + N) % N], p3 = P[(i + 2) % N];
  if (isCorner(p1)) p0 = [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]];
  if (isCorner(p2)) p3 = [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
  const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
  const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
  d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  for (let s = 0; s < 12; s++) {
    const t = s / 12, u = 1 - t;
    dense.push([
      u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
      u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
    ]);
  }
}
d += " Z";
fs.writeFileSync(String(opt.path), d);
if (opt.dense) fs.writeFileSync(String(opt.dense), JSON.stringify(dense));
console.log(`${N} segments, ${C.length} sharp corners → ${opt.path}${opt.dense ? ` + ${opt.dense}` : ""}`);
