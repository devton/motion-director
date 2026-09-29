## motion-director.workflow.character

### Goal

Turn a supplied avatar or mascot into a validated vector module with a rig (`assets/lib/<character>.js`).

### Scope

- Applies to: illustrations, flat art, pixel art and small rasters supplied for an agent/mascot.
- Does not cover: photos of real people (static crop only), official brand symbols (never redrawn).

### Triggers

- "Use this picture as the agent's face", "make the mascot blink / think / nod".
- The `produce` chain, step 4, whenever the brief names a character with supplied art.

### Inputs

- The source image URL/file (download the largest size the host offers).
- The character's role in the story (what it must express: hello, thinking, answering).

### Invariants

- The vector reproduces the source: validated by a supersampled raster diff (mean ≤ 2.0 per channel for flat
  art) and a zoomed side-by-side inspection of tips and notches.
- No features the source lacks; no restyling.
- Every rig motion is a pure function of time; ids are unique per instance.
- Provenance kept: the source file and the measurement scripts' outputs stay in the research folder.

### Procedure

1. Download the source; `bash <skill>/scripts/vectorize/to-raw.sh <image> <out.rgb>` (prints `W H`); view it.
2. `bun <skill>/scripts/vectorize/measure.mjs` for colour clusters and interior samples.
3. Fit primitives where the art uses them (`fit-ellipse.mjs` for discs and heads; splits by row
   crossings); record the numbers.
4. `trace.mjs` the free shapes (luma field for JPEG sources, light blur, DP ≈0.6 px).
5. `tips.mjs` to locate tips, `corners.mjs` with those coordinates; `spline.mjs` to build the path with
   sharp corners.
6. `long-shadow.mjs` (or other effects the art contains).
7. `raster-diff.mjs` with the layer spec; iterate until within budget; zoom-compare tips.
8. Write the module (`markup`, crops, rig functions), following
   [../../reference/character-rig.md](../../reference/character-rig.md); render it in a snapshot at 88, 320
   and 400 px.

### Outputs

- `assets/lib/<character>.js`; `<research>/<character>/` with the source, raw, polygons, scripts' outputs,
  a comparison image and the measured diff.

### Review gate

- [ ] Mean absolute difference within budget; tips and notches match on the zoomed comparison.
- [ ] Crops (circle / square / none) render; ids unique; the rig runs seek-safe in a snapshot sequence.
- [ ] The character never shows features the source lacks.

### References

- [../../reference/character-rig.md](../../reference/character-rig.md) · [../../scripts/vectorize/](../../scripts/vectorize/)
