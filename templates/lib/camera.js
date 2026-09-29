/* Head-on 3D camera for a CSS-3D stage: pan and dolly only, so cards always face the viewer.

   const cam = createCamera({
     perspective: 1100,
     focus: [960, 560],                        // or keys [[t, x, y, ease], ...] to move the screen focus
     keys: [                                   // [t, fx, fy, scale, ease, lift]
       [0.0, 1000, 100, 0.45],
       [2.0, 200, 40, 1.0, "power3.inOut", 0.1], // a flight: lift pulls the scale down mid-leg
       [2.5, 700, 40, 1.0, "spline"],            // consecutive "spline" keys = one smooth tracking ride,
       [3.0, 1200, 40, 1.0, "spline"],           // at rest only at the run's ends (no stop-and-go blur)
       [3.8, 1000, 100, 0.5, "power3.inOut"],
     ],
   });
   // per frame: const c = cam.apply(t, { stage, world, blurNode }); -> { fx, fy, s, px, py, cz, dof }

   The world point (fx, fy) sits at the screen focus (px, py) at scale s: world translate3d(px - fx, py - fy, cz)
   with cz = P * (1 - 1 / s), stage perspective-origin = px py. Scale interpolates in log space. The travel blur
   (an SVG feGaussianBlur on the stage) only engages above a dead band of screen speed. Pure functions of t. */
(function (root) {
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const put = (el, key, val) => {
    const c = el.__cam || (el.__cam = {});
    if (c[key] === val) return;
    c[key] = val;
    el.style[key] = val;
  };

  function createCamera({ keys, perspective = 1100, focus = [960, 540] }) {
    const P = perspective;
    const CAM = keys.map(([t, fx, fy, s, ease, lift]) => ({
      t,
      fx,
      fy,
      ls: Math.log(s),
      spline: ease === "spline",
      ease: gsap.parseEase(ease && ease !== "spline" ? ease : "none"),
      lift: lift || 0,
    }));
    // a key inside a spline run gets the Catmull-Rom slope; the run's first and last keys are at rest
    const slope = (i, k) =>
      CAM[i].spline && CAM[i + 1] && CAM[i + 1].spline ? (CAM[i + 1][k] - CAM[i - 1][k]) / (CAM[i + 1].t - CAM[i - 1].t) : 0;

    function camAt(t) {
      if (t <= CAM[0].t) return { fx: CAM[0].fx, fy: CAM[0].fy, s: Math.exp(CAM[0].ls) };
      let i = 0;
      while (i < CAM.length - 2 && t > CAM[i + 1].t) i++;
      const a = CAM[i];
      const b = CAM[i + 1];
      const u = seg(t, a.t, b.t);
      if (b.spline) {
        const dt = b.t - a.t;
        const u2 = u * u;
        const u3 = u2 * u;
        const h = (k) => (2 * u3 - 3 * u2 + 1) * a[k] + (u3 - 2 * u2 + u) * dt * slope(i, k) + (-2 * u3 + 3 * u2) * b[k] + (u3 - u2) * dt * slope(i + 1, k);
        return { fx: h("fx"), fy: h("fy"), s: Math.exp(h("ls")) };
      }
      const e = b.ease(u);
      let s = Math.exp(lerp(a.ls, b.ls, e));
      if (b.lift) s *= 1 - b.lift * Math.sin(Math.PI * u);
      return { fx: lerp(a.fx, b.fx, e), fy: lerp(a.fy, b.fy, e), s };
    }

    const FK = Array.isArray(focus[0]) ? focus.map(([t, x, y, ease]) => ({ t, x, y, ease: gsap.parseEase(ease || "power2.inOut") })) : null;
    function focusAt(t) {
      if (!FK) return focus;
      if (t <= FK[0].t) return [FK[0].x, FK[0].y];
      let i = 0;
      while (i < FK.length - 2 && t > FK[i + 1].t) i++;
      const a = FK[i];
      const b = FK[i + 1];
      const e = b.ease(seg(t, a.t, b.t));
      return [lerp(a.x, b.x, e), lerp(a.y, b.y, e)];
    }

    /** Screen position and projected scale of a world point (x, y, z) at time t. */
    function project(x, y, z, t) {
      const c = camAt(t);
      const [px, py] = focusAt(t);
      const cz = P * (1 - 1 / c.s);
      const k = P / (P - (cz + (z || 0)));
      return { x: px + (x - c.fx) * k, y: py + (y - c.fy) * k, k };
    }

    /** Pose the stage for time t; returns the camera state plus the depth-of-field factor. */
    function apply(t, { stage, world, blurNode, deadBand = 36, gain = 0.3, cap = 16 }) {
      const c = camAt(t);
      const [px, py] = focusAt(t);
      const cz = P * (1 - 1 / c.s);
      put(stage, "perspective", `${P}px`);
      put(stage, "perspectiveOrigin", `${px.toFixed(1)}px ${py.toFixed(1)}px`);
      put(world, "transform", `translate3d(${(px - c.fx).toFixed(2)}px, ${(py - c.fy).toFixed(2)}px, ${cz.toFixed(2)}px)`);
      if (blurNode) {
        const a = camAt(t - 1 / 60);
        const b = camAt(t + 1 / 60);
        const fast = (v) => Math.max(0, v - deadBand) * gain;
        const dz = fast(Math.abs(Math.log(b.s) - Math.log(a.s)) * 960);
        const bx = Math.min(cap, fast(Math.abs((b.fx - a.fx) * c.s)) + dz);
        const by = Math.min(cap, fast(Math.abs((b.fy - a.fy) * c.s)) + dz);
        if (bx + by > 0.35) {
          put(stage, "filter", `url(#${blurNode.parentNode.id})`);
          const v = `${bx.toFixed(2)} ${by.toFixed(2)}`;
          if (blurNode.__sd !== v) {
            blurNode.setAttribute("stdDeviation", v);
            blurNode.__sd = v;
          }
        } else put(stage, "filter", "none");
      }
      return { ...c, px, py, cz, dof: clamp01((c.s - 0.45) / 0.4) };
    }

    return { camAt, focusAt, project, apply, perspective: P };
  }

  root.createCamera = createCamera;
})(typeof window !== "undefined" ? window : globalThis);
