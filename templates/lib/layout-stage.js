/* The spine for a flow showcase (story shape B): a kinetic title in the hero world, the head-on 3D stage
   (plan -> build -> run -> scale) in the workspace, the finale back in the hero world.
   Same contract as layout.js: every time, rect and shared string lives here, derived values included; the
   compositions (title, stage-3d, bg, finale) and the score only read it. setup.sh installs it as
   assets/lib/layout.js for the "stage" shape. Root seconds on a 120 BPM grid (beat 0.5 s, 16th 0.125 s). */
(function (root) {
  const BEAT = 0.5;
  const r3 = (v) => Math.round(v * 1000) / 1000;

  // ── The board, in world px. Cards are top-aligned in lanes; each wire port sits on the header line. ──
  const CARD = { w: 360, h: 124, port: 46 };
  const COL = 500; // column pitch: a card plus 140 px of wire
  const LANE = 300; // lane pitch
  const X0 = 600;
  const Y0 = 700;
  const WORLD = { w: 3600, h: 2200 };

  // ── The flows. Nodes: [id, column, row offset inside the lane, icon (UI.ICON), title, sub].
  //    Edges: [from, to, tag?]; a number tag is money (UI.money), a string tag is shown as is. ──
  const FLOWS = [
    {
      id: "A",
      name: "Split every sale",
      lane: 0,
      nodes: [
        ["a0", 0, 0, "bolt", "Payment received", "Any amount, any channel"],
        ["a1", 1, 0, "coin", "Issue the receipt", "Sent to the payer"],
        ["a2", 2, 0, "split", "Split 90 / 10", "On every sale"],
        ["a3", 3, -0.5, "wallet", "Keep 10% aside", "Savings account"],
        ["a4", 3, 0.5, "users", "Pay the partner", "90% right away"],
      ],
      edges: [
        ["a0", "a1", 1250],
        ["a1", "a2", 1250],
        ["a2", "a3", 125],
        ["a2", "a4", 1125],
      ],
    },
    {
      id: "B",
      name: "Monday payouts",
      lane: 1.6,
      nodes: [
        ["b0", 0, 0, "calendar", "Every Monday", "At 09:00"],
        ["b1", 1, 0, "wallet", "Check the balance", "Main account"],
        ["b2", 2, 0, "users", "Pay suppliers", "12 invoices due"],
        ["b3", 3, 0, "share", "Send the report", "To the team"],
      ],
      edges: [
        ["b0", "b1"],
        ["b1", "b2", 8420],
        ["b2", "b3", "12 paid"],
      ],
    },
    {
      id: "C",
      name: "Welcome new members",
      lane: 2.6,
      nodes: [
        ["c0", 0, 0, "spark", "New subscriber", "From the checkout"],
        ["c1", 1, 0, "link", "Send the welcome", "With the member link"],
        ["c2", 2, 0, "repeat", "Charge monthly", "Every 30 days"],
        ["c3", 3, 0, "check", "Tag as active", "In the member list"],
      ],
      edges: [
        ["c0", "c1"],
        ["c1", "c2"],
        ["c2", "c3", 49.9],
      ],
    },
  ];

  // ── The schedule ──
  const T = { BEAT };
  // title (hero world): three slam lines on beats, then they dive and the workspace opens behind them
  T.lines = [0.25, 1.0, 1.75];
  T.dive = 2.5;
  T.wipe = 2.5; // the iris opens while the lines rush past, so its first pixels hide behind them
  // the stage
  T.bar = 3.0; // the flow bar slides in
  T.activate = 6.5; // Draft -> Active
  T.press1 = 6.875; // the Run button, then run 1 (flow A, one beat per step: easy to read)
  T.scale = 12.5; // chapter 4: the other lanes plan and build at speed
  T.press2 = 14.625; // the Run button again, then run 2 (every flow at once, compressed)
  T.outro = 18.5; // the workspace closes back into the hero world
  // finale (hero world): same keys as the agent spine, so finale.html works unchanged
  T.tagline = 19.0;
  T.mark = 20.0;
  T.charEnd = 21.0; // the character's pop (only when AGENT exists)
  T.charLine = 21.25;
  T.cta = 21.75;
  T.recap = 22.25;
  T.end = 25.5;
  // plan + build: ghosts appear on 16ths, each ghost becomes its card on a beat (flow A) or on 8ths (the rest)
  const GHOSTS = { A: 3.0, B: 12.875, C: 12.875 };
  const SWAPS = {
    a0: 4.0, a1: 4.5, a2: 5.0, a3: 5.5, a4: 5.625,
    b0: 13.5, c0: 13.625, b1: 13.75, c1: 13.875, b2: 14.0, c2: 14.125, b3: 14.25, c3: 14.375,
  };
  // runs: a node at depth d starts at t0 + d * step and is done half a step later; the signal travels the rest.
  // At a run's t0 its flows reset to idle (the previous run's green clears), then the wave crosses them again.
  const RUNS = [
    { id: 1, flows: ["A"], t0: 7.0, step: 1.0 },
    { id: 2, flows: ["A", "B", "C"], t0: 15.0, step: 0.5 },
  ];
  T.CHAPTERS = [
    [3.0, "01", "Plan it"],
    [4.0, "02", "Build it"],
    [T.press1, "03", "Run it"],
    [T.scale, "04", "Scale it"],
  ];
  T.win = {
    bg: [0, T.end],
    title: [0, 3.4],
    stage: [2.4, 19.2],
    finale: [18.2, T.end],
  };

  // ── Derived: absolute rects, depth, swap and run times, wire endpoints (compositions and score read these) ──
  const NODES = [];
  const EDGES = [];
  const byId = {};
  FLOWS.forEach((f) => {
    f.nodes.forEach(([id, col, row, icon, title, sub], i) => {
      const n = { id, flow: f.id, col, x: X0 + col * COL, y: Y0 + (f.lane + row) * LANE, icon, title, sub, depth: 0 };
      n.ghost = r3(GHOSTS[f.id] + i * 0.125);
      n.swap = SWAPS[id];
      n.land = r3(n.swap + 0.3);
      n.runs = [];
      NODES.push(n);
      byId[id] = n;
    });
    // depth by relaxation over the edges (flows are small DAGs)
    for (let pass = 0; pass < f.nodes.length; pass++)
      f.edges.forEach(([a, b]) => (byId[b].depth = Math.max(byId[b].depth, byId[a].depth + 1)));
  });
  RUNS.forEach((run) =>
    NODES.forEach((n) => {
      if (!run.flows.includes(n.flow)) return;
      const start = r3(run.t0 + n.depth * run.step);
      n.runs.push({ run: run.id, at: run.t0, start, done: r3(start + run.step / 2) });
    }),
  );
  FLOWS.forEach((f) =>
    f.edges.forEach(([from, to, tag]) => {
      const a = byId[from];
      const b = byId[to];
      const e = { from, to, flow: f.id, tag: tag === undefined ? null : tag };
      e.x1 = a.x + CARD.w;
      e.y1 = a.y + CARD.port;
      e.x2 = b.x;
      e.y2 = b.y + CARD.port;
      e.draw = r3(b.swap + 0.1); // the wire draws while its child drops (0.2 s)
      e.runs = a.runs.map((ra) => {
        const rb = b.runs.find((r) => r.run === ra.run);
        return { run: ra.run, at: ra.at, t0: ra.done, t1: rb.start };
      });
      EDGES.push(e);
    }),
  );
  // rings on the board at each output port as its node finishes (bigger on the last step of a run)
  const RINGS = [];
  NODES.forEach((n) =>
    n.runs.forEach((r) => {
      const leaf = !EDGES.some((e) => e.from === n.id);
      RINGS.push({ x: n.x + CARD.w, y: n.y + CARD.port, t: r.done, r1: leaf ? 110 : 70 });
    }),
  );

  // ── Camera: [t, fx, fy, scale, ease, lift]; "spline" keys form one tracking ride (camera.js) ──
  const CAM = [
    [2.5, 1530, 800, 0.56], // the iris opens on the empty board
    [3.9, 1530, 780, 0.66, "sine.inOut"], // ghosts appear: a slow push
    [5.9, 1500, 770, 0.74, "sine.inOut"], // the build, one card per beat
    [6.95, 820, 770, 1.1, "power3.inOut", 0.1], // a flight to the trigger (lifts off the board mid-leg)
    [8.0, 1230, 770, 1.1, "spline"], // the ride follows the money, card by card, at rest only at its ends
    [9.0, 1730, 770, 1.1, "spline"],
    [10.0, 2150, 770, 1.02, "spline"],
    [10.7, 2230, 770, 0.98, "spline"],
    [11.7, 1530, 780, 0.72, "power2.inOut"], // flow A done, whole
    [12.4, 1500, 790, 0.74, "sine.inOut"], // a drift so the hold never dies
    [13.3, 1530, 1080, 0.6, "power3.inOut", 0.06], // pull back: the other lanes
    [14.9, 1530, 1080, 0.64, "sine.inOut"],
    [17.0, 1530, 1075, 0.68, "sine.inOut"],
    [18.5, 1530, 1075, 0.71, "sine.inOut"], // a slow push into the outro
  ];
  // the screen focus moves left while the executions panel covers the right side
  const FOCUS = [
    [0, 960, 560],
    [10.4, 960, 560],
    [11.2, 780, 560, "power2.inOut"],
  ];

  // ── Screen overlays (outside the world). Props fade before they cross any of these. ──
  const BAR = { x: 610, y: 40, w: 700, h: 72, name: FLOWS[0].name, nameAll: "All flows", draft: "Draft", active: "Active", run: "Test run" };
  const HUD = { x: 64, y: 962, w: 380, h: 64 };
  const LOG = {
    x: 1500,
    y: 150,
    w: 360,
    open: 10.6,
    title: "Executions",
    rows: [
      [10.6, "Split every sale", "5 steps", "1.2 s"],
      [16.8, "Monday payouts", "4 steps", "0.9 s"],
      [16.925, "Welcome new members", "4 steps", "0.8 s"],
      [17.05, "Split every sale", "5 steps", "1.1 s"],
    ],
  };
  const KEEP_OUT = [
    { x: BAR.x, y: BAR.y, w: BAR.w, h: BAR.h, from: T.bar, to: T.outro },
    { x: LOG.x, y: LOG.y, w: LOG.w, h: 400, from: LOG.open, to: T.outro },
    { x: HUD.x, y: HUD.y, w: HUD.w, h: HUD.h, from: T.bar, to: T.outro },
  ];
  // props: the subject's own illustrations floating in front of the board, beside their step, medium shots only
  const PROPS = [
    { icon: "coin", x: 1330, y: 520, z: 130, t: SWAPS.a1 },
    { icon: "split", x: 1830, y: 500, z: 110, t: SWAPS.a2 },
    { icon: "wallet", x: 2530, y: 760, z: 140, t: SWAPS.a3 },
  ];

  const api = {
    T,
    BEAT,
    CARD,
    WORLD,
    FLOWS,
    NODES,
    EDGES,
    RINGS,
    RUNS,
    CAM,
    FOCUS,
    BAR,
    HUD,
    LOG,
    KEEP_OUT,
    PROPS,
    // the iris opens and closes here (bg.html + stage-3d.html)
    IRIS: { x: 960, y: 560 },
    TITLE: { lines: ["Build the flow once.", "Let it run.", "Every single day."] },
    // no AGENT: finale.html then closes on the line alone (add one to bring a character in)
    FEATURES: ["Triggers", "Splits", "Payouts", "Schedules", "Execution log"],
    FINALE: {
      tagline: ["Your money,", "on autopilot."],
      line: "Build it once.",
      sub: "It runs every day.",
      cta: "Start building",
      url: "example.com",
      wordmark: "brand",
    },
  };
  root.LAYOUT = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
