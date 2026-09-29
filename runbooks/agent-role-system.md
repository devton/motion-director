# Runbook: how the motion-director roles chain

## Objective

Explain, for an operator, how one request becomes a verified video through the skill's roles and
workflows, and where to intervene.

## The chain

```
request -> /motion-director produce
  research  (Researcher)  -> RESEARCH.md, capture/, web/
  concept   (Designer)    -> BRIEF.md, DESIGN.md, STORYBOARD.md, assets/lib/layout.js, index.html slots
  character (Rigger)      -> assets/lib/<character>.js            (only with supplied art)
  build     (Builder)     -> compositions/*.html                   (lint after each file, snapshots)
  score     (Composer)    -> scripts/synth-score.mjs, assets/audio/score.wav, <audio> slots
  verify    (QA)          -> check, render, MP4 frames, loudness, poster, contact sheet, report
```

Stages communicate only through these files (see
[../reference/role-contracts.md](../reference/role-contracts.md)); any stage can be re-run alone.

## Parallelism

- Research breadth runs in a background subagent while the scaffold, the character and the design tokens
  proceed.
- Everything else runs inline: short films (≤ 6 scenes) build faster in one context than through workers.

## Where to intervene

| Symptom | Re-run | Then |
| --- | --- | --- |
| A claim or label is wrong | `research`, then fix copy in the spine/compositions | `verify` |
| The story or timing feels off | `concept` (spine), then `build` for the affected windows | `score`, `verify` |
| A transition shows a blank or stray frame | `build` | `verify` |
| The intro sounds empty | `score` | `verify` |
| Audit warnings | `build` (layering, clipped content, contrast) | `verify` |

## Exit criteria

- The `verify` review gate passed and the report was delivered with the file paths.
