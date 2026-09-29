#!/usr/bin/env bun
/* Least-squares ellipse fit to the boundary of a region (field > 0.5), ignoring boundary points within
   --avoid-radius px of another region (where the ellipse is covered by something else, e.g. hair over a head).
   Prints the axis-aligned fit (cx, cy, rx, ry, mean normalized residual) and the general conic's tilt.
   usage: bun fit-ellipse.mjs <raw> <W> <H> --inside <spec> [--avoid <spec>] [--avoid-radius 4] */
import { loadRaw, args, fieldFn } from "./lib.mjs";
const { pos, opt } = args(process.argv.slice(2));
const [raw, W, H] = [pos[0], +pos[1], +pos[2]];
const img = loadRaw(raw, W, H);
const inside = fieldFn(String(opt.inside));
const avoid = opt.avoid ? fieldFn(String(opt.avoid)) : null;
const R = +(opt["avoid-radius"] || 4);
const In = (x, y) => inside(img.px(x, y)) > 0.5;
const pts = [];
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  if (!In(x, y)) continue;
  if (In(x + 1, y) && In(x - 1, y) && In(x, y + 1) && In(x, y - 1)) continue;
  let near = false;
  if (avoid) for (let dy = -R; dy <= R && !near; dy++) for (let dx = -R; dx <= R; dx++) if (avoid(img.px(x + dx, y + dy)) > 0.5) { near = true; break; }
  if (!near) pts.push([x + 0.5, y + 0.5]);
}
function solve(M, v) {
  const n = v.length;
  const A = M.map((r, i) => [...r, v[i]]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]];
    for (let r = 0; r < n; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; }
  }
  return A.map((r, i) => r[n] / r[i]);
}
const fit = (rowOf) => {
  const rows = pts.map(rowOf);
  const k = rows[0].length;
  const M = Array.from({ length: k }, () => Array(k).fill(0));
  const v = Array(k).fill(0);
  for (const r of rows) for (let i = 0; i < k; i++) { v[i] += r[i]; for (let j = 0; j < k; j++) M[i][j] += r[i] * r[j]; }
  return solve(M, v);
};
if (pts.length < 20) throw new Error(`only ${pts.length} boundary points: check --inside / --avoid`);
const [A, C, D, E] = fit(([x, y]) => [x * x, y * y, x, y]);
const cx = -D / (2 * A), cy = -E / (2 * C), G = 1 + A * cx * cx + C * cy * cy;
const rx = Math.sqrt(G / A), ry = Math.sqrt(G / C);
const res = pts.reduce((s, [x, y]) => s + Math.abs(Math.hypot((x - cx) / rx, (y - cy) / ry) - 1), 0) / pts.length;
const [a2, b2, c2] = fit(([x, y]) => [x * x, x * y, y * y, x, y]);
const tilt = (0.5 * Math.atan2(b2, a2 - c2) * 180) / Math.PI;
console.log(JSON.stringify({ cx: +cx.toFixed(2), cy: +cy.toFixed(2), rx: +rx.toFixed(2), ry: +ry.toFixed(2), residual: +res.toFixed(4), conicTiltDeg: +tilt.toFixed(2), points: pts.length }));
