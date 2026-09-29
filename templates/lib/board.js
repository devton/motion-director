/* Board geometry for the 3D stage: connector wires between card ports, sampled analytically (no DOM geometry
   at build or render time, so every frame is a pure function of time).

   const g = Board.wire(x1, y1, x2, y2);   // { d, pts, len }: the SVG path, 101 equal-arc-length points, length
   const [x, y] = Board.along(g, u);       // the point at arc fraction u (0..1), for a signal riding the wire

   A wire between ports on different rows gets a smoothstep elbow at its midpoint (radius <= 16 px), like an
   editor's connector; ports on the same row get a straight line. */
(function (root) {
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  function wire(x1, y1, x2, y2, samples = 100) {
    const P = [];
    const line = (a, b) => {
      for (let i = 0; i < 24; i++) P.push([lerp(a[0], b[0], i / 24), lerp(a[1], b[1], i / 24)]);
    };
    const quad = (a, c, b) => {
      for (let i = 0; i < 24; i++) {
        const u = i / 24;
        P.push([(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]);
      }
    };
    let d;
    if (Math.abs(y2 - y1) < 0.5) {
      d = `M${x1} ${y1} H${x2}`;
      line([x1, y1], [x2, y2]);
    } else {
      const m = (x1 + x2) / 2;
      const dir = y2 > y1 ? 1 : -1;
      const r = Math.min(16, Math.abs(y2 - y1) / 2, (x2 - x1) / 2);
      d = `M${x1} ${y1} H${m - r} Q${m} ${y1} ${m} ${y1 + dir * r} V${y2 - dir * r} Q${m} ${y2} ${m + r} ${y2} H${x2}`;
      line([x1, y1], [m - r, y1]);
      quad([m - r, y1], [m, y1], [m, y1 + dir * r]);
      line([m, y1 + dir * r], [m, y2 - dir * r]);
      quad([m, y2 - dir * r], [m, y2], [m + r, y2]);
      line([m + r, y2], [x2, y2]);
    }
    P.push([x2, y2]);
    // re-sample at equal arc length, so a signal at constant u speed moves at constant screen speed
    const cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const len = cum[cum.length - 1];
    const pts = [];
    let j = 1;
    for (let i = 0; i <= samples; i++) {
      const target = (len * i) / samples;
      while (j < cum.length - 1 && cum[j] < target) j++;
      const k = (target - cum[j - 1]) / Math.max(1e-6, cum[j] - cum[j - 1]);
      pts.push([lerp(P[j - 1][0], P[j][0], k), lerp(P[j - 1][1], P[j][1], k)]);
    }
    return { d, pts, len };
  }

  function along(g, u) {
    const n = g.pts.length - 1;
    const f = clamp01(u) * n;
    const i = Math.min(n - 1, Math.floor(f));
    return [lerp(g.pts[i][0], g.pts[i + 1][0], f - i), lerp(g.pts[i][1], g.pts[i + 1][1], f - i)];
  }

  root.Board = { wire, along };
})(typeof window !== "undefined" ? window : globalThis);
