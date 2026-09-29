/**
 * score-engine: a dependency-free, deterministic synthesizer for scores cut to picture.
 *
 * createScore({ duration, sampleRate, seed }) returns the voices (drums, tonal, FX) that write into internal
 * buses, and write(path) which mixes (kick sidechain, Freeverb, ping-pong delay, 30 Hz high-pass, soft
 * saturation, peak normalize, fades) and writes a 16-bit stereo WAV. Loudness normalization happens after,
 * in build-score.sh (two-pass loudnorm to -16 LUFS).
 *
 * Voices (times in seconds, midi note numbers, gains ~0.02-0.9, pan -1..1):
 *   kick(t, g) · clap(t, g, p) · hat(t, g, open, p) · tick(t, g, p, f0) · woodClick(t, g, p, f0) · key(t, g, p)
 *   thock(t, g, f0) · sub(t, dur, m, g) · pluck(t, m, g, p, bright, decay) · bell(t, m, g, p, decay)
 *   marimba(t, m, g, p, decay) · pad(t, dur, notes, g, cutoff, attack, release, widen)
 *   blip(t, f0, f1, g, p) · easeGlide(t0, t1, fLo, fHi, ease, g) · riser(t0, t1, g, fLo, fHi)
 *   whoosh(t, dur, g, panFrom, panTo, fPeak) · reverseSwell(t0, t1, g, m) · impact(t, g) · whir(t0, t1, g)
 *   helpers: midi(m), hash(n, seed) in [-1, 1]
 */
import fs from "node:fs";

export function createScore({ duration, sampleRate = 48000, seed = 1 } = {}) {
  if (!duration) throw new Error("createScore: duration (seconds) is required");
  const SR = sampleRate;
  const DUR = duration;
  const N = Math.round(SR * DUR);
  const BEAT = 0.5;
  const hash = (n, s) => {
    const x = Math.sin(n * 127.1 + (s || 1) * 311.7) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  };

  // ── Deterministic noise ──────────────────────────────────────────────────────
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(seed >>> 0);
  const noise = () => rnd() * 2 - 1;

  // ── Buses ────────────────────────────────────────────────────────────────────
  const bus = () => [new Float32Array(N), new Float32Array(N)];
  const DRUMS = bus();
  const BASS = bus();
  const MUSIC = bus();
  const FX = bus();
  const REV = bus(); // reverb send
  const DLY = bus(); // delay send

  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const idx = (t) => Math.round(t * SR);

  function put(b, i, l, r) {
    if (i >= 0 && i < N) {
      b[0][i] += l;
      b[1][i] += r;
    }
  }
  /** Constant-power pan: p in [-1, 1]. */
  function pan(p) {
    const a = ((Math.max(-1, Math.min(1, p)) + 1) * Math.PI) / 4;
    return [Math.cos(a), Math.sin(a)];
  }

  // ── Filters ──────────────────────────────────────────────────────────────────
  /** TPT state-variable filter (Zavalishin) — safe for per-sample cutoff changes. */
  function svf() {
    let ic1 = 0;
    let ic2 = 0;
    return (x, fc, q = 0.707) => {
      const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR);
      const k = 1 / q;
      const a1 = 1 / (1 + g * (g + k));
      const a2 = g * a1;
      const a3 = g * a2;
      const v3 = x - ic2;
      const v1 = a1 * ic1 + a2 * v3;
      const v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2 * v1 - ic1;
      ic2 = 2 * v2 - ic2;
      return { lp: v2, bp: v1, hp: x - k * v1 - v2 };
    };
  }
  function onePoleHP(fc) {
    const a = Math.exp((-2 * Math.PI * fc) / SR);
    let y = 0;
    let px = 0;
    return (x) => {
      y = a * (y + x - px);
      px = x;
      return y;
    };
  }

  // ── Oscillators ──────────────────────────────────────────────────────────────
  function polyblep(t, dt) {
    if (t < dt) {
      t /= dt;
      return t + t - t * t - 1;
    }
    if (t > 1 - dt) {
      t = (t - 1) / dt;
      return t * t + t + t + 1;
    }
    return 0;
  }
  function sawOsc(f0, detuneCents = 0) {
    let ph = rnd();
    const f = f0 * Math.pow(2, detuneCents / 1200);
    const dt = f / SR;
    return () => {
      const v = 2 * ph - 1 - polyblep(ph, dt);
      ph += dt;
      if (ph >= 1) ph -= 1;
      return v;
    };
  }

  // ── Sidechain (kick ducking) ────────────────────────────────────────────────
  const KICKS = [];
  const DUCK = new Float32Array(N).fill(1);
  function buildDuck(depth = 0.72, release = 0.2) {
    KICKS.sort((a, b) => a - b);
    for (const t of KICKS) {
      const i0 = idx(t);
      const len = Math.round(release * 4 * SR);
      for (let k = 0; k < len; k++) {
        const tt = k / SR;
        const attack = Math.min(1, tt / 0.004);
        const g = 1 - depth * attack * Math.exp(-tt / release);
        const i = i0 + k;
        if (i >= 0 && i < N) DUCK[i] = Math.min(DUCK[i], g);
      }
    }
  }

  // ── Drums ────────────────────────────────────────────────────────────────────
  function kick(t, g = 1) {
    KICKS.push(t);
    const i0 = idx(t);
    const len = Math.round(0.5 * SR);
    let ph = 0;
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const f = 44 + 120 * Math.exp(-tt / 0.032);
      ph += (2 * Math.PI * f) / SR;
      const amp = Math.exp(-tt / 0.3) * Math.min(1, tt / 0.0015);
      let v = Math.sin(ph) * amp;
      if (tt < 0.005) v += noise() * 0.5 * (1 - tt / 0.005);
      v = Math.tanh(v * 2.2) / Math.tanh(2.2);
      put(DRUMS, i0 + k, v * g, v * g);
    }
  }
  function clap(t, g = 1, p = 0) {
    const i0 = idx(t);
    const len = Math.round(0.45 * SR);
    const f1 = svf();
    const f2 = svf();
    const [pl, pr] = pan(p);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      let env = 0;
      for (const o of [0, 0.01, 0.021]) if (tt >= o) env = Math.max(env, Math.exp(-(tt - o) / 0.009));
      if (tt >= 0.021) env = Math.max(env, 0.85 * Math.exp(-(tt - 0.021) / 0.14));
      const n = noise();
      let v = (f1(n, 1250, 0.9).bp * 1.2 + f2(n, 2600, 1.4).bp * 0.6) * env;
      v += Math.sin(2 * Math.PI * 185 * tt) * Math.exp(-tt / 0.045) * 0.35;
      put(DRUMS, i0 + k, v * g * pl, v * g * pr);
      put(REV, i0 + k, v * g * 0.35, v * g * 0.35);
    }
  }
  function hat(t, g = 0.3, open = false, p = 0.15) {
    const i0 = idx(t);
    const decay = open ? 0.11 : 0.028;
    const len = Math.round((decay * 6 + 0.01) * SR);
    const hp = onePoleHP(6500);
    const f = svf();
    const [pl, pr] = pan(p);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const env = Math.exp(-tt / decay) * Math.min(1, tt / 0.0008);
      const v = f(hp(noise()), 9500, 0.8).bp * env * 1.8 + hp(noise()) * env * 0.4;
      put(DRUMS, i0 + k, v * g * pl, v * g * pr);
    }
  }
  function tick(t, g = 0.08, p = 0, f0 = 3200) {
    const i0 = idx(t);
    const len = Math.round(0.03 * SR);
    const [pl, pr] = pan(p);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const v = (Math.sin(2 * Math.PI * f0 * tt) * 0.6 + noise() * 0.4) * Math.exp(-tt / 0.006);
      put(FX, i0 + k, v * g * pl, v * g * pr);
    }
  }
  /** A short pitched "wood" click for a card landing. */
  function woodClick(t, g = 0.22, p = 0, f0 = 1100) {
    const i0 = idx(t);
    const len = Math.round(0.09 * SR);
    const [pl, pr] = pan(p);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      let v = Math.sin(2 * Math.PI * f0 * tt) * Math.exp(-tt / 0.018) + Math.sin(2 * Math.PI * f0 * 2.76 * tt) * 0.35 * Math.exp(-tt / 0.008);
      if (tt < 0.0015) v += noise() * 0.6;
      put(FX, i0 + k, v * g * pl, v * g * pr);
      put(REV, i0 + k, v * g * 0.12, v * g * 0.12);
    }
  }

  // ── Tonal voices ─────────────────────────────────────────────────────────────
  function sub(t, dur, m, g = 0.42) {
    const i0 = idx(t);
    const len = Math.round((dur + 0.06) * SR);
    const f = midi(m);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const env = Math.min(1, tt / 0.004) * (tt > dur ? Math.exp(-(tt - dur) / 0.02) : 1);
      let v = Math.sin(2 * Math.PI * f * tt) + 0.22 * Math.sin(2 * Math.PI * 2 * f * tt);
      v = Math.tanh(v * 1.4) * env;
      put(BASS, i0 + k, v * g, v * g);
    }
  }
  function pluck(t, m, g = 0.16, p = 0, bright = 1, decay = 0.22) {
    const i0 = idx(t);
    const len = Math.round((decay * 5) * SR);
    const o1 = sawOsc(midi(m), -6);
    const o2 = sawOsc(midi(m), +6);
    const f = svf();
    const [pl, pr] = pan(p);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const fc = 260 + 5200 * bright * Math.exp(-tt / 0.075);
      const env = Math.exp(-tt / decay) * Math.min(1, tt / 0.002);
      const v = f((o1() + o2()) * 0.5, fc, 0.9).lp * env;
      put(MUSIC, i0 + k, v * g * pl, v * g * pr);
      put(DLY, i0 + k, v * g * 0.5, v * g * 0.5);
      put(REV, i0 + k, v * g * 0.3, v * g * 0.3);
    }
  }
  /** FM bell: a success, a landing, a chord tone. */
  function bell(t, m, g = 0.14, p = 0, decay = 0.6) {
    const i0 = idx(t);
    const len = Math.round(decay * 5 * SR);
    const fc = midi(m);
    const fm = fc * 3.5;
    const [pl, pr] = pan(p);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const I = 2.4 * Math.exp(-tt / 0.09);
      const v = Math.sin(2 * Math.PI * fc * tt + I * Math.sin(2 * Math.PI * fm * tt)) * Math.exp(-tt / decay) * Math.min(1, tt / 0.001);
      put(MUSIC, i0 + k, v * g * pl, v * g * pr);
      put(DLY, i0 + k, v * g * 0.45, v * g * 0.45);
      put(REV, i0 + k, v * g * 0.5, v * g * 0.5);
    }
  }
  /** Sustained detuned-saw pad chord. */
  function pad(t, dur, notes, g = 0.05, cutoff = 1400, attack = 0.5, release = 1.0, widen = 1) {
    const i0 = idx(t);
    const len = Math.round((dur + release * 4) * SR);
    const voices = [];
    notes.forEach((m, n) => {
      for (const d of [-9, 0, 9]) {
        const p = (((n + (d > 0 ? 1 : d < 0 ? -1 : 0) * 0.5) / Math.max(1, notes.length - 1)) * 2 - 1) * 0.8 * widen;
        voices.push({ osc: sawOsc(midi(m), d), pan: pan(p) });
      }
    });
    const fl = svf();
    const fr = svf();
    const hl = svf();
    const hr = svf();
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const env = Math.min(1, tt / attack) * (tt > dur ? Math.exp(-(tt - dur) / release) : 1);
      if (env < 1e-4 && tt > dur) break;
      let l = 0;
      let r = 0;
      for (const v of voices) {
        const s = v.osc();
        l += s * v.pan[0];
        r += s * v.pan[1];
      }
      const lfo = 1 + 0.18 * Math.sin(2 * Math.PI * 0.35 * (t + tt));
      const cl = hl(fl(l, cutoff * lfo, 0.6).lp, 170, 0.6).hp * env * g;
      const cr = hr(fr(r, cutoff * lfo, 0.6).lp, 170, 0.6).hp * env * g;
      put(MUSIC, i0 + k, cl, cr);
      put(REV, i0 + k, cl * 0.7, cr * 0.7);
    }
  }

  // ── Effects ──────────────────────────────────────────────────────────────────
  /** A small pitched UI blip (sends, dots, checks). */
  function blip(t, f0 = 1320, f1 = 880, g = 0.2, p = 0) {
    const i0 = idx(t);
    const len = Math.round(0.25 * SR);
    let ph = 0;
    const [pl, pr] = pan(p);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const f = f1 + (f0 - f1) * Math.exp(-tt / 0.02);
      ph += (2 * Math.PI * f) / SR;
      const v = Math.sin(ph) * Math.exp(-tt / 0.07) * Math.min(1, tt / 0.001);
      put(FX, i0 + k, v * g * pl, v * g * pr);
      put(REV, i0 + k, v * g * 0.4, v * g * 0.4);
    }
  }
  /** Sine glide whose pitch follows an easing curve — you hear the ease. */
  function easeGlide(t0, t1, fLo, fHi, ease, g = 0.1) {
    const i0 = idx(t0);
    const len = Math.round((t1 - t0 + 0.35) * SR);
    let ph = 0;
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const u = Math.min(1, tt / (t1 - t0));
      const f = fLo * Math.pow(fHi / fLo, ease(u));
      ph += (2 * Math.PI * f) / SR;
      const env = Math.min(1, tt / 0.03) * (tt > t1 - t0 ? Math.exp(-(tt - (t1 - t0)) / 0.08) : 1);
      const v = (Math.sin(ph) * 0.85 + Math.sin(2 * ph) * 0.12) * env;
      put(FX, i0 + k, v * g, v * g);
      put(DLY, i0 + k, v * g * 0.3, v * g * 0.3);
      put(REV, i0 + k, v * g * 0.3, v * g * 0.3);
    }
  }
  /** Filtered-noise riser that snaps off at `t1`. */
  function riser(t0, t1, g = 0.12, fLo = 400, fHi = 9000) {
    const i0 = idx(t0);
    const len = Math.round((t1 - t0) * SR);
    const fl = svf();
    const fr = svf();
    let ph = 0;
    for (let k = 0; k < len; k++) {
      const u = k / len;
      const fc = fLo * Math.pow(fHi / fLo, u * u);
      const amp = Math.pow(u, 2.2);
      const nl = fl(noise(), fc, 2.2).bp;
      const nr = fr(noise(), fc * 1.03, 2.2).bp;
      const fs = 180 * Math.pow(9, u);
      ph += (2 * Math.PI * fs) / SR;
      const s = Math.sin(ph) * 0.25;
      put(FX, i0 + k, (nl * 1.4 + s) * amp * g, (nr * 1.4 + s) * amp * g);
    }
  }
  /** Air whoosh; the pan follows the on-screen direction (-1 → +1 = left → right). */
  function whoosh(t, dur = 0.5, g = 0.3, panFrom = -0.8, panTo = 0.8, fPeak = 2400) {
    const i0 = idx(t);
    const len = Math.round(dur * SR);
    const fl = svf();
    const fr = svf();
    for (let k = 0; k < len; k++) {
      const u = k / len;
      const env = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 2);
      const fc = 300 + fPeak * Math.sin(Math.PI * u);
      const [pl, pr] = pan(panFrom + (panTo - panFrom) * u);
      const nl = fl(noise(), fc, 1.1).bp;
      const nr = fr(noise(), fc, 1.1).bp;
      put(FX, i0 + k, nl * env * g * pl * 1.4, nr * env * g * pr * 1.4);
      put(REV, i0 + k, nl * env * g * 0.2, nr * env * g * 0.2);
    }
  }
  /** Reverse swell ending exactly at `t1` (the suck into a hit). */
  function reverseSwell(t0, t1, g = 0.18, m = 57) {
    const i0 = idx(t0);
    const len = Math.round((t1 - t0) * SR);
    const f = svf();
    const o = sawOsc(midi(m));
    const o2 = sawOsc(midi(m + 7), 5);
    for (let k = 0; k < len; k++) {
      const u = k / len;
      const amp = Math.pow(u, 3.2);
      const v = f((o() + o2()) * 0.5 + noise() * 0.6, 300 + 7000 * u * u, 0.9).lp * amp;
      put(FX, i0 + k, v * g, v * g);
    }
  }
  /** An impact: sub drop + noise burst (the mark, a big landing). */
  function impact(t, g = 0.9) {
    const i0 = idx(t);
    const len = Math.round(2.6 * SR);
    let ph = 0;
    const f = svf();
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const fr = 32 + 70 * Math.exp(-tt / 0.18);
      ph += (2 * Math.PI * fr) / SR;
      let v = Math.sin(ph) * Math.exp(-tt / 0.6) * Math.min(1, tt / 0.002);
      v += f(noise(), 2800 * Math.exp(-tt / 0.3) + 200, 0.7).lp * Math.exp(-tt / 0.22) * 0.9;
      v = Math.tanh(v * 1.8) / Math.tanh(1.8);
      put(FX, i0 + k, v * g, v * g);
      put(REV, i0 + k, v * g * 0.25, v * g * 0.25);
    }
  }
  /** A soft whir (thinking, working): band-passed noise with a slow circular pan. */
  function whir(t0, t1, g = 0.05) {
    const i0 = idx(t0);
    const len = Math.round((t1 - t0) * SR);
    const f = svf();
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const u = k / len;
      const env = Math.min(1, u / 0.15) * Math.min(1, (1 - u) / 0.1);
      const fc = 900 + 500 * Math.sin(2 * Math.PI * 0.9 * tt);
      const v = f(noise(), fc, 3).bp * env;
      const [pl, pr] = pan(Math.sin(2 * Math.PI * 0.45 * tt));
      put(FX, i0 + k, v * g * pl, v * g * pr);
      put(REV, i0 + k, v * g * 0.4, v * g * 0.4);
    }
  }

  // ── Reverb (Freeverb) + ping-pong delay ─────────────────────────────────────
  function freeverb([inL, inR], room = 0.86, damp = 0.28) {
    const scale = SR / 44100;
    const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
    const apT = [556, 441, 341, 225];
    const mk = (spread) => ({
      combs: combT.map((c) => ({ buf: new Float32Array(Math.round((c + spread) * scale)), i: 0, store: 0 })),
      aps: apT.map((a) => ({ buf: new Float32Array(Math.round((a + spread) * scale)), i: 0 })),
    });
    const ch = [mk(0), mk(23)];
    const out = [new Float32Array(N), new Float32Array(N)];
    [inL, inR].forEach((input, c) => {
      const { combs, aps } = ch[c];
      for (let n = 0; n < N; n++) {
        const x = input[n] * 0.015;
        let s = 0;
        for (const cb of combs) {
          const y = cb.buf[cb.i];
          cb.store = y * (1 - damp) + cb.store * damp;
          cb.buf[cb.i] = x + cb.store * room;
          cb.i = (cb.i + 1) % cb.buf.length;
          s += y;
        }
        for (const ap of aps) {
          const b = ap.buf[ap.i];
          const y = -s + b;
          ap.buf[ap.i] = s + b * 0.5;
          ap.i = (ap.i + 1) % ap.buf.length;
          s = y;
        }
        out[c][n] = s;
      }
    });
    return out;
  }
  function pingPong([inL, inR], time = 0.375, fb = 0.38) {
    const d = Math.round(time * SR);
    const out = [new Float32Array(N), new Float32Array(N)];
    const lp = [svf(), svf()];
    for (let n = 0; n < N; n++) {
      const dl = n >= d ? out[1][n - d] : 0; // cross-feed = ping-pong
      const dr = n >= d ? out[0][n - d] : 0;
      out[0][n] = lp[0]((n >= d ? inL[n - d] : 0) + dl * fb, 3800).lp;
      out[1][n] = lp[1]((n >= d ? inR[n - d] * 0.6 : 0) + dr * fb, 3800).lp;
    }
    return out;
  }

  /** Synth marimba: a sine bar with its 4th partial and a mallet click. */
  function marimba(t, m, g = 0.12, p = 0, decay = 0.32) {
    const i0 = idx(t);
    const f = midi(m);
    const len = Math.round(decay * 5 * SR);
    const [pl, pr] = pan(p);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      let v = Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt / decay);
      v += 0.28 * Math.sin(2 * Math.PI * f * 3.93 * tt) * Math.exp(-tt / (decay * 0.18));
      v += 0.1 * Math.sin(2 * Math.PI * f * 9.2 * tt) * Math.exp(-tt / 0.012);
      if (tt < 0.002) v += noise() * 0.5 * (1 - tt / 0.002);
      v *= Math.min(1, tt / 0.0008);
      put(MUSIC, i0 + k, v * g * pl, v * g * pr);
      put(REV, i0 + k, v * g * 0.28, v * g * 0.28);
    }
  }
  /** Rubber stamp / sticker landing: low thump + wooden knock + a paper crunch. */
  function thock(t, g = 0.5, f0 = 90) {
    const i0 = idx(t);
    const len = Math.round(0.5 * SR);
    const f = svf();
    let ph = 0;
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      const fr = f0 + 60 * Math.exp(-tt / 0.02);
      ph += (2 * Math.PI * fr) / SR;
      let v = Math.sin(ph) * Math.exp(-tt / 0.09) * Math.min(1, tt / 0.001);
      v += Math.sin(2 * Math.PI * 740 * tt) * Math.exp(-tt / 0.012) * 0.45;
      v += f(noise(), 2400, 0.9).bp * Math.exp(-tt / 0.03) * 0.9;
      v = Math.tanh(v * 1.6) / Math.tanh(1.6);
      put(FX, i0 + k, v * g, v * g);
      put(REV, i0 + k, v * g * 0.15, v * g * 0.15);
    }
  }

  /** A keyboard key: a short mechanical click with a small wooden body. */
  function key(t, g = 0.06, p = -0.55) {
    const i0 = idx(t);
    const len = Math.round(0.06 * SR);
    const f = svf();
    const [pl, pr] = pan(p);
    for (let k = 0; k < len; k++) {
      const tt = k / SR;
      let v = f(noise(), 2600, 1.3).bp * Math.exp(-tt / 0.006) * 1.3;
      v += Math.sin(2 * Math.PI * 210 * tt) * Math.exp(-tt / 0.018) * 0.45;
      put(FX, i0 + k, v * g * pl, v * g * pr);
      put(REV, i0 + k, v * g * 0.05, v * g * 0.05);
    }
  }


  /** Mix every bus and write a 16-bit stereo WAV to OUT. */
  function write(OUT) {
    // ── Mix ──────────────────────────────────────────────────────────────────────
    buildDuck(0.7, 0.19);
    const rev = freeverb(REV, 0.87, 0.3);
    const dly = pingPong(DLY, 0.375, 0.36);
    const L = new Float32Array(N);
    const R = new Float32Array(N);
    for (let n = 0; n < N; n++) {
      const d = DUCK[n];
      const dm = 1 - (1 - d) * 0.45; // lighter duck on the music bus
      L[n] = DRUMS[0][n] * 0.9 + BASS[0][n] * d * 0.95 + MUSIC[0][n] * dm + FX[0][n] + rev[0][n] * 0.55 + dly[0][n] * 0.32;
      R[n] = DRUMS[1][n] * 0.9 + BASS[1][n] * d * 0.95 + MUSIC[1][n] * dm + FX[1][n] + rev[1][n] * 0.55 + dly[1][n] * 0.32;
    }
    // Fade the last 0.25 s to silence; a 4 ms fade-in guards the first sample.
    for (let n = 0; n < N; n++) {
      const t = n / SR;
      const g = Math.min(1, t / 0.004) * Math.min(1, (DUR - t) / 0.45);
      L[n] *= g;
      R[n] *= g;
    }
    // Master high-pass (30 Hz) — no sub-sonic rumble.
    {
      const hl = svf();
      const hr = svf();
      for (let n = 0; n < N; n++) {
        L[n] = hl(L[n], 30, 0.707).hp;
        R[n] = hr(R[n], 30, 0.707).hp;
      }
    }
    // Gentle bus saturation, then peak-normalize to −1 dBFS.
    const DRIVE = 1.25;
    let peak = 0;
    for (let n = 0; n < N; n++) {
      L[n] = Math.tanh(L[n] * DRIVE) / DRIVE;
      R[n] = Math.tanh(R[n] * DRIVE) / DRIVE;
      peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
    }
    const norm = Math.pow(10, -1 / 20) / peak;

    // ── WAV (16-bit PCM, stereo) ────────────────────────────────────────────────
    const data = Buffer.alloc(N * 4);
    for (let n = 0; n < N; n++) {
      data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[n] * norm * 32767))), n * 4);
      data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[n] * norm * 32767))), n * 4 + 2);
    }
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + data.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(2, 22);
    header.writeUInt32LE(SR, 24);
    header.writeUInt32LE(SR * 4, 28);
    header.writeUInt16LE(4, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(data.length, 40);
    fs.mkdirSync(OUT.split("/").slice(0, -1).join("/") || ".", { recursive: true });
    fs.writeFileSync(OUT, Buffer.concat([header, data]));
    console.log(`wrote ${OUT} · ${DUR}s · peak normalized ×${norm.toFixed(3)}`);
  }

  return {
    SR, DUR, N, BEAT, midi, hash, noise,
    kick, clap, hat, tick, woodClick, key, thock, sub, pluck, bell, marimba, pad,
    blip, easeGlide, riser, whoosh, reverseSwell, impact, whir,
    write,
  };
}
