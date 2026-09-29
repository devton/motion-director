/* Hand-drawn helpers. hwOnUpdate / hwHash / hwBoil / hwWobbleEllipse / hwPenEase / hwDrawOn are
   copied from the HyperFrames registry component "hw-boil" (compositions/components/hw-boil.html),
   as its wiring notes ask. hwScribblePath / hwBoilPath are additions: the LINE itself re-poses on the
   quantized clock (true line boil), not just its element. hwOnUpdate is the one per-frame dispatcher every
   composition uses (it runs after the timeline's children, so values read in it are never stale).
   Everything is a pure function of timeline time + seeds: seek-safe, no Math.random. */
(function () {
  // One timeline has ONE onUpdate: every per-frame render registers through this dispatcher.
  // A timeline-level onUpdate runs after its children have rendered, so proxies are never stale.
  window.hwOnUpdate = function (tl, fn) {
    if (!tl.__hwRenders) {
      tl.__hwRenders = [];
      tl.eventCallback("onUpdate", function () {
        for (var i = 0; i < tl.__hwRenders.length; i++) tl.__hwRenders[i]();
      });
    }
    tl.__hwRenders.push(fn);
    fn();
  };

  // Seeded hash -> [-1, 1].
  window.hwHash = function (n, seed) {
    var x = Math.sin(n * 127.1 + (seed || 1) * 311.7) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  };

  // Element boil: owns x/y/rotation of its targets (entrance tweens go on a wrapper).
  window.hwBoil = function (tl, target, opts) {
    opts = opts || {};
    var amp = opts.amp !== undefined ? opts.amp : 1.6;
    var rot = opts.rot !== undefined ? opts.rot : 0.5;
    var fps = opts.fps || 30;
    var drop = opts.frameDrop || 3;
    var seed = opts.seed || 1;
    var els = gsap.utils.toArray(target);
    window.hwOnUpdate(tl, function () {
      var step = Math.floor((tl.time() * fps) / drop);
      for (var i = 0; i < els.length; i++) {
        gsap.set(els[i], {
          x: window.hwHash(step * 3 + i * 97, seed) * amp,
          y: window.hwHash(step * 3 + 1 + i * 97, seed) * amp,
          rotation: (opts.baseRot || 0) + window.hwHash(step * 3 + 2 + i * 97, seed) * rot,
        });
      }
    });
  };

  // Seeded hand-wobbled ellipse (smooth quadratic chain).
  window.hwWobbleEllipse = function (cx, cy, rx, ry, seed, wobblePct, rot) {
    wobblePct = wobblePct === undefined ? 3 : wobblePct;
    var N = 14,
      pts = [];
    var cr = Math.cos(rot || 0),
      sr = Math.sin(rot || 0);
    for (var i = 0; i < N; i++) {
      var a = (i / N) * Math.PI * 2;
      var wr = 1 + window.hwHash(i * 13 + 5, seed) * (wobblePct / 100);
      var ex = Math.cos(a) * rx * wr,
        ey = Math.sin(a) * ry * wr;
      pts.push([cx + ex * cr - ey * sr, cy + ex * sr + ey * cr]);
    }
    var mx = (pts[0][0] + pts[N - 1][0]) / 2,
      my = (pts[0][1] + pts[N - 1][1]) / 2;
    var d = "M" + mx.toFixed(1) + " " + my.toFixed(1);
    for (var j = 0; j < N; j++) {
      var p = pts[j],
        q = pts[(j + 1) % N];
      d += " Q" + p[0].toFixed(1) + " " + p[1].toFixed(1) + " " + ((p[0] + q[0]) / 2).toFixed(1) + " " + ((p[1] + q[1]) / 2).toFixed(1);
    }
    return d;
  };

  // Pen-velocity ease: a pen slows into curves (curvature-adaptive, floored at 0.22).
  window.hwPenEase = function (pathEl, opts) {
    opts = opts || {};
    var kCurve = opts.kCurve !== undefined ? opts.kCurve : 10;
    var L = pathEl.getTotalLength();
    if (L <= 0) return { ease: function (t) { return t; }, len: 0 };
    var PRE = 48;
    var pts = [];
    for (var i = 0; i <= PRE; i++) pts.push(pathEl.getPointAtLength((L * i) / PRE));
    var curv = [0];
    for (i = 1; i < PRE; i++) {
      var ax = pts[i].x - pts[i - 1].x,
        ay = pts[i].y - pts[i - 1].y;
      var bx = pts[i + 1].x - pts[i].x,
        by = pts[i + 1].y - pts[i].y;
      var la = Math.hypot(ax, ay) || 1e-6,
        lb = Math.hypot(bx, by) || 1e-6;
      var dot = Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)));
      curv.push(Math.acos(dot) / ((la + lb) / 2));
    }
    curv.push(0);
    var mass = 0;
    for (i = 0; i < curv.length; i++) mass += curv[i];
    var N = Math.max(25, Math.min(75, Math.round(25 + mass * 18)));
    var seg = L / N;
    var times = [0];
    var t = 0;
    for (i = 1; i <= N; i++) {
      var u = ((i - 0.5) / N) * PRE;
      var i0 = Math.floor(u),
        f = u - i0;
      var c = curv[Math.min(i0, PRE)] * (1 - f) + curv[Math.min(i0 + 1, PRE)] * f;
      var speed = Math.max(1 / (1 + kCurve * c * 14), 0.22);
      t += seg / speed;
      times.push(t);
    }
    var total = times[N];
    for (i = 0; i <= N; i++) times[i] /= total;
    return {
      ease: function (p) {
        if (p <= 0) return 0;
        if (p >= 1) return 1;
        var lo = 0,
          hi = N;
        while (hi - lo > 1) {
          var mid = (lo + hi) >> 1;
          if (times[mid] <= p) lo = mid;
          else hi = mid;
        }
        var span = times[hi] - times[lo] || 1e-9;
        return (lo + (p - times[lo]) / span) / N;
      },
      len: L,
    };
  };

  // Draw-on (plain stroke): dash-animate the path; opacity 0 until `at` kills the round-cap nub.
  window.hwDrawOn = function (tl, pathEl, at, dur, opts) {
    opts = opts || {};
    var len = pathEl.getTotalLength();
    pathEl.setAttribute("stroke-dasharray", len + " " + len);
    pathEl.setAttribute("stroke-dashoffset", len);
    gsap.set(pathEl, { opacity: 0 });
    var ease = opts.pen ? window.hwPenEase(pathEl, opts).ease : opts.ease || "power2.inOut";
    tl.set(pathEl, { opacity: 1 }, at);
    tl.to(pathEl, { strokeDashoffset: 0, duration: dur === undefined ? 0.7 : dur, ease: ease }, at);
  };

  /* ── Line boil (project addition) ─────────────────────────────────────────
     A scribble authored as control points; each re-pose jitters every point by a seeded amount,
     then a Catmull-Rom chain turns them into a smooth path. The dash draw-on keeps working because
     the path length changes by < 1% per pose (lengths are re-read each frame by hwBoilPath). */
  window.hwScribblePath = function (pts, step, seed, amp) {
    var P = pts.map(function (p, i) {
      return [p[0] + window.hwHash(step * 7 + i * 13, seed) * amp, p[1] + window.hwHash(step * 7 + i * 13 + 5, seed) * amp];
    });
    var d = "M" + P[0][0].toFixed(1) + " " + P[0][1].toFixed(1);
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[Math.max(0, i - 1)],
        p1 = P[i],
        p2 = P[i + 1],
        p3 = P[Math.min(P.length - 1, i + 2)];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6,
        c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6,
        c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += " C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  };

  /* Boil + draw a scribble in one per-frame render: progress(t) in [0,1] (pure), 12 fps poses. */
  window.hwBoilPath = function (tl, pathEl, pts, opts) {
    opts = opts || {};
    var seed = opts.seed || 1;
    var amp = opts.amp !== undefined ? opts.amp : 2.2;
    var drop = opts.frameDrop || 3;
    var progress = opts.progress || function () { return 1; };
    window.hwOnUpdate(tl, function () {
      var t = tl.time();
      var step = Math.floor((t * 30) / drop);
      pathEl.setAttribute("d", window.hwScribblePath(pts, step, seed, amp));
      var len = pathEl.getTotalLength();
      var p = Math.max(0, Math.min(1, progress(t)));
      pathEl.setAttribute("stroke-dasharray", len.toFixed(1) + " " + (len + 10).toFixed(1));
      pathEl.setAttribute("stroke-dashoffset", (len * (1 - p)).toFixed(1));
      pathEl.style.opacity = p > 0.001 ? "1" : "0";
    });
  };
})();
