#!/usr/bin/env bun
/**
 * Arrangement template for an agent/co-pilot promo, keyed to the spine (assets/lib/layout.js).
 * Copied to <project>/scripts/synth-score.mjs by setup.sh; edit the harmony, the energy map and the per-surface
 * marks for the project. Every time comes from LAYOUT, so re-timing the film re-times the music.
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
const ASK = T.ASK;

const S = createScore({ duration: T.end, seed: 7 });
const { kick, clap, hat, tick, woodClick, key, thock, sub, pluck, bell, marimba, pad, blip, easeGlide, riser, whoosh, reverseSwell, impact, whir, hash } = S;

// ── Harmony: a bar per chord, counted from the first ask. Bright products: I-V-vi-IV (D major here).
//    Serious/technical: i-VI-III-VII (e.g. A minor: [33,[57,60,64,69]] [29,[57,60,65,69]] [36,[55,60,64,67]] [31,[55,59,62,67]]).
const PROG = [
  [38, [62, 66, 69, 74]], // D
  [33, [61, 64, 69, 73]], // A
  [35, [62, 66, 71, 74]], // Bm
  [31, [62, 67, 71, 74]], // G
];
const chordAt = (t) => PROG[((Math.floor((t - ASK[0].t0) / 2) % 4) + 4) % 4];
const SCALE = [62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79, 81, 83, 85, 86];
const CHAT_PAN = -0.55; // where the chat is on screen
const STAGE_PAN = 0.45; // where the surfaces are

function groove(t0, t1, mode = "normal") {
  for (let t = t0; t < t1 - 1e-6; t += 0.5) {
    const beat = Math.round(t / 0.5) % 4;
    if (mode === "light") {
      if (beat === 0) kick(t, 0.7);
      if (beat === 2) kick(t, 0.42);
    } else {
      if (beat === 0 || beat === 2 || mode === "full") kick(t, beat === 0 ? 0.85 : mode === "full" ? 0.62 : 0.66);
      if (beat === 1 || beat === 3) clap(t + 0.004, mode === "full" ? 0.3 : 0.24, 0.05);
    }
    hat(t + 0.25, mode === "light" ? 0.06 : 0.1, true, 0.3);
  }
  for (let t = t0; t < t1 - 1e-6; t += 0.125) hat(t, Math.round(t / 0.125) % 2 ? (mode === "light" ? 0.04 : 0.06) : 0.03, false, -0.3);
  for (let t = t0; t < t1 - 1e-6; t += 0.5) {
    const [root] = chordAt(t);
    sub(t + 0.25, 0.18, root + 12, mode === "light" ? 0.26 : 0.36);
    if (mode === "full") sub(t + 0.375, 0.08, root + 19, 0.18);
  }
}
function arp(t0, t1, g = 0.03, bright = 0.8) {
  const PAT = [0, 2, 1, 3, 2, 1, 3, 2];
  for (let t = t0; t < t1 - 1e-6; t += 0.25) {
    const [, notes] = chordAt(t);
    const s = Math.round((t - ASK[0].t0) / 0.25);
    pluck(t, notes[PAT[((s % 8) + 8) % 8]] + 12 + (s % 16 >= 8 ? 12 : 0), g, STAGE_PAN - 0.1, bright, 0.16);
  }
}
/** The character's signature: two bells a fifth apart, on its hello, every answer and the close. */
function motif(t, g = 0.07, p = CHAT_PAN) {
  bell(t, 74, g, p, 0.5);
  bell(t + 0.125, 81, g * 1.1, p, 0.7);
}
const check = (t, p = 0) => blip(t, 1320, 2640, 0.045, p);
function uiClick(t, p = 0) {
  key(t, 0.09, p);
  tick(t + 0.004, 0.05, p, 4200);
}
function success(t, p = STAGE_PAN) {
  impact(t, 0.12);
  [74, 78, 81, 86].forEach((m, i) => bell(t + i * 0.03, m + 12, 0.05, p - 0.2 + i * 0.12, 0.9));
  blip(t + 0.05, 2640, 3520, 0.04, p);
}
/** The composer's exact per-character schedule (the chat composition uses the same formula). */
function keyTimes(k) {
  const a = ASK[k];
  const text = L.REQUESTS[k];
  const n = text.length;
  const out = [];
  for (let i = 0; i < n; i++) out.push(a.type0 + ((a.type1 - a.type0) * i) / n + hash(i * 7 + k * 131, 5) * 0.012 + (text[i - 1] === " " ? 0.01 : 0));
  return out;
}

// ── HOOK ──────────────────────────────────────────────────────────────────────
pad(0.0, 1.9, [50, 62, 69], 0.022, 700, 0.35, 0.25);
T.chips.forEach((t, i) => {
  const p = (i % 2 ? 0.55 : -0.55) + hash(i, 11) * 0.3;
  blip(t, 1500 + i * 110, 1100 + i * 80, 0.045, p);
  tick(t + 0.012, 0.03, p, 3600 + i * 120);
});
T.head.forEach((t, i) => {
  kick(t, 0.75);
  thock(t, 0.26, 70 + i * 8);
  bell(t + 0.004, [74, 78, 81][i % 3], 0.05, 0, 0.6);
});
impact(T.head[0], 0.1);
for (let i = 0; i < 24; i++) tick(T.count[0] + (T.count[1] - T.count[0]) * Math.pow(i / 24, 0.7), 0.02, 0.1, 2400 + i * 90);
for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) tick(T.jitter + k * 0.09 + i * 0.012, 0.022, -0.6 + i * 0.6, 2800 + k * 400);
reverseSwell(T.implode - 0.65, T.implode + 0.2, 0.15, 62);
whoosh(T.implode - 0.02, 0.3, 0.16, 0.6, -0.1, 2600);
thock(T.flip[0], 0.3, 95);
[62, 66, 69].forEach((m, i) => pluck(T.flip[0] + i * 0.01, m + 12, 0.05, -0.2 + i * 0.2, 0.9, 0.3));
kick(T.flip[1], 0.95);
clap(T.flip[1] + 0.004, 0.3, 0);
impact(T.flip[1], 0.14);
[62, 66, 69, 74].forEach((m, i) => bell(T.flip[1] + i * 0.012, m + 12, 0.05, -0.3 + i * 0.2, 0.8));
riser(T.flip[1] + 0.05, T.charPop, 0.06, 500, 6000);
thock(T.charPop, 0.34, 110);
motif(T.charPop + 0.1, 0.06, -0.2);
for (let i = 0; i < 8; i++) tick(T.charPop + 0.22 + i * 0.018, 0.028, -0.5 + i * 0.14, 5000 + (i % 3) * 300);
// a warm bed and a soft pulse under the hello, so the room keeps breathing until the light
pad(T.charPop, 1.6, [50, 62, 66, 69, 74], 0.034, 1900, 0.1, 0.5, 1.2);
for (let t = T.charPop; t < T.wipe - 1e-6; t += 0.5) {
  kick(t, Math.round((t - T.charPop) / 0.5) % 2 ? 0.34 : 0.5);
  hat(t + 0.25, 0.07, true, 0.3);
  sub(t + 0.25, 0.16, 50, 0.24);
}
motif(T.hello[0], 0.08, 0.1);
pluck(T.hello[1], 81, 0.04, 0.3, 0.9, 0.25);
riser(T.wipe - 0.6, T.wipe, 0.07, 600, 8000);
whoosh(T.wipe, 0.6, 0.2, 0, 0, 1800);
pad(T.wipe, 1.9, [50, 62, 66, 69, 74, 78], 0.042, 2400, 0.05, 0.9, 1.2);
bell(T.land, 86, 0.06, CHAT_PAN, 0.8);
thock(T.land, 0.24, 130);
kick(T.land, 0.6);
for (let i = 0; i < 4; i++) hat(T.land + i * 0.125, 0.04 + i * 0.015, false, 0.2); // pickup into the first ask

// ── ASKS ──────────────────────────────────────────────────────────────────────
groove(ASK[0].t0, T.event, "light");
arp(ASK[0].t0, T.event, 0.02, 0.6);
groove(T.event, ASK[3].t0, "normal");
arp(T.event, ASK[3].t0, 0.028, 0.8);
groove(ASK[3].t0, T.outro, "full");
arp(ASK[3].t0, T.outro, 0.033, 0.95);
ASK.forEach((a, k) => {
  keyTimes(k).forEach((t, i) => key(t, 0.045 + (i % 3) * 0.006, CHAT_PAN));
  whoosh(a.send - 0.02, 0.22, 0.08, CHAT_PAN, -0.2, 3600);
  blip(a.send, 900, 1500, 0.05, CHAT_PAN);
  [0, 1, 2].forEach((i) => blip(a.dots + 0.06 + i * 0.08, 2000, 2000, 0.014, CHAT_PAN));
  whir(a.dots, a.reply, 0.022); // the agent thinks
  motif(a.reply, 0.065);
  if (k > 0) whoosh(a.build - 0.12, 0.4, 0.09, 0.9, STAGE_PAN, 2400); // the next surface slides in
  thock(a.build + 0.02, 0.2, 120);
  check(a.check, 0.2);
});
// the product's event during ask 0, and the agent reporting it
reverseSwell(T.event - 0.4, T.event, 0.1, 69);
success(T.event);
for (let i = 0; i < 10; i++) tick(T.event + 0.05 + i * 0.05, 0.02, 0.2, 2200 + i * 160); // the counter goes up
motif(T.eventReply, 0.07);
// the human approval (ask 3): the click, then each payout in turn, the counter goes down
uiClick(T.approveClick, CHAT_PAN);
for (let k = 0; k < 5; k++) bell(T.approveDone + 0.12 + k * 0.12, [74, 78, 81, 83, 86][k], 0.045, STAGE_PAN, 0.5);
for (let i = 0; i < 10; i++) tick(T.approveDone + 0.3 + i * 0.05, 0.02, 0.2, 3400 - i * 140);
// per-surface marks (project-specific): e.g. an assembly run of ticks, a schedule lighting up, two glides for a split
for (let k = 0; k < 12; k++) marimba(ASK[2].build + 1.0 + k * 0.1, SCALE[Math.min(SCALE.length - 1, 1 + k)], 0.04, STAGE_PAN, 0.22);
easeGlide(ASK[4].build + 0.65, ASK[4].build + 1.05, 600, 1200, (u) => u, 0.02);
easeGlide(ASK[4].build + 0.73, ASK[4].build + 1.13, 600, 450, (u) => u, 0.02);
woodClick(ASK[1].build + 1.5, 0.14, STAGE_PAN, 1300);

// ── FINALE ────────────────────────────────────────────────────────────────────
whoosh(T.outro, 0.7, 0.2, 0, 0, 1600);
reverseSwell(T.outro + 0.05, T.tagline, 0.12, 62);
kick(T.tagline, 0.9);
thock(T.tagline, 0.3, 80);
[74, 78, 81].forEach((m, i) => bell(T.tagline + i * 0.012, m + 12, 0.055, -0.2 + i * 0.2, 0.9));
for (let t = T.tagline; t < T.recap + 0.5 - 1e-6; t += 0.5) {
  const beat = Math.round((t - T.tagline) / 0.5) % 4;
  if (beat === 0 || beat === 2) kick(t, 0.72);
  if (beat === 1 || beat === 3) clap(t + 0.004, 0.2, 0);
  hat(t + 0.25, 0.08, true, 0.3);
  sub(t + 0.25, 0.18, 50, 0.3);
}
impact(T.mark, 0.26);
pad(T.mark, T.end - T.mark - 0.6, [50, 57, 62, 66, 69, 76], 0.05, 2400, 0.03, 1.3, 1.3); // the mark's chord
thock(T.charEnd, 0.3, 110);
motif(T.charEnd + 0.1, 0.075, 0);
pluck(T.charLine, 78, 0.04, 0, 0.9, 0.3);
pluck(T.cta, 74, 0.05, 0, 0.9, 0.3);
bell(T.cta + 0.08, 86, 0.04, 0.2, 0.8);
L.FEATURES.forEach((_, k) => marimba(T.recap + k * 0.07, [74, 76, 78, 81, 86, 88][k % 6], 0.045, -0.5 + k * 0.25, 0.3));
bell(T.end - 1.5, 90, 0.03, 0, 1.2);

S.write(process.argv[2] ?? "assets/audio/score.wav");
