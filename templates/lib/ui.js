/* Shared UI kit for compositions: line icons (inline SVG, no glyph fonts), a deterministic money formatter,
   cached style writers, the audit-layering helper and small math. Load after GSAP and before compositions. */
(function () {
  const I = (d) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    check: I('<path d="M5 12.5 L10 17 L19 7"/>'),
    arrow: I('<path d="M5 12 H19 M13 6 L19 12 L13 18"/>'),
    bolt: I('<path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z"/>'),
    qr: I('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14 H17 V17 M21 14 V21 H17 M14 21 V19"/>'),
    link: I('<path d="M10 14 A4 4 0 0 0 15.66 14 L18.5 11.17 A4 4 0 0 0 12.83 5.5 L11.5 6.83"/><path d="M14 10 A4 4 0 0 0 8.34 10 L5.5 12.83 A4 4 0 0 0 11.17 18.5 L12.5 17.17"/>'),
    copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8 V6 A2 2 0 0 0 14 4 H6 A2 2 0 0 0 4 6 V14 A2 2 0 0 0 6 16 H8"/>'),
    share: I('<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8 L15.8 6.7 M8.2 13.2 L15.8 17.3"/>'),
    repeat: I('<path d="M17 2 L21 6 L17 10"/><path d="M3 11 V9 A3 3 0 0 1 6 6 H21"/><path d="M7 22 L3 18 L7 14"/><path d="M21 13 V15 A3 3 0 0 1 18 18 H3"/>'),
    calendar: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10 H21 M8 3 V7 M16 3 V7"/>'),
    users: I('<circle cx="9" cy="8" r="3.2"/><path d="M3 20 C3 16 5.7 14 9 14 C12.3 14 15 16 15 20"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2 C18.9 14.3 21 16.3 21 20"/>'),
    split: I('<path d="M4 12 H10 M10 12 L16 6 H20 M10 12 L16 18 H20"/><path d="M17 3 L20 6 L17 9 M17 15 L20 18 L17 21"/>'),
    wallet: I('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10 H21"/><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor"/>'),
    coin: I('<circle cx="12" cy="12" r="9"/><path d="M15 9.2 C14 8 9.5 7.8 9.5 10.3 C9.5 13 14.8 11.4 14.8 14.2 C14.8 16.6 10.2 16.4 9 15 M12 6 V18"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15 14"/>'),
    open: I('<path d="M14 4 H20 V10 M20 4 L11 13"/><path d="M18 14 V19 A1 1 0 0 1 17 20 H5 A1 1 0 0 1 4 19 V7 A1 1 0 0 1 5 6 H10"/>'),
    spark: I('<path d="M12 3 V7 M12 17 V21 M3 12 H7 M17 12 H21 M5.6 5.6 L8.4 8.4 M15.6 15.6 L18.4 18.4 M5.6 18.4 L8.4 15.6 M15.6 8.4 L18.4 5.6"/>'),
  };

  /**
   * Deterministic money formatter (no Intl/locale dependency, identical in every render worker).
   * money(1234.5) -> "$ 1,234.50"; money(-740, { currency: "€", thousands: ".", decimal: "," }) -> "- € 740,00".
   * Set UI.MONEY once per project to the subject's locale; opts.plus prints "+ " for positive deltas.
   */
  const MONEY = { currency: "$", thousands: ",", decimal: ".", digits: 2 };
  function money(v, opts = {}) {
    const o = Object.assign({}, UI.MONEY, opts);
    const neg = v < 0;
    const scale = Math.pow(10, o.digits);
    const cents = Math.round(Math.abs(v) * scale);
    const int = Math.floor(cents / scale);
    const dec = o.digits ? o.decimal + String(cents % scale).padStart(o.digits, "0") : "";
    const s = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, o.thousands);
    return `${neg ? "- " : o.plus ? "+ " : ""}${o.currency} ${s}${dec}`;
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const EASES = {};
  const ez = (n) => EASES[n] || (EASES[n] = gsap.parseEase(n));
  const bump = (t, at, d) => (t < at ? 0 : Math.sin(Math.PI * seg(t, at, at + d)));

  /** Cached style writer: static elements cost nothing per frame. */
  const put = (el, key, val) => {
    const c = el.__v || (el.__v = {});
    if (c[key] === val) return;
    c[key] = val;
    el.style[key] = val;
  };
  const setA = (el, key, val) => {
    const c = el.__a || (el.__a = {});
    if (c[key] === val) return;
    c[key] = val;
    el.setAttribute(key, val);
  };
  /** Write text only when it changes (per-frame counters, typed text). */
  const text = (el, val) => {
    if (el.__t === val) return;
    el.__t = val;
    el.textContent = val;
  };
  /** Mark every element with direct text under root as an intentional layering participant
      (`data-layout-allow-overlap` is not inherited). Call after the DOM is built. */
  const layered = (root) =>
    root.querySelectorAll("*").forEach((el) => {
      for (const n of el.childNodes)
        if (n.nodeType === 3 && n.textContent.trim()) {
          el.setAttribute("data-layout-allow-overlap", "");
          break;
        }
    });
  /** A per-frame count: from -> to over [t0, t0 + d] with an ease, written through `text`. */
  const counter = (tl, el, { from, to, t0, d = 0.6, ease = "power2.out", fmt = (v) => String(Math.round(v)), offset = 0 }) => {
    const e = ez(ease);
    hwOnUpdate(tl, () => text(el, fmt(from + (to - from) * e(seg(tl.time() + offset, t0, t0 + d)))));
  };

  /** The agent's face: the project's rigged character module (window.Character, see character-rig.md) or,
      without one, an initials disc in --char-bg. Every instance needs a unique id. */
  const avatar = (id) =>
    window.Character
      ? window.Character.markup({ id, shape: "circle" })
      : `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" style="fill: var(--char-bg)"/>` +
        `<text x="50" y="52" text-anchor="middle" dominant-baseline="middle" font-size="44" font-weight="700" style="fill: #fff; font-family: var(--font-ui)" data-layout-allow-overlap="">` +
        `${(window.LAYOUT && LAYOUT.AGENT && LAYOUT.AGENT.initials) || "A"}</text></svg>`;
  /** Drive the character's animated part (when its module exposes partD) from an amplitude function of time. */
  const rig = (tl, el, ampAt, offset = 0) => {
    if (!window.Character || !window.Character.partD) return;
    const part = el.querySelector(window.Character.partSelector || ".char-part");
    if (!part) return;
    let last = "";
    hwOnUpdate(tl, () => {
      const t = tl.time() + offset;
      const d = window.Character.partD(t, ampAt(t));
      if (d !== last) {
        part.setAttribute("d", d);
        last = d;
      }
    });
  };

  window.UI = { ICON, MONEY, money, clamp01, lerp, seg, ez, bump, put, setA, text, layered, counter, avatar, rig };
})();
