/* Your $100: the mouse pointer travels through time too (1980 block cursor → AI orb) */
(() => {
  if (!window.matchMedia("(pointer: fine)").matches) { TT.cursor = { set() {} }; return; }
  const svg = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  const ARROW = "M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L13 12 Z";
  const ART = {
    "90s": svg(`<svg xmlns='http://www.w3.org/2000/svg' width='18' height='27' viewBox='0 0 14 21' shape-rendering='crispEdges'><path d='${ARROW}' fill='#fff' stroke='#000' stroke-width='1'/></svg>`),
    "00s": svg(`<svg xmlns='http://www.w3.org/2000/svg' width='20' height='30' viewBox='0 0 14 21'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a4a4a'/><stop offset='1' stop-color='#000'/></linearGradient></defs><path d='${ARROW}' fill='url(#g)' stroke='#fff' stroke-width='1.2' stroke-linejoin='round'/></svg>`),
    "10s": svg(`<svg xmlns='http://www.w3.org/2000/svg' width='17' height='25' viewBox='0 0 14 21'><path d='M1.5 1.5 L1.5 16 L5.3 12.4 L8 18.6 L10.3 17.6 L7.7 11.6 L12.6 11.6 Z' fill='#222' stroke='#fff' stroke-width='1.4' stroke-linejoin='round'/></svg>`)
  };
  const root = document.createElement("div");
  root.className = "era-cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `<i class="c80"></i><i class="c90"></i><i class="c00"></i><i class="c10"></i><i class="c20"></i><i class="cai"></i>` +
    Array.from({ length: 6 }, () => `<b class="trail"></b>`).join("");
  document.body.appendChild(root);
  document.documentElement.classList.add("has-era-cursor");
  const el = {}; for (const k of ["80", "90", "00", "10", "20", "ai"]) el[k === "ai" ? "ai" : k + "s"] = root.querySelector(".c" + k);
  for (const k in ART) el[k].style.backgroundImage = ART[k];
  const trail = [...root.querySelectorAll(".trail")].map((n) => ({ n, x: -99, y: -99 }));

  let x = -99, y = -99, shown = false, ai = 0, dirty = true;
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY; dirty = true;
    if (!shown) { shown = true; root.classList.add("on"); }
    const hot = e.target.closest && e.target.closest("button, a, input, .card, .cart, .pm, label");
    root.classList.toggle("hot", !!hot);
  }, { passive: true });
  addEventListener("pointerdown", () => root.classList.add("down"));
  addEventListener("pointerup", () => root.classList.remove("down"));
  document.addEventListener("mouseleave", () => { shown = false; root.classList.remove("on"); });

  function loop() {
    if (dirty) { root.style.transform = `translate(${x}px, ${y}px)`; dirty = false; }
    if (ai > 0.02) {
      let px = x, py = y;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        t.x += (px - t.x) * 0.45; t.y += (py - t.y) * 0.45;
        t.n.style.transform = `translate(${(t.x - x).toFixed(1)}px, ${(t.y - y).toFixed(1)}px) scale(${1 - i * 0.13})`;
        px = t.x; py = t.y;
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const cache = {};
  TT.cursor = {
    /** w: era weights from TT.weights(t) */
    set(w) {
      // sharpen so the pointer doesn't look doubled for long in the middle of a blend
      let sum = 0; const s = {};
      for (const k in el) { s[k] = Math.pow(w[k] || 0, 2.5); sum += s[k]; }
      for (const k in el) {
        const v = (s[k] / (sum || 1)).toFixed(2);
        if (cache[k] !== v) { cache[k] = v; el[k].style.opacity = v; }
      }
      ai = w.ai || 0;
      const tv = (ai * 0.8).toFixed(2);
      if (cache.trail !== tv) { cache.trail = tv; root.style.setProperty("--trail", tv); }
    }
  };
})();
