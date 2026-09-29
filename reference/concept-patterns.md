# Concept patterns

Proven story shapes, hooks, transitions and finales. A concept is chosen from a pitch round (five concepts,
two from the tail of the distribution), then written into `BRIEF.md` with the left-behind options.

## Story shapes

### A. Agent / co-pilot promo (chat drives the product) - 30-45 s

The strongest shape for "an assistant that manages your account". One pinned conversation on one side;
the product's real surfaces on the other. Every answer becomes the real thing.

1. **Hook (0-4 s):** the overwhelm. The product's own breadth ("more than N solutions", its feature list)
   piles up as chips/tabs with a counter, then implodes into one point.
2. **Flip line (≈2.3 s):** one short line that reframes ("Now, just ask."), slammed word by word.
3. **Meet the character (3-5.5 s):** the agent pops out of the implosion point, says hello in a bubble,
   a one-line role under it; the next world opens from behind it (light/iris) and it flies into the chat
   header; the chat unfolds out of it; its hello bubble becomes message 0.
4. **N asks (4-6 asks, 5.5 s each on an 11-beat grid):** each ask is typed, sent, thought about (visible
   thinking), answered, and realized as a surface on the stage; the next surface grows out of the previous
   one (card deck). A tracker of the product's feature chips checks off; a running counter (balance,
   subscribers, views) moves with every real in/out.
5. **One human approval:** any money-out or destructive step ends with the user's click ("Approve").
6. **Close (6-7 s):** back to the hero world; a callback of the brand's tagline; the official mark
   assembles; the agent returns with its line; the site's own CTA; the checked features as a recap.

### B. Flow showcase (head-on 3D stage) - 30-90 s

For builders, automations, pipelines. Ghost placeholders plan the flow, then turn into real nodes on the
beat; the camera rides the money node to node; a run executes with value tags; a log records it; the
finale drops more flows beside it in aligned lanes and everything runs. See [stage-3d.md](stage-3d.md).

### C. Showreel (15 s, six disciplines)

A résumé piece: one protagonist object travels through six motion disciplines (kinetic type, 3D object,
UI, data, generative, logo), each 2-2.5 s, handed off object to object. Pick one register:

- **Engineered precision:** grid, snaps, real functional objects (a scannable code, a code editor typing
  the product's own API call, a split-flap board, an isometric city, a warp tunnel).
- **Paper collage:** stickers, stamps, tape, hand-drawn boil at 12 fps, folds.
- **Dark neon line:** one continuous signal line through channels, logo reveal by masked stroke.
- **Text-only terminal:** the reel rendered in characters (terminal HUD, streamed request, ASCII render).

### D. Logo sting / title card (≤ 10 s)

Hook in 0.3 s, one transformation, the untouched mark by 70 % of the duration, hold.

## Hooks

- **Overwhelm-surround:** 12-16 chips (real feature names) slam in on an accelerating 8th/16th grid around a
  headline, jitter for 0.4 s, implode to a point in 0.28 s (`power3.in`), the headline shoved away.
- **Kinetic slam lines:** 2-3 short lines, each a different entrance (scale-slam with blur, side-snap,
  rise with overshoot), a 4-step decaying camera shake per slam.
- **Counter in the headline:** the number in the line counts up with tabular digits while it lands.
- **Question/flip:** a question line, then the answer line with one accent word and an underline swipe.
- **Keycaps:** the product's shortcut as two keycaps that drop, then press on the beat with a ring.

## Transitions

- **Iris from behind the character:** the next world opens as a circle centred on the character, so its
  first pixels hide behind it (0.38 s, `power2.in`).
- **Tunnel/warp:** the hero's light streaks accelerate (scaleX up) into the cut; reverse for the close.
- **FLIP handoff:** an element flies to the exact rect of its counterpart in the next composition, which
  takes over on the landing frame (see [timing-architecture.md](timing-architecture.md)).
- **Card deck:** the new surface arrives from the right (`x +150`, scale 1.04 -> 1, 0.55 s `expo.out`) while
  the old one recedes left (`x -170`, scale 0.9, blur 6 px, 0.32 s `power2.in`).
- **Collage wipe / fold:** sheets wipe in covering the frame; a letter folds into an envelope.
- **Dive:** the camera dollies through the headline into the depth where the mark appears.

## Finales

1. Headline (the brand's own close line) slammed word by word, the verb in the accent colour with an
   underline swipe; a slow push while it holds.
2. The dive or the tunnel; the mark comes out of the depth (scale 0.05 -> 1, blur 30 -> 0, `expo.out`) or
   draws along its centre-line (mask stroke, `butt` caps), then settles into the untouched lockup.
3. The character's line, the CTA (the site's own button label, the site's colours), the URL.
4. Optional recap row (the features just shown, checked). Hold ≥ 2 s on the final frame.

## Pitch round (internal, autonomous runs)

Write five one-line concepts along different axes (character-led, product-led, data-led, type-led,
metaphor-led), at least two from the tail. Pick one for fit with the user's words and the research; record
the pick and the four left behind in `BRIEF.md` under `## Intent`.
