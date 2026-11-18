/* Your $100: a big physics cart. Each unit you buy is one large, readable body. */
(() => {
  const { Engine, Bodies, Composite, Body, Mouse, MouseConstraint, Query, Events } = Matter;
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const COLORS = { eggs: "#f4d9a6", bread: "#e0a35b", milk: "#e9eef5", bananas: "#ffd84d", coffee: "#7b4a2d", gas: "#ff5a3c", movie: "#c64bff", subway: "#2ecc71" };

  class BigCart {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.engine = Engine.create();
      this.engine.gravity.y = 1.2;
      this.bodies = new Map(); // uid -> body
      this.flying = [];        // items flying out at the camera
      this.weights = { "80s": 1 };
      this.accent = "#39ff6a";
      this.sprites = {};
      this.resize();
      new ResizeObserver(() => this.resize()).observe(canvas);
      if (window.matchMedia("(pointer: fine)").matches) {
        const mouse = Mouse.create(canvas);
        mouse.pixelRatio = this.dpr;
        ["mousewheel", "DOMMouseScroll", "wheel"].forEach((ev) => canvas.removeEventListener(ev, mouse.mousewheel));
        this.mouse = mouse;
        this.mc = MouseConstraint.create(this.engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
        Composite.add(this.engine.world, this.mc);
        // a click (no real drag) on an item = "pick" it; a drag = throw it around
        let down = null;
        Events.on(this.mc, "startdrag", (e) => { down = { b: e.body, x: mouse.position.x, y: mouse.position.y, t: performance.now() }; this.held = e.body.plugin.unit.uid; });
        Events.on(this.mc, "enddrag", (e) => {
          const was = this.held; this.held = null;
          if (down && Math.hypot(mouse.position.x - down.x, mouse.position.y - down.y) < 6 && performance.now() - down.t < 350) this.onPick && this.onPick(e.body.plugin.unit);
          else this.onRelease && this.onRelease(was);
          down = null;
        });
      }
      // hover: price tag
      this.tip = document.createElement("div");
      this.tip.className = "cart-tip";
      canvas.parentElement.appendChild(this.tip);
      canvas.addEventListener("pointerleave", () => { this.mx = null; this.hover = null; this.tip.classList.remove("show"); });
      this.risk = new Set();
      this.mouse01 = [0.5, 0.5];
      canvas.addEventListener("pointermove", (e) => {
        const r = canvas.getBoundingClientRect();
        this.mouse01 = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
        this.mx = e.clientX - r.left; this.my = e.clientY - r.top;
      });
      try {
        this.lens = new TT.CartLens(canvas, document.getElementById("cartLens"));
        canvas.parentElement.classList.add("lens-on");
      } catch (e) { this.lens = null; }
      this.loop();
    }

    resize() {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const w = Math.max(240, this.canvas.clientWidth), h = Math.max(200, this.canvas.clientHeight);
      if (w === this.w && h === this.h) return;
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = w * dpr; this.canvas.height = h * dpr;
      if (this.mouse) this.mouse.pixelRatio = dpr;
      if (this.walls) Composite.remove(this.engine.world, this.walls);
      const T = 80, pad = Math.max(14, w * 0.06);
      this.inner = { l: pad, r: w - pad, floor: h - 10, top: h * 0.12 };
      const o = { isStatic: true, friction: 0.7, restitution: 0.05 };
      this.walls = [
        Bodies.rectangle(w / 2, h - 10 + T / 2, w * 2, T, o),
        Bodies.rectangle(pad - T / 2, h / 2 - 600, T, h + 1400, { ...o, angle: -0.06 }),
        Bodies.rectangle(w - pad + T / 2, h / 2 - 600, T, h + 1400, { ...o, angle: 0.06 })
      ];
      Composite.add(this.engine.world, this.walls);
      // item size: big, but make ~110 items still fit
      this.r = Math.max(14, Math.min(30, Math.sqrt((w * h * 0.5) / (110 * 3.3))));
      this.sprites = {};
    }

    add(unit, fromTop = true) {
      if (this.bodies.has(unit.uid)) return;
      const r = this.r;
      const x = this.inner.l + r + Math.random() * (this.inner.r - this.inner.l - 2 * r);
      const y = fromTop ? -r - Math.random() * 120 : this.h * 0.3;
      const b = Bodies.circle(x, y, r * 0.92, { restitution: 0.25, friction: 0.5, density: 0.002 });
      Body.setAngle(b, (Math.random() - 0.5) * 1.6);
      Body.setVelocity(b, { x: (Math.random() - 0.5) * 2, y: 2 });
      b.plugin = { unit };
      this.bodies.set(unit.uid, b);
      Composite.add(this.engine.world, b);
    }

    /** remove a unit; it flies out toward the viewer */
    remove(unit, fly = true) {
      const b = this.bodies.get(unit.uid);
      if (!b) return null;
      if (this.mc && this.mc.body === b) { this.mc.body = null; this.mc.constraint.bodyB = null; this.held = null; }
      Composite.remove(this.engine.world, b);
      this.bodies.delete(unit.uid);
      if (fly) this.flying.push({ unit, x: b.position.x, y: b.position.y, a: b.angle, t0: performance.now(), vx: (b.position.x - this.w / 2) * 0.004 });
      const rect = this.canvas.getBoundingClientRect();
      return { x: rect.left + b.position.x, y: rect.top + b.position.y };
    }

    has(uid) { return this.bodies.has(uid); }

    /** knock everything a little (a "bump" of the cart) */
    bump(power = 1) {
      for (const b of this.bodies.values()) {
        if (b.plugin.unit.uid === this.held) continue;
        Body.setVelocity(b, { x: b.velocity.x + (Math.random() - 0.5) * 3 * power, y: b.velocity.y - (2 + Math.random() * 3) * power });
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.25 * power);
      }
    }

    updateHover() {
      if (this.mx == null || !this.tipText) return;
      const pt = { x: this.mx, y: this.my };
      const hit = (this.held && this.bodies.get(this.held)) || Query.point([...this.bodies.values()], pt)[0];
      const uid = hit ? hit.plugin.unit.uid : null;
      if (!hit) { if (this.hover) { this.hover = null; this.tip.classList.remove("show"); } return; }
      const html = this.tipText(hit.plugin.unit);
      if (html !== this.tipHtml) { this.tip.innerHTML = html; this.tipHtml = html; }
      this.hover = uid;
      this.tip.classList.add("show");
      const x = Math.min(this.w - 110, Math.max(110, hit.position.x));
      this.tip.style.transform = `translate(${x.toFixed(0)}px, ${(hit.position.y - this.r - 8).toFixed(0)}px) translate(-50%, -100%)`;
    }

    loop() {
      let last = performance.now(), acc = 0;
      const frame = (now) => {
        acc += Math.min(50, now - last); last = now;
        let n = 0;
        while (acc >= 16.667 && n < 3) { Engine.update(this.engine, 16.667); acc -= 16.667; n++; }
        if (n === 3) acc = 0;
        if (this.visible !== false) {
          if (this.risk.size && Math.random() < 0.35) {
            for (const uid of this.risk) {
              const b = this.bodies.get(uid);
              if (b && uid !== this.held) Body.setVelocity(b, { x: b.velocity.x + (Math.random() - 0.5) * 1.6, y: b.velocity.y - Math.random() * 1.2 });
            }
          }
          this.updateHover();
          this.draw(now);
          this.glitch = Math.max(0, (this.glitch || 0) - 0.012);
          if (this.lens) this.lens.render(this.weights, this.glitch, this.mouse01);
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }

    sprite(era, id, emoji) {
      const key = era + id + Math.round(this.r);
      if (this.sprites[key]) return this.sprites[key];
      const r = this.r, size = Math.ceil(r * 2.8), s = this.dpr;
      const c = document.createElement("canvas");
      c.width = c.height = Math.ceil(size * s); c.size = size;
      const g = c.getContext("2d");
      g.setTransform(s, 0, 0, s, (size * s) / 2, (size * s) / 2);
      g.textAlign = "center"; g.textBaseline = "middle";
      const col = COLORS[id] || "#999";
      if (era === "80s") {
        g.strokeStyle = "#39ff6a"; g.lineWidth = 2; g.shadowColor = "#39ff6a"; g.shadowBlur = 6;
        g.strokeRect(-r, -r, r * 2, r * 2);
      } else if (era === "90s") {
        g.fillStyle = "#c0c0c0"; g.fillRect(-r, -r, r * 2, r * 2);
        g.fillStyle = "#fff"; g.fillRect(-r, -r, r * 2, 3); g.fillRect(-r, -r, 3, r * 2);
        g.fillStyle = "#404040"; g.fillRect(-r, r - 3, r * 2, 3); g.fillRect(r - 3, -r, 3, r * 2);
      } else if (era === "00s") {
        const gr = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r);
        gr.addColorStop(0, "#fff"); gr.addColorStop(0.4, col); gr.addColorStop(1, "rgba(0,60,120,.6)");
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
      } else if (era === "10s") {
        g.fillStyle = col; g.beginPath(); g.roundRect(-r, -r, r * 2, r * 2, r * 0.35); g.fill();
      } else if (era === "ai") {
        const gr = g.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.35);
        gr.addColorStop(0, "rgba(255,255,255,.45)"); gr.addColorStop(0.6, "rgba(155,123,255,.35)"); gr.addColorStop(1, "rgba(155,123,255,0)");
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 1.35, 0, 7); g.fill();
      } else {
        g.fillStyle = "rgba(255,255,255,.09)"; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
      }
      g.shadowBlur = 0;
      g.fillStyle = "#000";
      g.font = `${Math.round(r * 1.3)}px ${EMOJI_FONT}`;
      g.fillText(emoji, 0, r * 0.08);
      this.sprites[key] = c;
      return c;
    }

    draw(now) {
      const { ctx, w, h, dpr, inner } = this;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const eras = Object.entries(this.weights).filter(([, v]) => v > 0.02).sort((a, b) => b[1] - a[1]).slice(0, 2);
      const sum = eras.reduce((s, [, v]) => s + v, 0) || 1;
      // basket
      ctx.save();
      ctx.strokeStyle = this.accent; ctx.lineWidth = 4; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(inner.l - 8, inner.top); ctx.lineTo(inner.l + 10, inner.floor); ctx.lineTo(inner.r - 10, inner.floor); ctx.lineTo(inner.r + 8, inner.top);
      ctx.stroke();
      ctx.globalAlpha = 0.12; ctx.lineWidth = 1.5;
      for (let i = 1; i < 7; i++) { const y = inner.top + ((inner.floor - inner.top) * i) / 7; ctx.beginPath(); ctx.moveTo(inner.l + 4, y); ctx.lineTo(inner.r - 4, y); ctx.stroke(); }
      for (let i = 1; i < 9; i++) { const x = inner.l + ((inner.r - inner.l) * i) / 9; ctx.beginPath(); ctx.moveTo(x, inner.top + 10); ctx.lineTo(x, inner.floor); ctx.stroke(); }
      ctx.restore();
      // items
      for (const b of this.bodies.values()) {
        const u = b.plugin.unit;
        ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
        const hot = this.hover === u.uid || this.held === u.uid;
        if (hot) ctx.scale(1.18, 1.18);
        if (this.risk.has(u.uid)) {
          ctx.globalAlpha = 0.55 + 0.35 * Math.sin(now / 90);
          ctx.strokeStyle = "#ff3b3b"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, this.r * 1.12, 0, 7); ctx.stroke();
        }
        for (const [era, wgt] of eras) {
          ctx.globalAlpha = wgt / sum;
          const s = this.sprite(era, u.id, u.emoji);
          ctx.drawImage(s, -s.size / 2, -s.size / 2, s.size, s.size);
        }
        ctx.restore();
      }
      // items flying at the camera
      this.flying = this.flying.filter((f) => {
        const k = (now - f.t0) / 700;
        if (k >= 1) return false;
        const e = 1 - Math.pow(1 - k, 2);
        const scale = 1 + e * 4.5;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - k * 1.2);
        ctx.translate(f.x + f.vx * e * 300, f.y - e * 120);
        ctx.rotate(f.a + e * 1.5);
        ctx.scale(scale, scale);
        const s = this.sprite(eras[0] ? eras[0][0] : "20s", f.unit.id, f.unit.emoji);
        ctx.drawImage(s, -s.size / 2, -s.size / 2, s.size, s.size);
        ctx.restore();
        return true;
      });
      ctx.globalAlpha = 1;
    }
  }
  TT.BigCart = BigCart;
})();
