# Character rigs from supplied avatars

When the user supplies an avatar for an agent or mascot, the character becomes a vector module with a rig,
so it stays crisp at any size and can react (think, talk, nod). Scripts: [../scripts/vectorize/](../scripts/vectorize/).

## Decide first

- **Illustration / flat art / pixel art / small raster:** vectorize and rig (this page).
- **A photo of a real person:** do not vectorize, rig, lip-sync or alter it. Use it as a static circular
  crop, and give it life only from outside (ring, nod of the whole crop, glow).
- **An official brand symbol:** never redraw; use the official file, animate only transforms and masks.

## Pipeline (flat-colour illustration)

1. **Measure** (`measure.mjs`): decode to raw RGB (`to-raw.sh`, which prints `W H`), histogram the colours
   (quantize by 16), sample flat interiors to get each region's exact colour.
2. **Primitives first:** fit simple shapes by least squares where the art uses them (`fit-ellipse.mjs`: a
   head ellipse fitted to boundary points away from other regions; check the conic tilt; a vertical split
   between two tones measured by the midpoint crossing per row, median).
3. **Trace free shapes** (`trace.mjs`): marching squares on a scalar field at iso 0.5, largest loop,
   Douglas-Peucker ~0.6 px.
   - For JPEG sources build the field from **luma** (full resolution); chroma is 2x subsampled and a colour
     channel's iso-line stair-steps every 2 px. Map luma bands to 0..1 per the neighbouring colours
     (e.g. `Y <= yShape ? (Y - yBg) / (yShape - yBg) : (ySkin - Y) / (ySkin - yShape)`).
   - A light Gaussian (sigma 0.5-1) on the field before contouring removes compression noise.
   - A closed ring has no baseline for Douglas-Peucker: split it at the farthest point, simplify halves.
4. **Sharpen known corners** (`corners.mjs`): tips and notches are blunted by any blur. Find the tips with
   `tips.mjs` (local minima of the top profile, sub-pixel), then for each measured tip, fit lines to its two flanks (points 4-15 px from the tip, sampled along the polygon edges), replace
   the vertices within 4.5 px by the flanks' intersection (only if within 7 px of the measured tip).
5. **Smooth everything else** (`spline.mjs`): a closed Catmull-Rom spline through the vertices, with the
   corner vertices kept sharp (mirror the neighbour so the tangent follows the chord).
6. **Effects the art contains** (`long-shadow.mjs`): a 45 degree long shadow is the silhouette swept along
   (1, 1): propagate a supersampled mask diagonally (`m[y][x] |= m[y-1][x-1]`), trace it, simplify; its fade
   is a linear gradient along x + y measured from the pixels (usually black 15 % -> 0 %).
7. **Validate** (`raster-diff.mjs`): rasterize the vector layers with 4x4 supersampling in the script and
   diff against the source: mean absolute difference per channel. Budget: ≤ 2.0 for flat art (typical
   1.3-1.4); inspect a 3x nearest-neighbour zoom of both side by side for shape faithfulness (tips, notches).
8. **Tiny rasters (≤ 96 px):** light halos and dark rings around features are resampling ringing, not
   design; vectorize flat and validate by rendering 10x then Lanczos-downscaling before the diff.

## Module shape (`assets/lib/<character>.js`)

```js
(function (root) {
  const C = { /* measured colours */ };
  const HEAD = { cx, cy, rx, ry }; // fitted primitives
  const HAIR = [/* polygon */]; const CORNERS = [/* indices kept sharp */];
  function markup({ id, shape }) { /* <svg> string: tile/crop, shadow, groups for rigging */ }
  function partD(t, amp) { /* a deformed path, pure function of time */ }
  root.Character = { markup, partD, colors: C };
})(typeof window !== "undefined" ? window : globalThis);
```

- Group parts for rigging (`.head`, `.hair`, `.eye-l`, `.mouth` ...) with sensible pivots.
- Offer crops: `circle` (profile), `square` (tile, rounded), `none` (cut-out character).
- Unique ids per instance (clip paths and gradients collide otherwise).

## Rigs (all pure functions of time)

- **Nod:** `rotation ±5-6`, `y -4 to -8` in 0.12-0.14 s, back in 0.3 s `back.out(2)`, on every answer.
- **Blink/talk** (for faces that have eyes/mouths): blink = eyelid scaleY 1 -> 0.1 -> 1 in 0.12 s at
  irregular seeded times; talk = mouth scaleY oscillating while a line is "spoken".
- **Element flicker** (hair, flame, antenna, tail): displace polygon points by
  `amp * w(y) * (0.62 sin(2pi(1.7t + x/97)) + 0.38 sin(2pi(2.9t + y/53)))` with a height weight `w` so the
  base stays put; rebuild the spline path per frame (only when it changes). Calm amplitude ≈3, flare 7-9
  while thinking, a sine bump over the think window.
- **Pop:** `scale 0 -> 1` from below with `back.out(1.8)` and a thin accent ring.
- Never add features the source does not have (a faceless character stays faceless).
