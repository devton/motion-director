# Head-on 3D stage

The stage for flows, pipelines and any board of product cards. It is a CSS-3D world under a camera that
only pans and dollies: the cards always face the viewer, depth comes from the camera, from cards dropping
out of the depth, from props floating in front and from focus pulls. Templates:

- spine [../templates/lib/layout-stage.js](../templates/lib/layout-stage.js) (flows, edges, swaps, runs, camera
  keys, overlay rects; per-node and per-signal times derived in the spine, so the score reads them too);
- world [../templates/compositions/stage-3d.html](../templates/compositions/stage-3d.html) (one `render(t)`),
  overlays [../templates/compositions/stage-hud.html](../templates/compositions/stage-hud.html) (flow bar with a
  Draft/Active switch and a Run button, chapter ticker, executions panel), opening
  [../templates/compositions/title.html](../templates/compositions/title.html);
- libs [../templates/lib/camera.js](../templates/lib/camera.js) (camera) and
  [../templates/lib/board.js](../templates/lib/board.js) (wires sampled analytically);
- film [../templates/index.stage.example.html](../templates/index.stage.example.html), score
  [../scripts/score/arrangement.stage.example.mjs](../scripts/score/arrangement.stage.example.mjs).

## Rig

- `#stage { perspective: 1100px }` > `#world { transform-style: preserve-3d }` > layers (canvas grid, SVG
  wires, ghosts, nodes, tags, props), all positioned in world px.
- Camera state `{ fx, fy, s }`: the world point `(fx, fy)` sits at the screen focus `(px, py)` at scale `s`.
  - `cz = P * (1 - 1 / s)` (P = perspective), `world.transform = translate3d(px - fx, py - fy, cz)`,
    `stage.perspective-origin = px py`. A plane at z = 0 then projects at exactly scale `s`.
  - An element at world z > 0 is nearer: its projected scale is `P / (P - (cz + z))`.
- The focus point may move between shots (e.g. from the left third when a side panel covers the right,
  to the centre when it leaves).
- Rotations are banned for product cards. If anything else in the world rotates, cull by projected Z
  (fade out when `Z > P - 340`), or a far element swings through the lens as a giant quad.

## Camera keys

`[t, fx, fy, s, ease, lift]`, interpolated per frame:

- `s` interpolates in log space (`exp(lerp(log a, log b, e))`), so dollies feel even.
- `lift` (0.08-0.12) pulls the scale down mid-leg (`s *= 1 - lift * sin(pi * u)`): a flight that rises
  off the board and lands, used for long moves between distant groups.
- **Rides are splines.** Keys marked `"spline"` form one smooth tracking shot: Hermite interpolation through
  the keys with Catmull-Rom slopes `(p[i+1] - p[i-1]) / (t[i+1] - t[i-1])`, at rest only at the run's ends.
  Piecewise-eased legs stop at every node and peak at 2-3x the average speed, which blurs exactly where
  the viewer reads.
- A **follow cam** can track a moving lead (the money) with a Hann-smoothed look-ahead (17 taps over
  ±0.4 s), capped before the end of the row so the finish stays in frame, blended into the keyed path with
  0.4 s smoothstep windows at the ride's edges.

## Travel blur

Directional blur on the whole stage from the camera's screen velocity, only above a dead band:

```js
const fast = (v) => Math.max(0, v - 36) * 0.3; // v in px per frame
const bx = Math.min(16, fast(Math.abs((b.fx - a.fx) * s)) + dz);
const by = Math.min(16, fast(Math.abs((b.fy - a.fy) * s)) + dz);
// a, b = camAt(t -/+ 1/60); dz from log-scale speed; SVG feGaussianBlur stdDeviation = `${bx} ${by}`
```

Rides stay sharp, flights smear. Never blur while text must be read.

## The board

- Canvas: near-black or light grid (dots every 24-40 px) masked to a soft ellipse so it fades into the
  backdrop. **Fade the grid with the camera scale** below ~0.5 (moiré and bitrate explode at wide zoom).
- Wires: SVG paths in world space (smoothstep elbows between ports), drawn by dash offset when their
  child lands; a done wire in the success colour; a signal dot rides the wire between a parent's done
  and the child's start; value tags (small pills with the amount) ride with it.
- Value tags ride **clear of the card rows**: above the row for a straight or rising wire, below it for a
  wire that goes down. A tag beside its dot is wider than the gap between two cards and covers them at
  every start and end; on a fork, the above/below rule also keeps sibling tags apart.
- Nodes: HTML cards at `translate3d(x, y - portY, z)`. Top-align cards in a row and put the wire port on
  the header line, as a real editor does.

## Placeholders first (the rhythmic device)

- While the plan forms, text-free **ghost cards** appear (dashed outline, a "+" slot and two bars),
  pulsing slowly, joined by dashed marching wires.
- On each beat one ghost is swapped for its real card: the ghost brightens toward the accent in the last
  0.22 s, the card drops onto it from the depth.

## Drops, focus and rings

- Drop: `z = (200 / s) * (1 - pow3out(p))` over 0.3 s, `opacity` 0 -> 1 in the first 0.1 s, `blur = dof * 8 *
  (1 - pow3out(p))` with `dof = clamp01((s - 0.45) / 0.4)`, a `scale 1.045` bump at landing.
- Ring at landing: see [motion-vocabulary.md](motion-vocabulary.md) (thin, only thins out).
- States: idle (neutral border), running (blue ring + spinner), done (green ring + check); reruns at speed
  reuse the same state machine with a compressed timeline.
- A new run **resets its flows to idle** at its start (cards and done wires clear, then the wave crosses
  them again). Without the reset the old green hides the new run and nothing seems to happen.

## Props (parallax)

The subject's own illustrations float in front of the board beside their step: `z 100-140`, width 260 px,
a slow bob (±16 px, 2.6 s), a pop-up (`scale 0.4 -> 1`, `back.out`), light blur from depth of field. They
live in medium/close shots only: fade them with scale (`clamp01((s - 0.62) / 0.12)`), and never over
the flow bar, the side panel or text: the spine lists the overlays' rects with their time spans
(`KEEP_OUT`) and a prop fades as its projected disc comes within 40 px of one. Props leave before the outro
(when the overlays go, nothing else should reappear).

## Layout discipline

- Build flows close together in aligned lanes on one page; keep the camera near the action; no far-away
  wides except one final hold.
- Screen overlays (a flow bar with a Draft/Active switch, an executions log) live outside the world, in a
  sibling composition on the same window, so neither the camera nor the travel blur touches them.
- Without a character, open the workspace with an iris that starts as the title lines dive past the viewer.
- Frame every camera shot from measured card rects, not from a guessed grid.
- A HUD card (a step card, a chapter number ticker) sits in a corner the camera never frames content into;
  shift the focus point, not the HUD, when they collide.

## Performance

- One per-frame writer for the whole stage (`render(t)` from a clock tween), with a style cache so static
  elements cost nothing (`put(el, key, value)` only writes when the value changes).
- ~170 cards with three state layers render fine in the DOM; for hundreds more, use level of detail by
  scale (real card, skeleton, state-coloured pill).
