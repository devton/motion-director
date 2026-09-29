/* The spine of an agent/co-pilot promo: every time, shared rect and shared content of the film.
   Read by every composition (loaded by index.html before them) and by scripts/synth-score.mjs (via require).
   Root seconds on a 120 BPM grid (beat 0.5 s, bar 2 s); screen px on a 1920 x 1080 canvas.

   Replace the EXAMPLE content (marked below) with strings from RESEARCH.md; keep the structure and the grid.
   Never define a time or a shared rect anywhere else. Never reuse a key name in T (a duplicate wins silently). */
(function (root) {
  const BEAT = 0.5;

  // ── The asks, on the beat grid: type → send → the agent thinks → answer + build → feature check ──
  const A0 = 6.0; // the first ask starts on a beat, right after the intro lands
  const STEP = 5.5; // 11 beats per ask (a whole number of beats keeps every derived event on the grid)
  const N_ASKS = 5;
  const ASK = Array.from({ length: N_ASKS }, (_, k) => {
    const t0 = A0 + STEP * k;
    return { t0, type0: t0, type1: t0 + 0.95, send: t0 + 1.0, dots: t0 + 1.25, reply: t0 + 2.0, build: t0 + 2.0, check: t0 + 4.5 };
  });

  const T = {
    BEAT,
    // hook (the hero world)
    chips: [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0, 1.0625, 1.125, 1.1875, 1.25, 1.3125, 1.375, 1.4375, 1.5],
    head: [0.25, 0.625, 1.0], // three headline lines slam in
    count: [0.25, 1.0], // the number in line 1 counts up
    jitter: 1.55,
    implode: 2.0,
    flip: [2.25, 2.5], // the flip line, two parts
    charPop: 3.0, // the character pops out of the implosion point
    hello: [3.5, 3.75], // hello bubble, role line
    wipe: 4.5, // the next world opens from behind the character
    fly: 4.6, // the character flies to the chat header
    land: 5.5,
    panelOpen: 5.45, // the chat unfolds out of the landed character
    helloHand: 5.93, // the hello bubble hands off to message 0 once the panel is at rest
    ASK,
    event: ASK[0].t0 + 3.5, // the product emits an event during ask 0 (e.g. a payment arrives)
    eventReply: ASK[0].t0 + 4.0, // the agent reports it on its own
    approveClick: ASK[3].t0 + 3.0, // money out needs a human approval
    approveDone: ASK[3].t0 + 3.125,
    // finale (back to the hero world)
    outro: ASK[N_ASKS - 1].t0 + STEP,
    tagline: 34.0,
    mark: 35.0,
    charEnd: 36.0,
    charLine: 36.25,
    cta: 36.75,
    recap: 37.25,
    end: 40.0,
    win: {
      // [start, end] per composition; index.html data-start / data-duration must match
      bg: [0, 40],
      hook: [0, 6.1],
      chat: [4.7, 34.0],
      tracker: [5.2, 34.0],
      surface: [5.2, 34.0],
      finale: [33.4, 40],
    },
  };

  // ── EXAMPLE content (replace with verbatim research) ──────────────────────────
  const AGENT = { name: "Agent", role: "your co-pilot", initials: "A" };
  const HOOK = {
    chips: ["Invoices", "Refunds", "Payouts", "Reports", "Subscriptions", "Payment links", "Taxes", "Reconciliation",
      "Customers", "Webhooks", "Approvals", "Exports", "Disputes", "Receipts", "Payroll", "Budgets"],
    lines: ["{n} apps.", "Endless tabs.", "One tired team."], // "{n}" becomes a counter
    count: { to: 12 }, // the counter counts up to this during T.count
    flip: ["Or,", "just ask."],
  };
  const FEATURES = ["Invoices", "Payment links", "Subscriptions", "Batch payouts", "Split payments"];
  const COUNTER = { label: "Account balance", start: 12480.0, steps: [[T.event, 150.0], [T.approveDone + 0.25, -740.0]] };
  const FINALE = { tagline: ["Your whole account,", "one conversation."], line: "Just ask.", cta: "Get started", url: "example.com", wordmark: "brand" };
  // One product surface per ask (the stage side). `done` = when its status flips (offset from the ask's build);
  // `rows` reveal one by one and flip to done in turn; `footer` is the technical truth (an event name) in mono.
  const SURFACES = [
    { icon: "qr", title: "Invoice", status: ["Awaiting payment", "Paid"], big: 150.0, sub: "Alex · customer", done: 3.5,
      rows: [["Due", "Today"], ["Method", "Instant transfer"]], footer: "invoice.paid" },
    { icon: "link", title: "Payment link", status: ["Draft", "Active"], big: 297.0, sub: "Online course", done: 0.6,
      rows: [["Link", "example.com/pay/3f9c2a"], ["Views", "38"]], footer: "link.created" },
    { icon: "repeat", title: "Subscription", status: ["Draft", "Active"], big: 49.9, sub: "Monthly · members", done: 1.0,
      rows: [["Frequency", "Monthly"], ["Next charge", "Day 5"], ["Members", "128"]], footer: "subscription.active" },
    { icon: "users", title: "Batch payout", status: ["Awaiting approval", "Paid"], big: 740.0, sub: "5 couriers · today", done: 1.95,
      rows: [["Ana", "160.00"], ["Bruno", "140.00"], ["Carla", "150.00"], ["Diego", "130.00"], ["Elisa", "160.00"]], footer: "payout.confirmed" },
    { icon: "split", title: "Split payments", status: ["Draft", "Active"], big: 200.0, sub: "Every sale", done: 0.8,
      rows: [["Store", "90%"], ["Partner", "10%"]], footer: "split.active" },
  ];

  // ── The chat panel (left) ─────────────────────────────────────────────────────
  const PANEL = { x: 56, y: 48, w: 680, h: 984, radius: 28 };
  const AV = { x: 28, y: 24, size: 88 }; // panel-local header avatar (circle)
  const VIEW = { top: 137, h: 707, pad: 24 }; // panel-local message viewport
  const LIST_H = VIEW.h - VIEW.pad * 2;
  const BUBBLE = { font: 28, line: 38, padY: 18, padX: 24, maxW: 520, gap: 18 };
  const MINI = 48; // the agent's avatar beside its bubbles
  const ACTIONS_H = 70; // an approval button row under a bubble
  const bubbleH = (lines) => lines * BUBBLE.line + BUBBLE.padY * 2;

  // The conversation: fixed line breaks (no reflow), so heights and scroll positions are constants.
  // kind: a = agent, u = user; k = the ask it belongs to; at: "event" = posted on the product's event.
  const MESSAGES = [
    { id: "m0", kind: "a", lines: ["Hi! How can I help?"], w: 340 },
    { id: "u0", kind: "u", k: 0, lines: ["Create an invoice of", "150.00 for Alex"] },
    { id: "a0", kind: "a", k: 0, check: true, lines: ["Invoice created and", "sent to Alex."] },
    { id: "a0b", kind: "a", k: 0, check: true, lines: ["Paid: 150.00 just landed", "in your account."], at: "event" },
    { id: "u1", kind: "u", k: 1, lines: ["Make a payment link", "for the course, 297.00"] },
    { id: "a1", kind: "a", k: 1, check: true, lines: ["Link ready to share."] },
    { id: "u2", kind: "u", k: 2, lines: ["Start a monthly plan", "of 49.90 for members"] },
    { id: "a2", kind: "a", k: 2, check: true, lines: ["Subscription active:", "billed every month."] },
    { id: "u3", kind: "u", k: 3, lines: ["Pay today's couriers", "in one batch"] },
    { id: "a3", kind: "a", k: 3, approval: true, lines: ["Batch ready: 5 payouts,", "740.00. Approve?"] },
    { id: "u4", kind: "u", k: 4, lines: ["Split sales: 10%", "to the partner"] },
    { id: "a4", kind: "a", k: 4, check: true, lines: ["Split active: 10% goes", "straight to the partner."] },
  ];
  let y = 0;
  MESSAGES.forEach((m) => {
    m.h = bubbleH(m.lines.length) + (m.approval ? ACTIONS_H : 0);
    m.y = y;
    y += m.h + BUBBLE.gap;
  });
  const REQUESTS = MESSAGES.filter((m) => m.kind === "u").map((m) => m.lines.join(" "));

  // ── Shared rects (handoffs) ────────────────────────────────────────────────────
  const headAvatar = { x: PANEL.x + AV.x, y: PANEL.y + AV.y, size: AV.size };
  const listOrigin = { x: PANEL.x, y: PANEL.y + VIEW.top + VIEW.pad };
  const MSG_X = { mini: 24, aBubble: 24 + MINI + 12, uRight: 24 }; // list-local
  const m0 = MESSAGES[0];
  const m0Rect = { x: PANEL.x + MSG_X.aBubble, y: listOrigin.y + m0.y, w: m0.w, h: m0.h };
  const TRACKER = { x: 792, y: 52, w: 1072, h: 56 }; // feature chips
  const STRIP = { x: 792, y: 144, w: 1072, h: 104 }; // the running counter
  const STAGE = { x: 792, y: 280, w: 1072, h: 752 }; // the surfaces
  const CARD = { x: 968, y: 300, w: 720, h: 712 }; // one surface card at a time
  const CHAR0 = { x: 600, y: 440, size: 320 }; // the character in the hook (its centre is where the iris opens)

  const api = {
    BEAT, T, AGENT, HOOK, FEATURES, COUNTER, FINALE, SURFACES,
    PANEL, AV, VIEW, LIST_H, BUBBLE, MINI, ACTIONS_H, bubbleH, MESSAGES, REQUESTS,
    headAvatar, listOrigin, MSG_X, m0Rect, TRACKER, STRIP, STAGE, CARD, CHAR0,
  };
  root.LAYOUT = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
