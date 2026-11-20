/* $100 Through Time: blends web-design eras continuously */
(() => {
  const ERAS = ["80s", "90s", "00s", "10s", "20s", "ai"];

  // [from era, blend start, blend end, to era]
  const BLENDS = [
    ["80s", 1988.4, 1991.0, "90s"],
    ["90s", 1998.4, 2001.0, "00s"],
    ["00s", 2008.4, 2011.0, "10s"],
    ["10s", 2018.4, 2020.6, "20s"]
  ];

  const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  TT.weights = function (t) {
    const w = { "80s": 0, "90s": 0, "00s": 0, "10s": 0, "20s": 0, ai: 0 };
    let done = false;
    for (const [a, s, e, b] of BLENDS) {
      if (t < s) { w[a] = 1; done = true; break; }
      if (t <= e) { const k = smooth((t - s) / (e - s)); w[a] = 1 - k; w[b] = k; done = true; break; }
    }
    if (!done) w["20s"] = 1;
    const ai = smooth((t - TT.CHATGPT) / (TT.AI_FULL - TT.CHATGPT));
    if (ai > 0) { for (const k in w) w[k] *= 1 - ai; w.ai = ai; }
    return w;
  };
  TT.aiAmount = (t) => smooth((t - TT.CHATGPT) / (TT.AI_FULL - TT.CHATGPT));

  // colors are [r, g, b, a]
  const THEMES = {
    "80s": { bg: [3, 8, 3, 1], fg: [57, 255, 106, 1], muted: [31, 168, 70, 1], panel: [4, 16, 7, .92], pfg: [57, 255, 106, 1], pmuted: [31, 168, 70, 1],
             bar: [6, 34, 12, 1], barfg: [57, 255, 106, 1], border: [57, 255, 106, .7], accent: [57, 255, 106, 1], afg: [3, 8, 3, 1], radius: 0, glow: .55 },
    "90s": { bg: [0, 128, 128, 1], fg: [255, 255, 255, 1], muted: [215, 255, 255, 1], panel: [192, 192, 192, 1], pfg: [0, 0, 0, 1], pmuted: [64, 64, 64, 1],
             bar: [0, 0, 128, 1], barfg: [255, 255, 255, 1], border: [128, 128, 128, 1], accent: [0, 0, 128, 1], afg: [255, 255, 255, 1], radius: 0, glow: 0 },
    "00s": { bg: [200, 233, 255, 1], fg: [29, 53, 87, 1], muted: [90, 115, 144, 1], panel: [255, 255, 255, .96], pfg: [29, 53, 87, 1], pmuted: [90, 115, 144, 1],
             bar: [0, 84, 227, 1], barfg: [255, 255, 255, 1], border: [140, 200, 236, 1], accent: [0, 150, 255, 1], afg: [255, 255, 255, 1], radius: 14, glow: 0 },
    "10s": { bg: [236, 240, 241, 1], fg: [44, 62, 80, 1], muted: [127, 140, 141, 1], panel: [255, 255, 255, 1], pfg: [44, 62, 80, 1], pmuted: [127, 140, 141, 1],
             bar: [26, 188, 156, 1], barfg: [255, 255, 255, 1], border: [213, 219, 219, 1], accent: [26, 188, 156, 1], afg: [255, 255, 255, 1], radius: 4, glow: 0 },
    "20s": { bg: [7, 7, 13, 1], fg: [243, 243, 248, 1], muted: [154, 154, 178, 1], panel: [255, 255, 255, .055], pfg: [243, 243, 248, 1], pmuted: [154, 154, 178, 1],
             bar: [255, 255, 255, .04], barfg: [207, 207, 224, 1], border: [255, 255, 255, .13], accent: [243, 243, 248, 1], afg: [7, 7, 13, 1], radius: 20, glow: 0 },
    ai:    { bg: [5, 4, 11, 1], fg: [238, 234, 255, 1], muted: [154, 147, 194, 1], panel: [14, 11, 29, .82], pfg: [238, 234, 255, 1], pmuted: [154, 147, 194, 1],
             bar: [24, 18, 48, .9], barfg: [201, 184, 255, 1], border: [185, 166, 255, .3], accent: [185, 166, 255, 1], afg: [5, 4, 11, 1], radius: 18, glow: 0 }
  };
  const COLOR_KEYS = ["bg", "fg", "muted", "panel", "pfg", "pmuted", "bar", "barfg", "border", "accent", "afg"];
  // text colors switch faster than backgrounds so text stays readable mid-blend
  const TEXT_KEYS = new Set(["fg", "muted", "pfg", "pmuted", "barfg", "afg"]);

  TT.LABELS = {
    "80s": "The CRT era", "90s": "The Windows & dial-up era", "00s": "The Web 2.0 era",
    "10s": "The flat-design, smartphone era", "20s": "The dark-mode era", ai: "The AI era"
  };
  TT.CART_TITLES = {
    "80s": "C:\\> CART.EXE", "90s": "Cart.exe", "00s": "My Cart ✦ beta", "10s": "CART", "20s": "Cart", ai: "✦ Penny's cart"
  };

  const rootEl = document.documentElement;
  const cache = {};
  const root = { setProperty(k, v) { if (cache[k] !== v) { cache[k] = v; rootEl.style.setProperty(k, v); } } };

  // WCAG contrast helpers
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  /** nudge text color `c` (in place) toward black or white until it reaches `min` contrast on `base` */
  function ensure(c, base, min) {
    c[3] = 1;
    if (contrast(c, base) >= min) return;
    const target = lum(base) > 0.2 ? [0, 0, 0] : [255, 255, 255];
    const start = c.slice(0, 3);
    for (let k = 0.1; k <= 1.0001; k += 0.1) {
      for (let i = 0; i < 3; i++) c[i] = start[i] + (target[i] - start[i]) * k;
      if (contrast(c, base) >= min) return;
    }
  }
  const rgba = (c) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(3)})`;

  TT.applyTheme = function (w) {
    const mix = {};
    for (const k of COLOR_KEYS) mix[k] = [0, 0, 0, 0];
    let radius = 0, glow = 0;
    // sharpened weights for text and the year
    const sw = {};
    let ssum = 0;
    for (const era of ERAS) { sw[era] = Math.pow(w[era] || 0, 4); ssum += sw[era]; }
    for (const era of ERAS) sw[era] /= ssum || 1;
    for (const era of ERAS) {
      const k = w[era];
      if (!k && !sw[era]) continue;
      const th = THEMES[era];
      for (const key of COLOR_KEYS) {
        const kk = TEXT_KEYS.has(key) ? sw[era] : k;
        for (let i = 0; i < 4; i++) mix[key][i] += th[key][i] * kk;
      }
      radius += th.radius * k;
      glow += th.glow * k;
    }
    // keep text readable in the middle of a blend
    const over = (c, base) => [0, 1, 2].map((i) => c[i] * c[3] + base[i] * (1 - c[3])).concat(1);
    const bg = mix.bg;
    const panelSolid = over(mix.panel, bg);
    const barSolid = over(mix.bar, panelSolid);
    ensure(mix.fg, bg, 4.5);
    ensure(mix.muted, bg, 3.2);
    ensure(mix.pfg, panelSolid, 4.5);
    ensure(mix.pmuted, panelSolid, 3.2);
    ensure(mix.barfg, barSolid, 4.5);
    ensure(mix.afg, over(mix.accent, bg), 4.5);
    for (const key of COLOR_KEYS) root.setProperty("--" + key, rgba(mix[key]));
    root.setProperty("--radius", radius.toFixed(1) + "px");
    root.setProperty("--glow", glow.toFixed(3));
    for (const era of ERAS) {
      root.setProperty("--w" + era, (w[era] || 0).toFixed(3));
      root.setProperty("--y" + era, Math.pow(sw[era], 0.7).toFixed(3));
    }
    let dom = "80s";
    for (const era of ERAS) if (w[era] > w[dom]) dom = era;
    return { dominant: dom, accent: rgba(mix.accent) };
  };
})();
