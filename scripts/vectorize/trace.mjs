#!/usr/bin/env bun
/* Trace one shape: build a [0,1] field (see lib.mjs fieldFn), optional Gaussian blur, marching squares at the
   iso level, keep the largest loop (or --loop N), simplify with Douglas-Peucker. Writes a polygon JSON.
   usage: bun trace.mjs <raw> <W> <H> --field "luma:30:130:185" [--sigma 0.5] [--iso 0.5] [--eps 0.6] [--loop 0] --out poly.json */
import fs from "node:fs";
import { loadRaw, args, buildField, contours, simplifyRing } from "./lib.mjs";
const { pos, opt } = args(process.argv.slice(2));
const [raw, W, H] = [pos[0], +pos[1], +pos[2]];
if (!opt.field || !opt.out) throw new Error("--field and --out are required");
const img = loadRaw(raw, W, H);
const F = buildField(img, String(opt.field), +(opt.sigma || 0));
const loops = contours(F, W, H, +(opt.iso || 0.5));
const pick = loops[+(opt.loop || 0)];
if (!pick) throw new Error("no loop found: check the field spec");
const poly = simplifyRing(pick, +(opt.eps || 0.6));
fs.writeFileSync(String(opt.out), JSON.stringify(poly));
console.log(`loops ${loops.slice(0, 5).map((l) => l.length).join(",")} · picked ${pick.length} pts → ${poly.length} vertices → ${opt.out}`);
