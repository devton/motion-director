# Motion vocabulary

The moves this skill uses, with the numbers that made them read well at 1920x1080 / 30 fps. Cite the
HyperFrames blueprint or rule id in `STORYBOARD.md` when one fits (`/hyperframes-animation` indexes), and
use these parameters as the house defaults.

## Entrances and emphasis

| Move | Parameters |
| --- | --- |
| Slam (headline word/line) | `scale 1.5-2.6 -> 1`, `filter blur(10-12px) -> 0`, 0.22-0.3 s `power4.out`; plus a camera kick |
| Camera kick | 4 zero-duration sets on the wrapper at +0.03/+0.066/+0.1/+0.133 s: `(k, -0.6k)`, `(-0.8k, 0.5k)`, `(0.3k, 0)`, `(0, 0)`, k = 6-12 px |
| Side-snap | `x -240 -> 0`, 0.3 s `expo.out` |
| Rise with overshoot | `y 80 -> 0`, 0.32 s `back.out(2)` |
| Spring pop (chips, badges, checks) | `scale 0 -> 1`, 0.2-0.3 s `back.out(2.2-3)` |
| Waterfall (card parts) | `y 16-30 -> 0`, `opacity 0 -> 1`, 0.35 s `power3.out`, stagger 0.05-0.08 |
| Chat entry | bubble `scale 0.75 -> 1`, `opacity 0.6 -> 1` in 0.12 s `power2.out`, origin = the sender's corner; the sender's own bubble also rises `y 60-70 -> 0` in 0.24 s |
| Button press | `scale 0.93` in 0.08-0.1 s `power1.in`, back in 0.3-0.4 s `back.out(1.8-2.5)` |
| Keycap press | cap `y +14` in 0.06 s `power2.in`, back in 0.24 s `back.out(3)`, ring `scale 0.3 -> 3.2` + fade 0.55 s |
| Underline swipe | an element under the word, `scaleX 0 -> 1` (origin left), 0.26-0.3 s `power3.out` |
| Accent ring (landing) | a thin ring grows `r 40 -> 210` world units and only thins out (width `max(6, 1.8/s) * (1 - p)`), 0.55 s |

Never tween `letterSpacing` (lint error); use `scaleX`. Never animate layout properties when a transform will do.

## Numbers that move

- **Count-up/down:** a per-frame writer: `v = from + (to - from) * ease(clamp01((t - t0) / d))`, `d` 0.5-1.2 s,
  `power2.out`; write text only when the formatted string changes; `font-variant-numeric: tabular-nums`.
- **Money:** a deterministic formatter (no `Intl` locale dependency): thousands and decimal separators per
  the subject's locale; show the delta as a pill beside the number (`+ 150.00` in, `- 740.00` out) that
  rises in 0.3 s and fades after 1.6 s; bump the number `scale 1.06` yoyo on arrival.
- **Views/subscribers:** counts that finish before the next beat group; never a counter still running
  across a cut.

## Chat mechanics

- **Typing:** ≈40-45 characters per second: `time[i] = t0 + (t1 - t0) * i / n + hash(i*7 + k*131) * 0.012
  + (prev char is a space ? 0.01 : 0)`. Caret blinks at 2.5 Hz when idle, solid while typing.
- **Thinking:** a dots bubble (three dots bouncing `y -7`, 0.12 s yoyo, staggered 0.08 s) + a thin ring
  spinning around the agent's avatar + the character's own "thinking" rig (see
  [character-rig.md](character-rig.md)); total 0.6-0.8 s.
- **Answer:** the bubble enters; the avatar nods (`rotation ±6`, `y -4` in 0.12 s, back in 0.32 s
  `back.out(2)`); a check icon leads the first line of a confirmation.
- **Cursor:** arrives in 0.55 s `power2.out` from off-frame, press 0.1 s, ripple ring 0.55 s, leaves in
  0.55 s `power2.in`. Cursor tip coordinates are computed from the spine rects, never eyeballed.

## Surfaces and state

- **Card deck handoff:** new card `x +150 -> 0`, `scale 1.04 -> 1`, 0.55 s `expo.out`; old card `x -170`,
  `scale 0.9`, `blur 6px`, `opacity 0`, 0.32 s `power2.in`, starting 0.1 s earlier.
- **Status flip:** the old pill hides (autoAlpha 0) on the frame the new pill pops (`scale 0.6 -> 1`,
  `back.out(3)`); never cross-fade two pills of text on the same spot.
- **Assembly:** grids/QR modules appear on a stepped diagonal sweep (`delay = (x + y) / (2n) * 0.55`), with
  anchors (finder squares, headers) first.
- **Sequential success:** list rows flip to "done" one by one every 0.12 s, each with a tint flash.
- **Schedules:** month/day cells light up one by one every 0.1 s with a check and a `scale 1.06` bump.
- **Flows on paths:** dots ride SVG paths (`getPointAtLength`, loop period ≈0.9 s, three dots per path);
  wires draw first (`drawSVG 0 -> 100%`, 0.4 s `power2.inOut`); totals count as the dots land.

## Camera and transitions

- **Iris:** `clip-path: circle(0% at <character centre>) -> circle(95% at ...)`, 0.38 s `power2.in`.
- **Tunnel:** light streaks `scaleX 1 -> 2.6`, `x -520`, 0.5 s `power3.in` into the cut; `expo.out` back.
- **Dive:** the camera scale `0.4 -> 1.9` over 0.6 s `power3.in` through the headline (which scales to 4.2
  and blurs 16 px in 0.42 s `power2.in`); the world fades out at the end of the dive.
- **Mark from depth:** `scale 0.05 -> 1`, `blur 30 -> 0`, 0.75 s `expo.out`; ring pulse 0.7 s.
- **Holds:** every hold has a slow push (`scale 1 -> 1.03-1.05`, `ease: none`) until the last frame.
- **Head-on 3D camera:** see [stage-3d.md](stage-3d.md).

## Timing feel

- Arrive before the beat, land on it: entrances start 0.1-0.3 s before the beat they land on.
- Exits are faster than entrances (≈0.6x) and use `.in` eases; entrances use `.out` eases.
- One focal motion at a time; secondary motion is ≤ 30 % of the focal amplitude.
