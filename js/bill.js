/* Your $100: a big $100 bill that burns away in step with inflation */
(() => {
  class Bill {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.amount = -1;
      // low-res noise field for an organic burn edge
      this.NW = 220; this.NH = 94;
      this.field = new Float32Array(this.NW * this.NH);
      const rnd = mulberry(7);
      const grid = [];
      const G = 12;
      for (let i = 0; i <= G; i++) { grid.push([]); for (let j = 0; j <= G; j++) grid[i].push(rnd()); }
      const smooth = (x) => x * x * (3 - 2 * x);
      const vnoise = (x, y) => {
        const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
        const a = grid[xi][yi], b = grid[xi + 1][yi], c = grid[xi][yi + 1], d = grid[xi + 1][yi + 1];
        return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
      };
      for (let y = 0; y < this.NH; y++) for (let x = 0; x < this.NW; x++) {
        const nx = x / this.NW, ny = y / this.NH;
        const n = vnoise(nx * 5.5, ny * 5.5) * 0.65 + vnoise(nx * 11, ny * 11) * 0.35;
        // burns from the right edge inward, with a ragged noisy front
        this.field[y * this.NW + x] = (1 - nx) * 0.72 + n * 0.28;
      }
      this.face = document.createElement("canvas");
      this.resize();
      new ResizeObserver(() => { this.resize(); this.set(this.amount, true); }).observe(canvas);
    }

    resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = this.canvas.clientWidth || 300, h = this.canvas.clientHeight || 128;
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = w * dpr; this.canvas.height = h * dpr;
      this.drawFace();
    }

    drawFace() {
      const { w, h, dpr } = this;
      const c = this.face;
      c.width = w * dpr; c.height = h * dpr;
      const g = c.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#dfeccf"); bg.addColorStop(0.55, "#bcd6a8"); bg.addColorStop(1, "#9cbf86");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      // guilloche-ish line pattern
      g.strokeStyle = "rgba(60,100,50,.18)"; g.lineWidth = 1;
      for (let i = -h; i < w; i += 7) { g.beginPath(); g.moveTo(i, 0); g.bezierCurveTo(i + 30, h * 0.3, i - 20, h * 0.7, i + 15, h); g.stroke(); }
      g.strokeStyle = "#5e8a4a"; g.lineWidth = Math.max(3, w * 0.012); g.strokeRect(4, 4, w - 8, h - 8);
      g.strokeStyle = "rgba(94,138,74,.6)"; g.lineWidth = 1; g.strokeRect(12, 12, w - 24, h - 24);
      g.fillStyle = "#2f5a24";
      g.font = `700 ${Math.round(h * 0.2)}px Georgia, serif`;
      g.textBaseline = "top"; g.fillText("100", 18, 16);
      g.textAlign = "right"; g.textBaseline = "bottom"; g.fillText("100", w - 18, h - 14);
      g.textAlign = "center"; g.textBaseline = "middle";
      // portrait medallion (no real person, just a $)
      g.fillStyle = "rgba(233,242,224,.95)"; g.beginPath(); g.ellipse(w / 2, h * 0.47, h * 0.28, h * 0.31, 0, 0, 7); g.fill();
      g.strokeStyle = "#5e8a4a"; g.lineWidth = 2; g.stroke();
      g.fillStyle = "#2f5a24"; g.font = `700 ${Math.round(h * 0.34)}px Georgia, serif`; g.fillText("$", w / 2, h * 0.49);
      g.font = `600 ${Math.max(8, Math.round(h * 0.075))}px Georgia, serif`;
      g.fillText("ONE HUNDRED DOLLARS", w / 2, h - h * 0.13, w * 0.52);
      g.font = `600 ${Math.max(8, Math.round(h * 0.07))}px Georgia, serif`;
      g.fillText("NOT LEGAL TENDER · TIME TRAVEL ONLY", w / 2, h * 0.12, w * 0.56);
    }

    /** amount = value left out of 100 (in 1980 dollars) */
    set(amount, force = false) {
      if (!force && Math.abs(amount - this.amount) < 0.08) return;
      this.amount = amount;
      const burn = Math.max(0, Math.min(1, 1 - amount / 100));
      const { ctx, w, h, dpr, NW, NH } = this;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.drawImage(this.face, 0, 0);
      if (burn <= 0) return;
      // burn mask at low res
      const m = this.mask || (this.mask = document.createElement("canvas"));
      m.width = NW; m.height = NH;
      const mc = m.getContext("2d");
      const img = mc.createImageData(NW, NH);
      const d = img.data;
      const thr = 1 - burn * 1.02;
      for (let i = 0; i < NW * NH; i++) {
        const f = this.field[i];
        const o = i * 4;
        if (f < thr - 0.045) { d[o + 3] = 0; continue; }          // paper intact
        if (f < thr) {                                             // glowing ember edge
          const k = (thr - f) / 0.045;
          d[o] = 255; d[o + 1] = 120 + 120 * k; d[o + 2] = 30 * k; d[o + 3] = 255;
        } else if (f < thr + 0.025) {                              // charred rim
          d[o] = 35; d[o + 1] = 25; d[o + 2] = 20; d[o + 3] = 255;
        } else { d[o + 3] = 254; d[o] = 0; d[o + 1] = 0; d[o + 2] = 0; } // burned away → cut out
      }
      mc.putImageData(img, 0, 0);
      // 1) cut out burned area
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      // draw rims/embers
      const tmp = this.tmp || (this.tmp = document.createElement("canvas"));
      tmp.width = this.canvas.width; tmp.height = this.canvas.height;
      const tc = tmp.getContext("2d", { willReadFrequently: true });
      tc.imageSmoothingEnabled = true;
      tc.drawImage(m, 0, 0, tmp.width, tmp.height);
      // pixels with alpha 254 = burned → erase them from the bill
      const id = tc.getImageData(0, 0, tmp.width, tmp.height);
      const td = id.data;
      for (let i = 0; i < td.length; i += 4) {
        if (td[i + 3] > 250 && td[i] < 10 && td[i + 1] < 10) td[i + 3] = 0;
      }
      tc.putImageData(id, 0, 0);
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(m, 0, 0, this.canvas.width, this.canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowColor = "rgba(255,140,40,.9)"; ctx.shadowBlur = 12 * dpr;
      ctx.drawImage(tmp, 0, 0);
      ctx.restore();
    }
  }

  function mulberry(a) {
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  TT.Bill = Bill;
})();
