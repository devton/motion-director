# Role contracts

One agent may play every role, but each role owns specific artifacts and hands off through files, never
through memory of the conversation. A role never edits another role's artifact without re-running that
role's gate.

| Role | Owns | Inputs | Hands off | Gate it must pass |
| --- | --- | --- | --- | --- |
| Director | the route, the concept pick, the final report | request, all artifacts | decisions recorded in `BRIEF.md` | `produce` review gate |
| Researcher | `RESEARCH.md`, raw page copies, capture folder | URLs, names | verbatim facts table + flags | every on-screen fact has a URL |
| Designer | `BRIEF.md`, `DESIGN.md`, `STORYBOARD.md`, `assets/lib/layout.js` | research | spine + frames with blueprint/rule citations | timing on the beat grid, windows consistent with `index.html` |
| Rigger | `assets/lib/<character>.js`, validation numbers | supplied image | markup + rig API + measured diff | raster diff within budget, no invented features |
| Builder | `index.html`, `compositions/*.html`, `assets/lib/ui.js` | spine, design, rig | compositions that lint clean | lint 0 errors, handoff frames pixel-identical |
| Composer | `scripts/synth-score.mjs`, `assets/audio/score.wav`, SFX `<audio>` slots | spine | a normalized score keyed to the spine | -16 LUFS ±1, no unintended dips |
| QA | check logs, snapshot sheets, MP4, poster, contact sheet, report | the project | the verdict + the report | `verify` review gate |

## Handoffs (artifacts, in order)

1. `RESEARCH.md` (+ `web/` raw copies, `capture/`) -> Designer
2. `BRIEF.md` + `DESIGN.md` + `STORYBOARD.md` + `assets/lib/layout.js` -> Rigger, Builder, Composer
3. `assets/lib/<character>.js` -> Builder
4. `compositions/*.html` + `index.html` -> Composer (for SFX slots) and QA
5. `assets/audio/score.wav` -> QA
6. QA report -> Director -> user

## Boundaries

- The Researcher never paraphrases a quote into a claim; paraphrase lives in the brief, labelled.
- The Designer never adds a fact the research does not hold.
- The Builder never hard-codes a time or a shared rect; it reads the spine.
- The Composer never guesses a time; it imports the spine.
- QA never waives an error; a justified warning is written into the report with its reason.
