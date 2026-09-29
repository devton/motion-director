# Timing architecture (the spine)

Every composition and the score read one file: `assets/lib/layout.js`. It holds all times, all shared
rects and all content that more than one file needs. Nothing else hard-codes a time. Templates:
[../templates/lib/layout.js](../templates/lib/layout.js) (agent promo: asks on an 11-beat grid) and
[../templates/lib/layout-stage.js](../templates/lib/layout-stage.js) (flow showcase: flows, swaps on beats,
runs whose per-node and per-signal times are derived in the spine).

## Why one spine

- Handoffs between compositions need pixel-identical rects at identical times.
- The score must hit the same frames (a key tick per typed character, a hit per landing).
- Re-timing the film (moving an ask, stretching the close) must be a one-file change.

## Shape of the spine

```js
(function (root) {
  const BEAT = 0.5; // 120 BPM
  const A0 = 6.0, STEP = 5.5; // asks every 11 beats, starting on a beat
  const ASK = [0, 1, 2, 3, 4].map((k) => {
    const t0 = A0 + STEP * k;
    return { t0, type0: t0, type1: t0 + 0.95, send: t0 + 1.0, dots: t0 + 1.25,
             reply: t0 + 2.0, build: t0 + 2.0, check: t0 + 4.5 };
  });
  const T = { BEAT, /* hook times, ASK, finale times */ win: { /* composition windows */ } };
  const api = { T, /* rects, messages, content arrays */ };
  root.LAYOUT = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
```

- Loaded by `index.html` before any composition (`<script src="assets/lib/layout.js">`).
- Required by the score script: `createRequire(import.meta.url)("../assets/lib/layout.js")`, then read
  `globalThis.LAYOUT` (in a `"type": "module"` package a `require()` of a UMD file returns an ESM namespace).

## The beat grid

- 120 BPM: beat 0.5 s, bar 2 s. Structural events (slams, landings, answers, checks, cuts) on beats or
  16ths (0.125 s). UI micro-events (typed characters) are free, but their block starts/ends on the grid.
- Repeated units use a whole number of beats: an ask every 11 beats (5.5 s) keeps every derived event on
  the grid; 5.4 s drifts off it within two asks.
- Intro ≈ 5.5-6 s, the asks, a close of 6-7 s: 40 s total for five asks.

## Composition windows

- Each composition has `[start, end]` in `T.win` and the same numbers as `data-start`/`data-duration` in
  `index.html`. Generate the slot attributes from the spine (a small script) or check them by eye; they
  must agree.
- Compositions may overlap in time (both paint; DOM order is z). Overlap by the handoff's length plus a
  frame or two; an incoming surface starts 0.25-0.4 s before its build.
- Inside a composition: `const T0 = T.win.<id>[0]; const at = (r) => r - T0;` and author in root seconds.
- Extend every composition's timeline to its full slot (`tl.to({}, { duration: 0.01 }, DUR - 0.01)`), or its
  per-frame renderers freeze before the slot ends.

## Handoff table (write it in `STORYBOARD.md`)

| time | carrier | the rect both sides agree on |
| --- | --- | --- |
| e.g. 4.6-5.5 | the character flies into the chat header | header avatar rect |
| e.g. 5.93 | the hello bubble becomes message 0 | message 0 rect |

Rules:

- Put the flyer AT the landing geometry: author it at its final size with `transform-origin: 0 0`, and
  pose it big with x/y/scale earlier; at the landing it is at scale 1 on the exact rect.
- Swap on the landing frame: the receiver shows at `land - 0.02`, the flyer hides at `land + 0.02`.
- If the receiver is inside a container that is still animating (a panel scaling in), keep the flyer
  visible until the container is at rest, then swap.
- Verify by colour bounding boxes on snapshots one frame before and after, not by eye.

## Content in the spine

- Chat messages with **fixed line breaks** and computed heights (so scroll positions are constants).
- The requests' exact strings (the typing schedule and the score both need them).
- Feature labels, counters (start value, deltas with their times), shareable URL strings.
- Geometry: panel rects, stage rects, card rect, tracker rect, header avatar rect, message 0 rect.

## Traps

- **Duplicate keys win silently:** adding `keysPress` for the finale when the hook already has `keysPress`
  moves the hook. Namespace late additions (`finKeys`).
- **Derived values:** compute them in the spine (`ASK[k].build`), never re-derive in a composition.
- **Locale:** shell scripts that print times with `printf`/`awk` must `export LC_ALL=C` (a comma decimal
  breaks ffmpeg arguments).
