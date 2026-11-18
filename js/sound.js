/* Your $100: tiny synthesized sound effects (Web Audio, no files). Off until the user turns it on. */
(() => {
  let ctx = null, master = null, on = false, lastKaching = 0;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  }
  function tone(freq, start, dur, type = "square", vol = 0.25, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(master);
    o.start(start); o.stop(start + dur + 0.02);
  }
  function noise(start, dur, vol = 0.2, from = 400, to = 4000) {
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, start); f.frequency.exponentialRampToValueAtTime(to, start + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, start); g.gain.linearRampToValueAtTime(vol, start + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(start); src.stop(start + dur);
  }

  TT.sound = {
    get on() { return on; },
    toggle(force) { on = force != null ? force : !on; if (on) ensure(); return on; },
    // cash register: bell + drawer click
    kaching() {
      if (!on) return;
      const now = performance.now();
      if (now - lastKaching < 70) return;
      lastKaching = now;
      ensure();
      const t = ctx.currentTime;
      noise(t, 0.05, 0.15, 2000, 3000);
      tone(2093, t + 0.02, 0.18, "triangle", 0.22);
      tone(2637, t + 0.07, 0.35, "triangle", 0.2);
    },
    buy() { if (!on) return; ensure(); const t = ctx.currentTime; tone(660, t, 0.08, "square", 0.12, 990); },
    drop() { if (!on) return; ensure(); const t = ctx.currentTime; tone(330, t, 0.12, "sine", 0.2, 520); },
    whoosh() { if (!on) return; ensure(); noise(ctx.currentTime, 0.7, 0.3, 300, 5000); },
    glitch() {
      if (!on) return; ensure();
      const t = ctx.currentTime;
      for (let i = 0; i < 10; i++) tone(200 + Math.random() * 1800, t + i * 0.035, 0.04, "square", 0.12);
      tone(110, t + 0.4, 1.2, "sine", 0.25, 55);
    },
    print() { if (!on) return; ensure(); const t = ctx.currentTime; for (let i = 0; i < 4; i++) noise(t + i * 0.03, 0.025, 0.08, 3000, 5000); },
    tear() { if (!on) return; ensure(); noise(ctx.currentTime, 0.35, 0.35, 6000, 800); }
  };
})();
