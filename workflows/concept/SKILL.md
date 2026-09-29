## motion-director.workflow.concept

### Goal

Turn the research into one concept and its executable plan: `BRIEF.md`, `DESIGN.md`, `STORYBOARD.md` and
the timing/geometry spine `assets/lib/layout.js`.

### Scope

- Applies to: every new video and every re-timing.
- Does not cover: writing compositions (that is `build`).

### Triggers

- The `produce` chain, step 3.
- "Pitch me concepts", "rewrite the storyboard", "make it 40 s", "move the asks to the beat".

### Inputs

- `RESEARCH.md` and the capture; the user's words; supplied material.
- Format defaults from the `produce` contract.

### Invariants

- One sentence of message; every scene serves it.
- Five concepts pitched (two from the tail); the pick and the four left behind recorded.
- Scene shapes cite HyperFrames blueprint ids or rule ids (`/hyperframes-animation` indexes).
- Structural events on the 120 BPM grid; repeated units a whole number of beats.
- `DESIGN.md` comes only from brand truth (research); no invented palette.

### Procedure

1. **Pitch round** (internal on autonomous runs): five one-line concepts along different axes; pick with
   reasons ([../../reference/concept-patterns.md](../../reference/concept-patterns.md)).
2. **`BRIEF.md`:** canonical frontmatter (`workflow`, `flow`, `storyboard`, `message`, `destination`,
   `aspect`, `language`, `length`, `angle`, `narration`) and body sections Intent (the user's words verbatim,
   the concept, the pitch round), Research, Assets, Customizations, Notes (illustrative data, flags,
   autonomous decisions).
3. **`DESIGN.md`:** worlds (backgrounds), colour tokens with uses, type (families, weights, roles),
   components (cards, chips, buttons, the character), motion language (tempo, eases, handoff style),
   don'ts.
4. **Spine** (`assets/lib/layout.js`, installed by setup from
   [../../templates/lib/layout.js](../../templates/lib/layout.js) for the agent shape or
   [../../templates/lib/layout-stage.js](../../templates/lib/layout-stage.js) for the stage shape):
   all times (hook, asks via `A0 + STEP * k` or swaps and runs on the beat grid, finale), composition
   windows, shared rects (panel, header avatar, message 0, stage card, tracker, overlays), content arrays
   (messages with fixed line breaks, requests, flows and edges, features, counters with their deltas and
   times, URLs), and the derived values (per-node run times, signal windows) the compositions and the score
   both read.
5. **`STORYBOARD.md`:** frontmatter (format, duration, fps, message, arc, rhythm), the layer order, the
   handoff table (time, carrier, the rect both sides agree on), then one `## Frame N` block per composition
   with `status`, `src`, `duration`, `scene`, blueprint/rules.
6. **Slots:** write `index.html` slots (`data-start`/`data-duration` = the spine windows), the vendored libs
   in load order (GSAP + plugins, brand data libs, `hw.js`, character lib, `layout.js`, `ui.js`, and for the
   stage `camera.js` + `board.js`) and fonts. Start from
   [../../templates/index.example.html](../../templates/index.example.html) or
   [../../templates/index.stage.example.html](../../templates/index.stage.example.html).

### Outputs

- `BRIEF.md`, `DESIGN.md`, `STORYBOARD.md`, `assets/lib/layout.js`, `index.html` slots.

### Review gate

- [ ] The message fits in one sentence and every frame block serves it.
- [ ] Every repeated unit is a whole number of beats; hook slams and landings on 16ths or beats.
- [ ] Windows in `index.html` equal `T.win` in the spine; no duplicate keys in `T`.
- [ ] Every shared rect is defined once in the spine.
- [ ] On-screen copy in the brief/storyboard is traceable to `RESEARCH.md`.

### References

- [../../reference/concept-patterns.md](../../reference/concept-patterns.md) ·
  [../../reference/timing-architecture.md](../../reference/timing-architecture.md) ·
  [../../reference/chat-driven-demo.md](../../reference/chat-driven-demo.md) ·
  [../../reference/stage-3d.md](../../reference/stage-3d.md)
