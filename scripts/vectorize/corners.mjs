#!/usr/bin/env bun
/* Re-sharpen known corners (tips, notches) that blur and simplification blunted: for each target point, fit a
   line to each of its two flanks (points sampled along the polygon edges between --r-in and --r-out px from
   the target), and replace the vertices within --replace px by the flanks' intersection when it lands within
   --max px of the target. Writes the polygon and <out>.corners.json (the corner points, for spline.mjs).
   usage: bun corners.mjs <poly.json> --tips '[[x,y],...]' --out sharp.json [--r-in 4] [--r-out 15] [--replace 4.5] [--max 7] */
import fs from "node:fs";
import { args } from "./lib.mjs";
const { pos, opt } = args(process.argv.slice(2));
let P = JSON.parse(fs.readFileSync(pos[0], "utf8"));
const targets = JSON.parse(String(opt.tips));
const rIn = +(opt["r-in"] || 4), rOut = +(opt["r-out"] || 15), rep = +(opt.replace || 4.5), maxD = +(opt.max || 7);
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function fitLine(pts) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of pts) { sxx += (x - cx) ** 2; sxy += (x - cx) * (y - cy); syy += (y - cy) ** 2; }
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return { c: [cx, cy], u: [Math.cos(th), Math.sin(th)] };
}
function intersect(A, B) {
  const den = A.u[0] * B.u[1] - A.u[1] * B.u[0];
  if (Math.abs(den) < 1e-6) return null;
  const t = ((B.c[0] - A.c[0]) * B.u[1] - (B.c[1] - A.c[1]) * B.u[0]) / den;
  return [A.c[0] + t * A.u[0], A.c[1] + t * A.u[1]];
}
const corners = [];
const report = [];
for (const T of targets) {
  const N = P.length;
  let i0 = 0;
  P.forEach((p, i) => { if (d(p, T) < d(P[i0], T)) i0 = i; });
  const flank = (dir) => {
    const out = [];
    let prev = P[i0];
    for (let k = 1; k < N; k++) {
      const p = P[(i0 + dir * k + N * 4) % N];
      for (let s = 1; s <= 8; s++) {
        const q = [prev[0] + ((p[0] - prev[0]) * s) / 8, prev[1] + ((p[1] - prev[1]) * s) / 8];
        const dd = d(q, T);
        if (dd > rIn && dd < rOut) out.push(q);
      }
      if (d(p, T) > rOut) break;
      prev = p;
    }
    return out;
  };
  const A = flank(-1), B = flank(1);
  if (A.length < 3 || B.length < 3) { report.push([T, "skip (short flanks)"]); continue; }
  const X = intersect(fitLine(A), fitLine(B));
  if (!X || d(X, T) > maxD) { report.push([T, "skip (intersection too far)"]); continue; }
  const XR = [Math.round(X[0] * 100) / 100, Math.round(X[1] * 100) / 100];
  const keep = [];
  let inserted = false;
  for (let k = 0; k < N; k++) {
    if (d(P[k], T) < rep) { if (!inserted) { keep.push(XR); inserted = true; } }
    else keep.push(P[k]);
  }
  if (!inserted) keep.splice(i0, 0, XR);
  P = keep;
  corners.push(XR);
  report.push([T, XR]);
}
fs.writeFileSync(String(opt.out), JSON.stringify(P));
fs.writeFileSync(String(opt.out).replace(/\.json$/, "") + ".corners.json", JSON.stringify(corners));
for (const [t, r] of report) console.log(`  tip ${t.join(",")} → ${Array.isArray(r) ? r.join(",") : r}`);
console.log(`${P.length} vertices, ${corners.length} sharp corners → ${opt.out}`);
