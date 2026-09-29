# Chat-driven product demo

A pinned conversation drives the product: the user asks, the agent thinks and answers, and each answer
becomes a real product surface beside the chat. Template:
[../templates/compositions/chat.html](../templates/compositions/chat.html).

## Layout (1920x1080)

- Chat panel on one side (≈680x984 at a 48-56 px margin); the stage on the other (≈1072 wide).
- Above the stage: a row of the product's feature chips (the ones the asks will exercise) that check off,
  and a strip with the running counter (balance, subscribers) and the account label.
- The stage shows one surface card at a time (≈720x712) plus, before the first ask, an overview of the
  account (tabs and tiles as the product's app shows them).

## The panel

- Header: the agent's avatar (circle, 88 px), its name, a green online dot that breathes every 2 s, a
  one-line role ("your co-pilot in <product>"), the product mark small at the right, a hairline.
- **Keep the header avatar outside the panel element** (screen coordinates), so the panel can scale in
  from it without shrinking it, and so it can nod and wear a thinking ring independently.
- Message list inside a clipped viewport; the composer (input + send button) at the bottom.
- Bubbles: the user's in the product's primary colour with white text, right-aligned, tail corner bottom
  right; the agent's in a light neutral with primary text, left-aligned beside a small avatar, tail corner
  top left. Font 26-28 px, line height 38 px, padding 18/24 px, max width ≈520 px.

## Messages as data

- Every message is an entry in the spine: `{ id, kind, k (ask index), lines: [...], check?, approval? }`.
  Line breaks are fixed by hand (no reflow); height = `lines * line + padY * 2 (+ actions row)`; `y` is
  accumulated with a fixed gap. Scroll positions are therefore constants.
- The requests' strings are the joined lines of the user's messages (the typing schedule and the score
  both read them).

## Per-ask choreography (offsets from the ask start, 11-beat asks)

| offset | event |
| --- | --- |
| 0.0-0.95 | the request types into the composer (placeholder hidden while text exists) |
| 1.0 | send: the button presses, the user's bubble leaves the composer and rises into the list |
| 1.25 | the agent is typing: dots bubble in the answer's slot; thinking ring + character rig flare |
| 2.0 | the answer replaces the dots; the avatar nods; the stage surface starts building |
| 2.0-4.0 | the surface builds, changes state, counters move |
| 4.5 | the feature chip checks off |
| 5.5 | the next ask starts |

Events the product itself emits (a payment arriving, a webhook) produce a proactive agent message later in
the ask, with its own nod and flare.

## Scroll

- The newest bubble sits on the viewport floor: `y = min(0, LIST_H - bottom)`, tweened 0.25-0.3 s
  `power3.out` at each send, dots and answer.
- Record every scroll target; once a message is fully above the view, hide it (`visibility: hidden`). The
  audit samples clipped text and reports 1:1 contrast otherwise.

## The composer

- Deterministic typing (see [motion-vocabulary.md](motion-vocabulary.md)); a multi-line prompt grows the
  composer upward one line at a time (measure the text block's height in the renderer and set top/height).
- The send button is the product's accent with the primary colour icon; it presses on every send.

## Approvals (money out, destructive actions)

- The agent prepares, the human approves: the answer bubble carries an action row (primary "Approve",
  secondary "Review"). The cursor arrives from off-frame, clicks the primary button (press + ripple), the
  button becomes a receipt ("Approved" with a check), the secondary dims.
- Only then does the surface execute (rows paid one by one, the counter goes down, the event name shows).
- Use the product's own vocabulary for the action ("Approve", "Confirm") as its UI or docs use it.

## Surfaces (the stage side)

- One card per ask, each a real product object with the product's labels: header (icon tile + title +
  status pill), the key value big, the object's specifics, its actions, and a footer line with the
  technical truth (an event name in mono) when the story reaches it.
- Handoff between asks as a card deck (see [motion-vocabulary.md](motion-vocabulary.md)); the overview
  recedes (blur + fade) when the first card arrives and does not stay dimmed behind it.
- The running counter strip reacts to real money in/out only, with a delta pill.

## The character in the chat

- The avatar arrives from the intro by a FLIP handoff onto the header rect; the chat unfolds from it
  (`scale 0.1 -> 1`, 0.45 s `back.out(1.2)`, origin = the avatar centre); the intro's hello bubble lands on
  message 0's rect and is swapped once the panel is at rest.
- While thinking: the thinking ring spins (≈540 degrees per think) and the rig flares; on each answer a nod.
