#!/usr/bin/env bun
/**
 * Arrangement template for a flow showcase (head-on 3D stage), keyed to the stage spine
 * (templates/lib/layout-stage.js, installed as assets/lib/layout.js). setup.sh copies it to
 * <project>/scripts/synth-score.mjs for the "stage" shape. Every hit comes from the spine: the title slams,
 * ghosts, swaps, wires, run steps, signals, rings, log rows and chapters, so re-timing the film re-times the music.
 *
 * usage: bun scripts/synth-score.mjs [out.wav]   (then scripts/build-score.sh normalizes to -16 LUFS)
 *        LAYOUT=/abs/path/layout.js bun scripts/synth-score.mjs /tmp/test.wav   (another spine)
 */
import { createRequire } from "node:module";
import { createScore } from "./score-engine.mjs";

const require = createRequire(import.meta.url);
require(process.env.LAYOUT || "../assets/lib/layout.js"); // ESM package: the file registers globalThis.LAYOUT
const L = globalThis.LAYOUT;
const T = L.T;
const N = L.NODES;
const E = L.EDGES;

const S = createScore({ duration: T.end, seed: 11 });
const { kick, clap, hat, tick, woodClick, key, thock, sub, pluck, bell, marimba, pad, blip, easeGlide, riser, whoosh, reverseSwell, impact, whir } = S;

// ── Harmony: A minor i-VI-III-VII (engineered, calm), a bar per chord from the first swap.
//    Bright products: I-V-vi-IV (see arrangement.example.mjs).
const PROG = [
  [33, [57, 60, 64, 69]], // Am
  [29, [57, 60, 65, 69]], // F
  [36, [55, 60, 64, 67]], // C
  [31, [55, 59, 62, 67]], // G
];
const BAR0 = Math.min(...N.map((n) => n.swap));
const chordAt = (t) => PROG[((Math.floor((t - BAR0) / 2) % 4) + 4) % 4];
const SCALE = [57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81];
// stereo from the board: a node's column spreads left to right
const cols = N.map((n) => n.x);
const X_MID = (Math.min(...cols) + Math.max(...cols)) / 2;
const X_HALF = Math.max(1, (Math.max(...cols) - Math.min(...cols)) / 2);
const panOf = (x) => Math.max(-0.7, Math.min(0.7, ((x - X_MID) / X_HALF) * 0.7));

function groove(t0, t1, mode = "normal") {
  for (let t = t0; t < t1 - 1e-6; t += 0.5) {
    const beat = Math.round(t / 0.5) % 4;
    if (mode === "light") {
      if (beat === 0) kick(t, 0.66);
      if (beat === 2) kick(t, 0.4);
    } else {
      if (beat === 0 || beat === 2 || mode === "full") kick(t, beat === 0 ? 0.85 : mode === "full" ? 0.6 : 0.64);
      if (beat === 1 || beat === 3) clap(t + 0.004, mode === "full" ? 0.28 : 0.22, 0.05);
    }
    hat(t + 0.25, mode === "light" ? 0.06 : 0.1, true, 0.3);
  }
  for (let t = t0; t < t1 - 1e-6; t += 0.125) hat(t, Math.round(t / 0.125) % 2 ? (mode === "light" ? 0.035 : 0.055) : 0.028, false, -0.3);
  for (let t = t0; t < t1 - 1e-6; t += 0.5) {
    const [root] = chordAt(t);
    sub(t + 0.25, 0.18, root + 12, mode === "light" ? 0.24 : 0.34);
  }
}
function arp(t0, t1, g = 0.028, bright = 0.8) {
  const PAT = [0, 2, 1, 3, 2, 1, 3, 2];
  for (let t = t0; t < t1 - 1e-6; t += 0.25) {
    const [, notes] = chordAt(t);
    const s = Math.round((t - BAR0) / 0.25);
    pluck(t, notes[PAT[((s % 8) + 8) % 8]] + 12 + (s % 16 >= 8 ? 12 : 0), g, 0.3, bright, 0.16);
  }
}
const check = (t, p = 0) => blip(t, 1320, 2640, 0.04, p);
function uiClick(t, p = 0) {
  key(t, 0.09, p);
  tick(t + 0.004, 0.05, p, 4200);
}

// ── TITLE: three slams, the dive, the light ─────────────────────────────────────
pad(0.0, T.dive, [45, 57, 64], 0.02, 700, 0.35, 0.3);
T.lines.forEach((t, i) => {
  kick(t, 0.8);
  thock(t, 0.28, 70 + i * 10);
  bell(t + 0.004, [69, 72, 76][i % 3], 0.05, -0.2 + i * 0.2, 0.6);
  for (let k = 0; k < 3; k++) tick(t + 0.03 + k * 0.035, 0.022, -0.4 + k * 0.4, 2600 + k * 500); // the shake
});
impact(T.lines[0], 0.12);
reverseSwell(T.dive - 0.5, T.dive + 0.05, 0.14, 57);
whoosh(T.dive, 0.4, 0.18, -0.3, 0.3, 2400);
riser(T.dive - 0.2, T.wipe, 0.06, 600, 8000);
whoosh(T.wipe, 0.6, 0.18, 0, 0, 1800);

// ── PLAN + BUILD: a bed, a blip per ghost, a hit per card, a tick per wire ────────
pad(T.wipe, T.scale - T.wipe, [45, 57, 60, 64, 69], 0.034, 1600, 0.3, 1.2, 1.2);
// a soft pulse under the plan, so the room keeps breathing until the first card lands
for (let t = Math.ceil(T.wipe / 0.5) * 0.5; t < BAR0 - 1e-6; t += 0.5) {
  kick(t, Math.round(t / 0.5) % 2 ? 0.34 : 0.5);
  hat(t + 0.25, 0.07, true, 0.3);
  sub(t + 0.25, 0.16, 45, 0.24);
}
T.CHAPTERS.forEach(([t]) => woodClick(t, 0.12, -0.7, 1200));
N.forEach((n) => {
  const p = panOf(n.x);
  blip(n.ghost, 2200 + n.col * 180, 2000 + n.col * 160, 0.018, p);
  const [, notes] = chordAt(n.swap);
  thock(n.swap + 0.02, 0.2, 110 + n.col * 8);
  pluck(n.swap + 0.02, notes[(n.col + (n.flow === "A" ? 0 : 1)) % 4] + 12, 0.045, p, 0.85, 0.22);
  tick(n.land, 0.03, p, 3000);
});
E.forEach((e) => tick(e.draw + 0.12, 0.018, panOf(e.x2), 4200));
groove(BAR0, T.activate, "light");

// ── ACTIVATE + RUN 1 (one beat per step, easy to read) ─────────────────────────
uiClick(T.activate, 0);
blip(T.activate + 0.05, 900, 1800, 0.04, 0);
[T.press1, T.press2].forEach((t) => {
  uiClick(t, 0.1);
  reverseSwell(t - 0.35, t + 0.1, 0.06, 64);
});
const run1 = L.RUNS[0];
const run2 = L.RUNS[1];
groove(run1.t0, T.scale, "normal");
arp(run1.t0, T.scale, 0.022, 0.7);
// every node start and finish, every signal and tag, every ring (both runs: the second is compressed)
N.forEach((n) =>
  n.runs.forEach((r) => {
    const p = panOf(n.x);
    const fast = r.run !== run1.id;
    marimba(r.start, SCALE[Math.min(SCALE.length - 1, 4 + n.depth * 2 + (n.flow === "A" ? 0 : n.flow === "B" ? 1 : 2))], fast ? 0.03 : 0.045, p, 0.28);
    if (!fast) whir(r.start + 0.02, r.done - 0.02, 0.012);
    check(r.done, p);
  }),
);
E.forEach((e) =>
  e.runs.forEach((r) => {
    const fast = r.run !== run1.id;
    easeGlide(r.t0, r.t1, 500, fast ? 900 : 1100, (u) => u * u * (3 - 2 * u), fast ? 0.01 : 0.016);
    if (e.tag !== null && !fast) pluck(r.t0 + 0.04, 81, 0.035, panOf(e.x1), 0.9, 0.2); // the value tag appears
  }),
);
L.RINGS.forEach((r) => {
  if (r.r1 >= 100) bell(r.t + 0.01, 88, 0.035, panOf(r.x), 0.7); // the last step of a run rings
});
L.LOG.rows.forEach(([t], i) => {
  tick(t, 0.03, 0.6, 3400 + i * 200);
  check(t + 0.08, 0.6);
});

// ── SCALE + RUN 2 (every flow at once) ──────────────────────────────────────────
riser(T.scale - 0.6, T.scale, 0.05, 500, 6000);
whoosh(T.scale, 0.5, 0.12, -0.4, 0.4, 2000);
groove(T.scale, T.press2, "normal");
arp(T.scale, T.press2, 0.026, 0.8);
groove(run2.t0, T.outro, "full");
arp(run2.t0, T.outro, 0.032, 0.95);
impact(run2.t0, 0.1);

// ── FINALE ──────────────────────────────────────────────────────────────────────
whoosh(T.outro, 0.7, 0.2, 0, 0, 1600);
reverseSwell(T.outro + 0.05, T.tagline, 0.12, 57);
kick(T.tagline, 0.9);
thock(T.tagline, 0.3, 80);
[69, 72, 76].forEach((m, i) => bell(T.tagline + i * 0.012, m + 12, 0.055, -0.2 + i * 0.2, 0.9));
for (let t = T.tagline; t < T.recap + 1.0 - 1e-6; t += 0.5) {
  const beat = Math.round((t - T.tagline) / 0.5) % 4;
  if (beat === 0 || beat === 2) kick(t, 0.72);
  if (beat === 1 || beat === 3) clap(t + 0.004, 0.2, 0);
  hat(t + 0.25, 0.08, true, 0.3);
  sub(t + 0.25, 0.18, 45, 0.3);
}
impact(T.mark, 0.26);
pad(T.mark, T.end - T.mark - 0.6, [45, 52, 57, 60, 64, 71], 0.05, 2400, 0.03, 1.3, 1.3); // the mark's chord
pluck(T.charLine, 76, 0.045, 0, 0.9, 0.3);
pluck(T.cta, 69, 0.05, 0, 0.9, 0.3);
bell(T.cta + 0.08, 81, 0.04, 0.2, 0.8);
L.FEATURES.forEach((_, k) => marimba(T.recap + k * 0.07, [69, 71, 72, 76, 81, 83][k % 6], 0.045, -0.5 + k * 0.25, 0.3));
bell(T.end - 1.5, 88, 0.03, 0, 1.2);

S.write(process.argv[2] ?? "assets/audio/score.wav");
