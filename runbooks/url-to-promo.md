# Runbook: from a URL to a promo MP4

## Objective

Take a public product URL (and optionally a supplied avatar) to a 35-45 s verified promo in one session.

## Inputs required

- The URL; the agent/character name and art if any; language (default: the site's); length (default 40 s).

## Steps

1. `/hyperframes` intent layer (autonomous: `flow: automation`, `storyboard: no`), route `general-video`.
2. Scaffold: `bun x hyperframes@<pin> init tmp/<slug> --non-interactive --example=blank --skill=general-video`,
   then `bash <skill>/scripts/project/setup.sh tmp/<slug> <pin> agent` (`stage` for a flow showcase).
3. Research: capture + docs + a background subagent for the targets; write `RESEARCH.md` with flags.
4. Character (if art supplied): measure, trace, sharpen, spline, diff, module.
5. Concept: pitch round; `BRIEF.md`, `DESIGN.md`, spine (asks at `6.0 + 5.5k`), `STORYBOARD.md`, slots.
6. Build: bg, hook, chat or stage, surfaces, tracker, finale; lint per file; snapshots; fix.
7. Score: arrangement from the spine; loudness; SFX slots.
8. Check to zero; render; contact sheet from the MP4; loudness of the mix; poster.
9. Report.

## Timing guide (40 s, five asks)

| span | content |
| --- | --- |
| 0-2.0 | overwhelm hook: chips + headline with a counter |
| 2.0-3.0 | implosion, flip line |
| 3.0-4.5 | the character pops, hello bubble, role line |
| 4.5-6.0 | the light opens from behind it, it lands in the chat, the chat unfolds |
| 6.0-33.5 | five asks of 5.5 s |
| 33.5-40 | tunnel back, mark, character line, CTA, recap, hold |

## Exit criteria

- `verify` review gate passed; report delivered.

## Failure handling

- If research contradicts the requested story (the product cannot do what the brief asks), change the story
  (approval steps, read-only asks), record the flag, and say so in the report.
- If the check still fails after two correction passes on the same finding, report the finding with a
  snapshot and ask the user.
