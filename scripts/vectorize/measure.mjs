#!/usr/bin/env bun
/* Colour census of a raw RGB image: the most frequent colours (quantized by 16) and exact samples at points.
   usage: bun measure.mjs <raw> <W> <H> [--top 14] [--samples "x,y;x,y;..."] */
import { loadRaw, args, luma } from "./lib.mjs";
const { pos, opt } = args(process.argv.slice(2));
const [raw, W, H] = [pos[0], +pos[1], +pos[2]];
const img = loadRaw(raw, W, H);
const hist = new Map();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const [r, g, b] = img.px(x, y);
  const k = `${r >> 4},${g >> 4},${b >> 4}`;
  hist.set(k, (hist.get(k) || 0) + 1);
}
const hex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
console.log("top colours (bucket centre, share):");
for (const [k, n] of [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, +(opt.top || 14))) {
  const c = k.split(",").map((v) => +v * 16 + 8);
  console.log(`  ${hex(c)}  ${((100 * n) / (W * H)).toFixed(2)}%`);
}
if (opt.samples) {
  console.log("samples (x,y: rgb hex luma):");
  for (const s of String(opt.samples).split(";")) {
    const [x, y] = s.split(",").map(Number);
    const c = img.px(x, y);
    console.log(`  ${x},${y}: ${c.join("/")} ${hex(c)} Y=${luma(c).toFixed(1)}`);
  }
}
