/* Your $100: fill a cart in 1980, scroll through time, watch it disappear */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => "$" + n.toFixed(2);
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const monthOf = (t) => Math.min(11, Math.floor((t % 1) * 12));

  const ITEMS = TT.ITEMS;
  const byId = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
  const START = TT.START, END = TT.END, T0 = START + 0.001;
  const AGENT_T = 2025.55;
  const price = (id, t) => TT.price(id, t);
  const growth = Object.fromEntries(ITEMS.map((i) => [i.id, price(i.id, END) / price(i.id, T0)]));

  const BEATS = [
    { date: "1987-10-19", title: "Black Monday", text: "The stock market falls 22.6% in a single day." },
    { date: "2000-03-10", title: "The dot-com bubble pops", text: "Tech stocks peak, then crash." },
    { date: "2008-09-15", title: "Lehman Brothers collapses", text: "The global financial crisis begins." },
    { date: "2020-03-11", title: "A pandemic stops the world", text: "Shops close. Gas gets cheap. Then everything else doesn't." },
    { date: "2022-11-30", title: "ChatGPT launches", text: "AI goes mainstream. It would like to help you shop.", ai: true }
  ].map((b) => ({ ...b, t: TT.d(b.date) }));

  /* ================= scroll ↔ time ================= */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);
  const SHOP_VH = 45;
  const PACE = [[START, 10], [TT.CHATGPT - 0.25, 26]];
  const segs = [];
  let acc = SHOP_VH;
  PACE.forEach(([t0, v], i) => { const t1 = i + 1 < PACE.length ? PACE[i + 1][0] : END; segs.push({ t0, t1, d0: acc, v }); acc += (t1 - t0) * v; });
  const TOTAL_VH = acc;
  const journey = $("#journey");
  const OUTRO_VH = 35;
  let jTop = 0, vh = innerHeight, lastW = innerWidth;
  const measure = () => {
    journey.style.height = `${Math.round(((TOTAL_VH + OUTRO_VH) / 100) * vh + innerHeight)}px`;
    jTop = journey.offsetTop;
  };
  measure();
  addEventListener("load", measure);
  addEventListener("resize", () => {
    // a phone's address bar showing/hiding changes only the height: ignore it, so time doesn't jump
    if (innerWidth === lastW && Math.abs(innerHeight - vh) < 160) return;
    const keep = S.t;
    lastW = innerWidth; vh = innerHeight; measure();
    if (!S.shopMode) { snapNext = true; scrollTo(0, jTop + (dFromT(keep) / 100) * vh); }
  });
  const dNow = () => ((scrollY - jTop) / vh) * 100; // scroll position in vh
  function tFromD(d) {
    if (d <= SHOP_VH) return START;
    for (const g of segs) if (d <= g.d0 + (g.t1 - g.t0) * g.v) return g.t0 + (d - g.d0) / g.v;
    return END;
  }
  function dFromT(t) {
    for (const g of segs) if (t <= g.t1) return g.d0 + (Math.max(t, g.t0) - g.t0) * g.v;
    return TOTAL_VH;
  }
  const scrollToT = (t, smooth = true) => scrollTo({ top: jTop + (dFromT(t) / 100) * vh, behavior: smooth && !reduce ? "smooth" : "auto" });

  /* ================= state ================= */
  const S = {
    units: [], seq: 0,
    t: START, shopMode: true, started: false,
    agent: { applied: false, undone: false, fav: null, extra: [] },
    lines: new Map(), lastT: START, era: null, born: null
  };

  /* ================= components ================= */
  const cart = new TT.BigCart($("#cart"));

  /* ---- cart interactions: hover for prices, click to put back, hold on to save it ---- */
  cart.tipText = (u) => {
    const p0 = price(u.id, T0);
    if (S.shopMode) return `<b>${u.emoji} ${u.name}</b><span>${fmt(p0)} in 1980</span><em>click to put it back</em>`;
    const t = S.t, p1 = price(u.id, t);
    const yr = Math.min(2026, Math.floor(t));
    let note = "drag it, throw it";
    if (cart.held === u.uid && S.holding === u.uid) note = "holding on… prices keep rising";
    else if (cart.risk.has(u.uid)) note = "⚠ next to go. grab it!";
    return `<b>${u.emoji} ${u.name}</b><span>${fmt(p0)} → ${fmt(p1)} in ${yr} <i>×${(p1 / p0).toFixed(1)}</i></span><em>${note}</em>`;
  };
  cart.onPick = (u) => { if (S.shopMode) unbuyUnit(u); };
  cart.onRelease = (uid) => { if (S.holding && S.holding === uid) { S.holding = null; renderedT = -1; } };
  const bill = new TT.Bill($("#bill"));
  TT._cart = cart;

  /* ================= shop ================= */
  const shelf = $("#shelf");
  for (const it of ITEMS) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = it.id;
    card.innerHTML = `<button type="button" class="c-buy" aria-label="Buy ${it.name}">
        <span class="c-emoji">${it.emoji}</span>
        <span class="c-name">${it.name}<small>${it.unit}</small></span>
        <span class="c-price">${fmt(price(it.id, T0))}</span>
      </button>
      <span class="c-qty"><button type="button" class="c-minus" aria-label="Remove one ${it.name}">−</button><b>0</b></span>`;
    $(".c-buy", card).addEventListener("click", () => buy(it.id));
    $(".c-minus", card).addEventListener("click", () => unbuy(it.id));
    shelf.appendChild(card);
  }
  const cash = () => 100 - S.units.reduce((s, u) => s + price(u.id, T0), 0);
  function buy(id, quiet = false) {
    if (!S.shopMode) return false;
    if (price(id, T0) > cash() + 1e-9) {
      if (!quiet) { const c = $(`.card[data-id="${id}"]`); c.classList.remove("nope"); void c.offsetWidth; c.classList.add("nope"); }
      return false;
    }
    const it = byId[id];
    const u = { uid: "u" + ++S.seq, id, emoji: it.emoji, name: it.name, seq: S.seq };
    S.units.push(u);
    cart.add(u);
    if (!quiet) TT.sound.buy();
    shopUI();
    return true;
  }
  function unbuyUnit(u) {
    if (!S.shopMode) return;
    const i = S.units.indexOf(u);
    if (i < 0) return;
    cart.remove(u, true);
    S.units.splice(i, 1);
    TT.sound.drop();
    shopUI();
  }
  function unbuy(id) {
    if (!S.shopMode) return;
    for (let i = S.units.length - 1; i >= 0; i--) if (S.units[i].id === id) {
      cart.remove(S.units[i], true);
      S.units.splice(i, 1);
      break;
    }
    shopUI();
  }
  function surprise() {
    for (const u of S.units) cart.remove(u, false);
    S.units = [];
    const ids = ITEMS.map((i) => i.id);
    let guard = 0;
    while (guard++ < 500) {
      const ok = ids.filter((id) => price(id, T0) <= cash() + 1e-9);
      if (!ok.length) break;
      buy(ok[(Math.random() * ok.length) | 0], true);
    }
    TT.sound.buy();
    shopUI();
  }
  /* buy random things with whatever is left, keeping what you picked */
  function fillRest() {
    const before = cash(), mode = S.shopMode;
    S.shopMode = true;                      // buying is only allowed in the shop
    const ids = ITEMS.map((i) => i.id);
    let guard = 0;
    while (guard++ < 500) {
      const ok = ids.filter((id) => price(id, T0) <= cash() + 1e-9);
      if (!ok.length) break;
      buy(ok[(Math.random() * ok.length) | 0], true);
    }
    S.shopMode = mode;
    shopUI();
    return before;
  }
  function shopUI() {
    for (const it of ITEMS) {
      const c = $(`.card[data-id="${it.id}"]`);
      const n = S.units.filter((u) => u.id === it.id).length;
      $(".c-qty b", c).textContent = n;
      c.classList.toggle("has", n > 0);
      c.classList.toggle("cant", price(it.id, T0) > cash() + 1e-9);
    }
    set($("#cash"), fmt(Math.max(0, cash()))); set($("#cashL"), "Cash left");
    const spent = 100 - cash();
    $("#rThen").textContent = fmt(spent);
    $("#rNow").textContent = fmt(spent);
    $("#goBtn").classList.toggle("ready", S.units.length > 0);
    renderBought();
    cart.setCapacity(Math.max(S.units.length + 24, 40));
    $("#howto").classList.toggle("mini", S.units.length >= 6);
    $("#howto .howto-h").firstChild.textContent = S.units.length >= 6 ? "NOW SCROLL DOWN ↓ " : "HOW TO PLAY";
  }
  /* the top of the receipt: what you bought in 1980 (stays there the whole trip) */
  const rBought = $("#rBought");
  function renderBought(kept) {
    if (!S.units.length) { rBought.innerHTML = `<p class="r-none">Your cart is empty.<br>Tap items on the left.</p>`; return; }
    const rows = [];
    for (const it of ITEMS) {
      const mine = S.units.filter((u) => u.id === it.id);
      if (!mine.length) continue;
      const left = kept ? mine.filter((u) => kept.has(u.uid)).length : mine.length;
      rows.push(`<div class="${left ? "" : "r-gone"}"><span>${kept && left !== mine.length ? `${left}/` : ""}${mine.length}× ${it.emoji} ${it.name.toUpperCase()}</span><span>${fmt(price(it.id, T0) * mine.length)}</span></div>`);
    }
    const html = rows.join("");
    if (rBought.__html !== html) { rBought.innerHTML = html; rBought.__html = html; }
  }
  $("#surpriseBtn").addEventListener("click", surprise);
  $("#goBtn").addEventListener("click", () => {
    if (!S.units.length) surprise();
    scrollTo({ top: jTop + ((SHOP_VH + 4) / 100) * vh, behavior: reduce ? "auto" : "smooth" });
  });

  /* ================= what's still in the cart at time t ================= */
  function cartAt(t) {
    let list = S.units;
    const ag = S.agent;
    const agentOn = ag.applied && !ag.undone && t >= AGENT_T;
    if (agentOn) list = list.filter((u) => u.id !== ag.fav).concat(ag.extra);
    let cost = 0;
    for (const u of list) cost += price(u.id, t);
    const full = cost;
    const kept = new Set(list.map((u) => u.uid));
    if (cost > 100) {
      const order = list.slice().sort((a, b) => growth[b.id] - growth[a.id] || b.seq - a.seq);
      for (const u of order) {
        if (cost <= 100) break;
        kept.delete(u.uid);
        cost -= price(u.id, t);
      }
    }
    return { list, kept, full, keptCost: cost, agentOn };
  }

  /* ================= receipt ================= */
  const rLines = $("#rLines");
  function addLine(u, t, byPenny) {
    if (S.lines.has(u.uid)) return;
    rLines.querySelector(".r-empty")?.remove();
    const li = document.createElement("li");
    if (byPenny) li.className = "r-penny";
    const yr = String(Math.floor(t)).slice(2);
    li.innerHTML = `<span class="r-d">${MON[monthOf(t)]} '${yr}</span><span class="r-i">−1 ${u.emoji} ${u.name.toUpperCase()}</span><span class="r-p">${byPenny ? "✨AI" : fmt(price(u.id, t))}</span>`;
    rLines.appendChild(li);
    S.lines.set(u.uid, li);
    rLines.scrollTop = rLines.scrollHeight;
  }
  function dropLine(uid) {
    const li = S.lines.get(uid);
    if (li) { li.remove(); S.lines.delete(uid); }
    if (!S.lines.size && !rLines.querySelector(".r-empty")) rLines.innerHTML = `<li class="r-empty">Losses print here as prices rise.</li>`;
    rLines.scrollTop = rLines.scrollHeight;
  }

  /* ================= beats ================= */
  const beatEl = $("#beat");
  let beatTimer = 0;
  function showBeat(b, leftNow, total) {
    const [y, m, d] = b.date.split("-").map(Number);
    $("#bDate").textContent = b.born ? `${y} · your birth year` : `${MONTHS[m - 1]} ${d}, ${y}`;
    $("#bTitle").textContent = b.title;
    cart.bump(b.ai || b.born ? 1.6 : 1.1);
    $("#bText").textContent = b.text;
    S.beatOn = true; S.beatT = b.t;
    $("#bStat").textContent = `Your cart: ${leftNow} of ${total} items left.`;
    beatEl.className = "beat show" + (b.ai ? " ai" : "") + (b.born ? " born" : "");
    clearTimeout(beatTimer);
    beatTimer = setTimeout(() => { beatEl.classList.remove("show"); S.beatOn = false; }, b.ai || b.born ? 2600 : 1900);
    if (b.ai) { cart.glitch = 1.4; TT.sound.glitch(); document.body.classList.add("glitch"); setTimeout(() => document.body.classList.remove("glitch"), 900); }
    else TT.sound.whoosh();
  }

  /* ================= AI ================= */
  let aiLevel = -1;
  function setAI(n) {
    if (n === aiLevel) return;
    aiLevel = n;
    for (let i = 1; i <= 4; i++) document.body.classList.toggle("ai-" + i, n >= i);
  }
  const cursorEl = $("#agentCursor");
  let cx = innerWidth * 0.8, cy = innerHeight * 0.7;
  async function cursorTo(x, y, ms) {
    cursorEl.style.transition = `transform ${ms}ms cubic-bezier(.3,.8,.3,1)`;
    cx = x; cy = y; cursorEl.style.transform = `translate(${x}px, ${y}px)`;
    await wait(ms);
  }
  const agentBar = $("#agentBar"), agentMsg = $("#agentMsg");
  let streamId = 0;
  async function stream(el, text, speed = 16) {
    const id = ++streamId;              // a newer message cancels the one still typing
    el.textContent = "";
    if (reduce) { el.textContent = text; return; }
    for (const tok of text.match(/\S+\s*/g) || []) {
      if (id !== streamId) return;
      el.textContent += tok;
      await wait(speed + Math.random() * speed);
    }
  }
  async function runAgent() {
    const ag = S.agent;
    if (ag.applied) return;
    // favorite = what you still have the most of in the cart (bananas don't count; Penny loves bananas)
    const counts = {};
    const keptNow = cartAt(AGENT_T - 0.001).kept;
    for (const u of S.units) if (u.id !== "bananas" && keptNow.has(u.uid)) counts[u.id] = (counts[u.id] || 0) + 1;
    const fav = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (!fav) return;
    ag.applied = true; ag.fav = fav;
    const freed = counts[fav] * price(fav, AGENT_T);
    const n = Math.min(24, Math.floor(freed / price("bananas", AGENT_T)));
    const fee = freed - n * price("bananas", AGENT_T);
    ag.extra = Array.from({ length: n }, (_, i) => ({ uid: "pb" + i, id: "bananas", emoji: "🍌", name: "Bananas", seq: 100000 + i }));
    cursorEl.classList.add("show");
    agentBar.hidden = false;
    document.body.classList.add("agent-on");
    stream(agentMsg, "Penny ✨ is optimizing your cart for maximum value…");
    const r = $("#cart").getBoundingClientRect();
    await cursorTo(r.left + r.width * 0.5, r.top + r.height * 0.6, 700);
    await cursorTo(r.left + r.width * 0.3, r.top + r.height * 0.75, 500);
    cursorEl.classList.add("clicking");
    S.agentNow = true;
    renderedT = -1;
    await wait(300);
    cursorEl.classList.remove("clicking");
    stream(agentMsg, `Done ✨ I removed your ${byId[fav].emoji} ${byId[fav].name.toLowerCase()} (low value per dollar) and added ${n} 🍌 bananas. I kept ${fmt(fee)} as a service fee. You're welcome.`);
    await cursorTo(innerWidth * 0.86, innerHeight * 0.28, 900);
  }
  $("#agentUndo").addEventListener("click", () => {
    S.agent.undone = true;
    renderedT = -1;
    stream(agentMsg, "Fine. Your cart, your choices. (I'll be watching.)");
    cursorEl.classList.remove("show");
  });

  /* ================= your life on the timeline ================= */
  let LIFE = [];
  function buildLife(born) {
    const age = (y) => y - born;
    const at = (a) => born + a + 0.5;
    LIFE = [];
    if (born >= START && born + 0.5 <= END) {
      BEATS.push({ date: `${born}-07-01`, t: born + 0.5, title: "You were born", text: `Welcome to ${born}. Your $100 has already lost ${(100 - (100 * TT.cpi(1980.5)) / TT.cpi(born + 0.5)).toFixed(0)}% of its value.`, born: true });
      BEATS.sort((a, b) => a.t - b.t);
    }
    const add = (a, text) => { const t = at(a); if (t > START + 0.05 && t <= END) LIFE.push({ t, a, text: text(t) }); };
    add(6, (t) => `You start first grade. A dozen eggs: ${fmt(price("eggs", t))}.`);
    add(13, (t) => `You're 13. A movie ticket: ${fmt(price("movie", t))}.`);
    add(16, (t) => `You're 16 and can drive. Gas: ${fmt(price("gas", t))} a gallon.`);
    add(18, (t) => `You're 18. A year of public college: $${Math.round(TT.tuition(t)).toLocaleString()}.`);
    add(21, (t) => `You're 21. Minimum wage: $${TT.minWage(t).toFixed(2)} an hour.`);
    const today = age(2026);
    if (today >= 1) LIFE.push({ t: END - 0.03, a: today, text: `That's you today, at ${today}. Your $100 buys what ${fmt((100 * TT.cpi(1980.5)) / TT.cpi(END))} did in 1980.` });
    LIFE.sort((a, b) => a.t - b.t);
    // two moments too close together: move the earlier one back so neither gets swallowed
    for (let i = LIFE.length - 2; i >= 0; i--) if (LIFE[i + 1].t - LIFE[i].t < 0.6) LIFE[i].t = LIFE[i + 1].t - 0.6;
    // timeline
    const f = (t) => ((Math.max(START, t) - START) / (END - START)) * 100;
    const seg = document.createElement("span");
    seg.className = "life";
    seg.style.left = f(born + 0.5) + "%";
    seg.style.width = 100 - f(born + 0.5) + "%";
    seg.innerHTML = "<em>your life</em>";
    prog.prepend(seg);
    if (born >= START) {
      const m = document.createElement("span");
      m.className = "pm pm-born"; m.style.left = f(born + 0.5) + "%"; m.textContent = "🍼"; m.title = "You were born";
      prog.appendChild(m);
    }
    // shop subtitle
    const a1980 = 1980 - born;
    $(".shop-sub").textContent = a1980 > 0
      ? `You're ${a1980}. Fill your cart, then scroll and watch what 46 years of real prices do to it.`
      : a1980 === 0
        ? `You're born this year. Fill your cart, then scroll and watch real prices grow up with you.`
        : `You won't be born for ${-a1980} years. Fill your cart anyway, then scroll and watch what real prices do before and after you arrive.`;
  }
  const toast = $("#toast");
  let toastTimer = 0;
  function showToast(e) {
    $("#tAge").textContent = e.a === 0 ? "🍼" : e.a;
    toast.classList.toggle("dip", e.a === "📉");
    $("#tText").textContent = e.text;
    S.toastT = e.t != null ? e.t : S.t;
    toast.classList.add("show");
    document.body.classList.add("toasting");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove("show"); document.body.classList.remove("toasting"); }, 2600);
  }

  /* ================= price ticker: what you bought, then vs now ================= */
  const tickerEl = $("#ticker");
  let tickerIds = "";
  function renderTicker(t) {
    const ids = ITEMS.filter((it) => S.units.some((u) => u.id === it.id)).map((it) => it.id);
    const key = ids.join();
    if (key !== tickerIds) {
      tickerIds = key;
      tickerEl.innerHTML = ids.map((id) => `<div class="tk" data-id="${id}"><span class="tk-e">${byId[id].emoji}</span><span class="tk-n">${byId[id].name}</span><span class="tk-p"><i>${fmt(price(id, T0))} →</i> <b></b></span><div class="tk-bar"><span></span></div></div>`).join("");
    }
    for (const row of tickerEl.children) {
      const id = row.dataset.id, p0 = price(id, T0), p1 = price(id, t);
      set(row.querySelector("b"), fmt(p1));
      const w = Math.min(100, ((p1 / p0) / 6) * 100).toFixed(1) + "%";   // full bar = 6× the 1980 price
      const bar = row.querySelector(".tk-bar span");
      if (bar.style.width !== w) bar.style.width = w;
    }
  }

  /* ================= progress bar ================= */
  const prog = $("#progress");
  const fracT = (t) => (t - START) / (END - START);
  for (const b of BEATS) {
    const m = document.createElement("span");
    m.className = "pm" + (b.ai ? " pm-ai" : "");
    m.style.left = fracT(b.t) * 100 + "%";
    m.title = b.title;
    if (b.ai) m.innerHTML = "<em>✦ ChatGPT</em>";
    prog.appendChild(m);
  }
  [1980, 1990, 2000, 2010, 2020].forEach((y) => {
    const m = document.createElement("span");
    m.className = "py"; m.style.left = fracT(y) * 100 + "%"; m.textContent = y;
    prog.appendChild(m);
  });

  /* ================= render ================= */
  const yLayers = { "80s": $(".y-80"), "90s": $(".y-90"), "00s": $(".y-00"), "10s": $(".y-10"), "20s": $(".y-20"), ai: $(".y-ai") };
  const decor = { "80s": $(".d-80"), "90s": $(".d-90"), "00s": $(".d-00"), "20s": $(".d-20"), ai: $(".d-ai") };
  const yearEls = $$(".year-stack .y, .y-sizer");
  const TITLES = { "80s": "C:\\> CART.EXE", "90s": "Cart.exe", "00s": "My Cart ✦ beta", "10s": "CART", "20s": "Cart", ai: "✨ Penny's Smart Cart™" };
  const LABELS = { "80s": "1980s · the CRT era", "90s": "1990s · the dial-up era", "00s": "2000s · the Web 2.0 era", "10s": "2010s · the smartphone era", "20s": "2020s · the dark-mode era", ai: "The AI era" };
  let renderedT = -1, lastYear = -1;
  const txt = new WeakMap();
  const set = (el, v) => { if (txt.get(el) !== v) { txt.set(el, v); el.textContent = v; } };

  function render() {
    const t = S.t;
    const forward = t >= S.lastT;
    if (Math.abs(t - renderedT) < 0.00003) return;
    renderedT = t;

    // theme
    const w = TT.weights(t);
    const { dominant, accent } = TT.applyTheme(w);
    TT.cursor.set(w);
    cart.weights = w; cart.accent = accent;
    for (const k in decor) decor[k].classList.toggle("off", !(w[k] > 0.005));
    for (const k in yLayers) yLayers[k].classList.toggle("off", !(w[k] > 0.003));
    $("#stage").classList.toggle("glow", w["80s"] > 0.01);
    if (dominant !== S.era) { S.era = dominant; document.body.dataset.era = dominant; set($("#eraLabel"), LABELS[dominant]); set($("#cartTitle"), TITLES[dominant]); }
    const y = Math.min(2026, Math.floor(t));
    if (y !== lastYear) { if (!S.shopMode && lastYear > 0 && y > lastYear) cart.bump(0.35); lastYear = y; yearEls.forEach((e) => (e.textContent = y)); }
    set($("#month"), MONTHS[monthOf(t)]);

    // cart contents
    if (!S.shopMode) {
      let flies = 0;
      const back = {};
      const c = cartAt(t);
      for (const u of c.list) {
        const want = c.kept.has(u.uid), have = cart.has(u.uid);
        if (want && !have) {
          const wasLost = S.lines.has(u.uid);   // it was taken earlier, and now it's affordable again
          cart.add(u); dropLine(u.uid);
          if (forward) { TT.sound.drop(); if (wasLost && u.uid[0] === "u") back[u.id] = (back[u.id] || 0) + 1; }
        }
        else if (!want && have) {
          // you can hang on to an item for a while by holding it... but not forever
          if (cart.held === u.uid && !reduce) {
            if (S.holding !== u.uid) { S.holding = u.uid; S.holdT = t; }
            if (t - S.holdT < 2.5) continue;      // inflation always wins in the end
            S.holding = null;
          }
          cart.remove(u, flies++ < 3); addLine(u, t, false); TT.sound.kaching();
        }
      }
      // units not in the list right now (removed by Penny, or Penny's bananas when undone)
      const inList = new Set(c.list.map((u) => u.uid));
      for (const u of S.units.concat(S.agent.extra)) {
        if (!inList.has(u.uid) && cart.has(u.uid)) {
          cart.remove(u, true);
          if (u.uid[0] === "u") addLine(u, t, true);
          TT.sound.kaching();
        }
        if (!inList.has(u.uid) && u.uid[0] === "p") dropLine(u.uid);
        if (inList.has(u.uid) && u.uid[0] === "u" && c.kept.has(u.uid)) dropLine(u.uid);
      }
      // when prices fall, items come back: say why, so it doesn't look like a bug
      const nBack = Object.values(back).reduce((a, b) => a + b, 0);
      if (nBack && S.started && t > START + 2 && t < AGENT_T - 0.8 && t - (S.dipT || 0) > 3) {
        // name the things that actually got cheaper over the past half year
        const fell = ITEMS.filter((it) => price(it.id, t) < price(it.id, t - 0.5) * 0.97).map((it) => it.name.toLowerCase());
        if (fell.length) {
          S.dipT = t;
          queue.push({ kind: "toast", t, item: { a: "📉", text: `${fell.slice(0, 2).join(" and ").replace(/^./, (c) => c.toUpperCase())} got cheaper, so ${nBack} item${nBack > 1 ? "s" : ""} came back. Prices can fall. Just not for long.` } });
        }
      }
      const total = S.units.length;
      const left = S.units.filter((u) => c.kept.has(u.uid)).length;
      renderBought(c.kept);
      // items that will be gone within ~a year tremble in the cart
      const fut = cartAt(Math.min(END, t + 1.2));
      cart.risk = new Set(S.units.filter((u) => c.kept.has(u.uid) && !fut.kept.has(u.uid)).map((u) => u.uid));
      const empty = rLines.querySelector(".r-empty");
      if (empty) set(empty, `Nothing lost yet. Your cart now costs ${fmt(c.keptCost)} of your $100.`);
      const pb = S.agent.extra.filter((u) => c.kept.has(u.uid)).length;
      set($("#pennyAdd"), pb ? ` + ${pb} 🍌 Penny added` : "");
      set($("#left"), String(left));
      set($("#total"), String(total));
      set($("#cash"), fmt(c.keptCost));
      set($("#cashL"), "What's left in your cart costs");
      const mw = TT.minWage(t);
      const origCost = S.units.reduce((s, u) => s + price(u.id, t), 0);
      set($("#hours"), (origCost / mw).toFixed(1) + " h");
      set($("#hoursL"), `of minimum-wage work ($${mw.toFixed(2)}/h) to buy your 1980 cart now`);
      set($("#rThen"), fmt(S.units.reduce((s, u) => s + price(u.id, T0), 0)));
      set($("#rNow"), fmt(origCost));
      // beats
      for (const b of BEATS) if (forward && S.lastT < b.t && t >= b.t) queue.push({ kind: "beat", item: b, t: b.t });
      for (const e of LIFE) if (forward && S.lastT < e.t && t >= e.t) queue.push({ kind: "toast", item: e, t: e.t });
      if (!forward) queue.length = 0;
      S.leftNow = left; S.totalNow = total;
      if (toast.classList.contains("show") && (t - S.toastT > 2.2 || t < S.toastT - 0.3)) { clearTimeout(toastTimer); toast.classList.remove("show"); }
      if (S.beatOn) {
        set($("#bStat"), `Your cart: ${left} of ${total} items left.`);
        // the story has moved on: don't leave an old headline on screen
        if (t - S.beatT > 2.2 || t < S.beatT - 0.1) { clearTimeout(beatTimer); beatEl.classList.remove("show"); S.beatOn = false; }
      }
      // the agent
      if (t >= AGENT_T && forward && !S.agent.applied) runAgent();
      agentBar.hidden = !(S.agent.applied && t >= AGENT_T - 0.2);
    }

    // bill
    const worth = (100 * TT.cpi(1980.5)) / TT.cpi(Math.max(1980.5, t));
    bill.set(worth);
    set($("#worth"), fmt(worth));
    renderTicker(t);

    // AI creep
    const ai = TT.aiAmount(t);
    let lv = 0;
    if (t >= TT.CHATGPT) lv = 1;
    if (ai >= 0.3) lv = 2;
    if (ai >= 0.55) lv = 3;
    setAI(lv);
    if (t < AGENT_T - 0.3 || t > AGENT_T + 0.45) cursorEl.classList.remove("show");

    $("#progFill").style.width = fracT(t) * 100 + "%";
    S.lastT = t;
  }

  /* ================= event queue: one moment at a time, never a pile-up ================= */
  const queue = [];
  let busyUntil = 0, speed = 0;
  function dispatch(now) {
    if (!queue.length) return;
    const key = queue.find((q) => q.item.ai || q.item.born);
    if (now < busyUntil && !key) return;      // your birth and ChatGPT cut in line
    // while you're scrolling fast, wait; moments that fall too far behind are dropped
    // (the ChatGPT launch and your birth always get their moment)
    if (speed > 3.8 && !key) {
      for (let i = queue.length - 1; i >= 0; i--) {
        const q = queue[i];
        const important = q.item.ai || q.item.born;
        if (S.t - q.t > (important ? 1.5 : 1.2)) queue.splice(i, 1);
      }
      return;
    }
    // never show something that's already old news
    for (let i = queue.length - 1; i >= 0; i--) if (!(queue[i].item.ai || queue[i].item.born) && S.t - queue[i].t > 1.5) queue.splice(i, 1);
    if (!queue.length) return;
    // show the most important / most recent one, drop the rest
    const pick = queue.find((q) => q.item.ai || q.item.born) || queue.filter((q) => q.kind === "beat").pop() || queue[queue.length - 1];
    queue.length = 0;
    if (pick.kind === "beat") { showBeat(pick.item, S.leftNow, S.totalNow); busyUntil = now + (pick.item.ai || pick.item.born ? 2700 : 2000); }
    else { showToast(pick.item); busyUntil = now + 1400; }
  }

  /* ================= frame loop ================= */
  const MAX_YEARS_PER_SEC = 5;
  let snapNext = false;
  let lastNow = performance.now();
  const swapShop = $("#shop"), swapTime = $("#timepanel"), outro = $("#outro"), howto = $("#howto");
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000));
    lastNow = now;
    const d = dNow();
    // scroll-linked crossfade from the shop to the time panel (no hard cut)
    const k = Math.max(0, Math.min(1, (d / SHOP_VH - 0.05) / 0.85));
    const e = k * k * (3 - 2 * k);
    // first the shop slides away, then the time panel slides in (never both at once)
    const out = Math.min(1, e * 2), inn = Math.max(0, e * 2 - 1);
    swapShop.style.opacity = (1 - out).toFixed(3);
    swapShop.style.transform = `translateY(${(-40 * out).toFixed(1)}px)`;
    swapShop.style.visibility = out >= 1 ? "hidden" : "visible";
    swapTime.style.opacity = inn.toFixed(3);
    howto.style.opacity = (1 - out).toFixed(3);
    howto.style.visibility = out >= 1 ? "hidden" : "visible";
    swapTime.style.transform = `translateY(${(40 * (1 - inn)).toFixed(1)}px)`;
    // outro: only once the clock has really reached today, then hand over to the receipt
    const done = S.t >= END - 0.002;
    const o = done ? Math.max(0, Math.min(1, (d - TOTAL_VH + 4) / OUTRO_VH)) : 0;
    outro.style.opacity = (o * o).toFixed(3);
    document.body.classList.toggle("is-outro", o > 0.02);
    if (done && !S.ended && d >= TOTAL_VH - 2 && !document.body.classList.contains("gated")) {
      S.ended = true;
      setTimeout(() => { if (dNow() >= TOTAL_VH - 6) endEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }, 900);
    }
    if (d < TOTAL_VH - 10) S.ended = false;
    const shop = e < 0.5;
    if (shop !== S.shopMode) {
      S.shopMode = shop;
      document.body.classList.toggle("timing", !shop);
      if (!shop) {
        if (!S.units.length) surprise();
        else if (ITEMS.some((it) => price(it.id, T0) <= cash() + 1e-9)) {
          // half a cart has no story: the rest of your $100 goes in too
          const left = fillRest();
          setTimeout(() => showToast({ a: "🎲", t: S.t, text: `You still had ${fmt(left)}, so we spent the rest of your $100 for you.` }), 400);
        }
        // restore everything you bought before the clock starts
        for (const u of S.units) if (!cart.has(u.uid)) cart.add(u);
        S.started = true;
      } else {
        // back in the shop: put the full cart back
        for (const u of S.units) if (!cart.has(u.uid)) cart.add(u);
        for (const u of S.agent.extra) if (cart.has(u.uid)) cart.remove(u, false);
        for (const uid of [...S.lines.keys()]) dropLine(uid);
        shopUI();
        snapNext = true;                 // the shop is always 1980: don't count down to it
      }
      renderedT = -1;
    }
    let target = tFromD(d);
    // you can't scroll faster than time: if the page gets more than ~1.5 years ahead of the
    // clock (a flick, the End key, a scrollbar drag), gently hold the page back
    if (!reduce && !snapNext && !S.shopMode && !playing && target - S.t > 1.5 && S.t < END) {
      const holdD = dFromT(Math.min(END, S.t + 1.5));
      scrollTo(0, jTop + (holdD / 100) * vh);
      target = tFromD(holdD);
    }
    const diff = target - S.t;
    const prev = S.t;
    if (Math.abs(diff) < 0.0004 || reduce || snapNext || document.body.classList.contains("gated")) { S.t = target; snapNext = false; queue.length = 0; }
    else {
      // ease toward the scroll position, but never faster than a few years per second
      let step = diff * 0.3;
      // time slows down for the big moments (your birth, ChatGPT) so they land on screen
      const nearKey = BEATS.some((b) => (b.ai || b.born) && b.t > S.t - 0.02 && b.t - S.t < 0.5);
      const cap = MAX_YEARS_PER_SEC * dt * (S.t >= TT.CHATGPT - 0.3 ? 0.6 : 1) * (nearKey ? 0.35 : 1);
      if (Math.abs(step) > cap) step = Math.sign(step) * cap;
      S.t += step;
    }
    speed = speed * 0.85 + (Math.abs(S.t - prev) / dt) * 0.15;
    render();
    dispatch(now);
    requestAnimationFrame(frame);
  }

  /* ================= hint ================= */
  const hint = $("#hint");
  let idle = 0;
  function hintText() {
    const next = BEATS.find((b) => b.t > S.t + 0.01);
    return S.shopMode
      ? (!S.units.length ? "Tap items to fill your cart, then scroll" : cash() >= 0.34 ? `${fmt(cash())} left: keep shopping, or scroll and we'll fill the rest ↓` : "Now scroll down to start the clock ↓")
      : next ? `Keep scrolling · next: ${next.date.slice(0, 4)} ${next.title}` : "Keep scrolling · almost today";
  }
  function showHint() {
    const d = dNow();
    if (d < -5 || S.t >= END - 0.02 || playing || d > TOTAL_VH) return;
    set($("#hintText"), hintText());
    hint.classList.add("show");
  }
  setInterval(() => { if (hint.classList.contains("show")) set($("#hintText"), hintText()); }, 250);
  addEventListener("scroll", () => { hint.classList.remove("show"); clearTimeout(idle); idle = setTimeout(showHint, 1400); }, { passive: true });
  setTimeout(showHint, 2500);

  /* ================= autoplay ================= */
  const playBtn = $("#playBtn");
  let playing = false, raf = 0;
  function play() {
    if (S.shopMode) { if (!S.units.length) surprise(); scrollTo({ top: jTop + ((SHOP_VH + 1) / 100) * vh }); }
    playing = true; playBtn.classList.add("on");
    $(".pi", playBtn).textContent = "❚❚"; $(".pl", playBtn).textContent = "Pause";
    let last = performance.now();
    const pxs = ((TOTAL_VH - SHOP_VH) / 100) * vh / 30;
    const step = (now) => {
      if (!playing) return;
      const dt = Math.min(50, now - last); last = now;
      scrollBy(0, (pxs * dt) / 1000);
      if (S.t >= END - 0.001) return stop();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function stop() {
    playing = false; cancelAnimationFrame(raf); playBtn.classList.remove("on");
    $(".pi", playBtn).textContent = "▶"; $(".pl", playBtn).textContent = "Auto-play";
  }
  const endEl0 = document.getElementById("end");
  // if you arrive at the receipt early (e.g. the time is still catching up), build it as soon as time lands
  setInterval(() => {
    if (!endEl0.classList.contains("in") && S.units.length && S.t >= END - 0.01 && endEl0.getBoundingClientRect().top < innerHeight * 0.75) {
      buildEnd(); endEl0.classList.add("in"); TT.sound.tear();
    }
  }, 300);
  playBtn.addEventListener("click", () => (playing ? stop() : play()));
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((e) => addEventListener(e, (ev) => { if (playing && !(ev.target && ev.target.closest && ev.target.closest("#playBtn"))) stop(); }, { passive: true }));

  /* ================= sound ================= */
  $("#soundBtn").addEventListener("click", (e) => {
    const on = TT.sound.toggle();
    e.currentTarget.innerHTML = on ? "🔊 <span>Sound on</span>" : "🔇 <span>Sound off</span>";
    e.currentTarget.setAttribute("aria-pressed", String(on));
    if (on) TT.sound.kaching();
  });

  /* ================= ending ================= */
  const endEl = $("#end");
  function buildEnd() {
    const groups = {};
    for (const u of S.units) groups[u.id] = (groups[u.id] || 0) + 1;
    const rows = Object.entries(groups).sort((a, b) => b[1] - a[1]);
    const then = S.units.reduce((s, u) => s + price(u.id, T0), 0);
    const now = S.units.reduce((s, u) => s + price(u.id, END), 0);
    const c = cartAt(END);
    const kept = S.units.filter((u) => c.kept.has(u.uid)).length;
    const h1980 = then / TT.minWage(T0), hNow = now / TT.minWage(END);
    S.result = { rows, then, now, kept, total: S.units.length, h1980, hNow };
    $("#finalReceipt").innerHTML = `
      <div class="p-head"><b>TIME-MART</b><span>RECEIPT · JAN 1980 → NOV 2026</span></div>
      <div class="p-row p-th"><span>QTY ITEM</span><span>1980</span><span>NOW</span></div>
      ${rows.map(([id, n]) => `<div class="p-row"><span>${n} × ${byId[id].emoji} ${byId[id].name}</span><span>${fmt(n * price(id, T0))}</span><span class="up">${fmt(n * price(id, END))}</span></div>`).join("")}
      <div class="p-row p-total"><span>TOTAL</span><span>${fmt(then)}</span><span class="up">${fmt(now)}</span></div>
      <div class="p-row"><span>HOURS AT MIN. WAGE</span><span>${h1980.toFixed(1)} h</span><span>${hNow.toFixed(1)} h</span></div>
      <div class="p-foot">With the same $100 bill today you keep <b>${kept} of ${S.units.length}</b> items.<br>THANK YOU FOR SHOPPING THROUGH TIME</div>
      ${S.born ? `<div class="p-born">${bornLine(then, now)}</div>` : ""}
      <div class="p-ai">✨ Penny suggests: have you considered bananas?</div>`;
    const pct = Math.round((kept / S.units.length) * 100);
    $("#endHero").innerHTML = `<p class="eh-big">Your $100 now keeps <b>${kept}</b> of <b>${S.units.length}</b> items.</p><p class="eh-sub">Same bill, same groceries, 46 years later: it buys <b>${pct}%</b> of what it bought in 1980.</p>`;
    endEl.inert = false;
    $("#verdict").innerHTML = `Your 1980 cart now costs <b>${fmt(now)}</b>. That's <b>${(now / then).toFixed(1)}×</b> more, or <b>${hNow.toFixed(1)} hours</b> of minimum-wage work instead of ${h1980.toFixed(1)}.`;
  }
  new IntersectionObserver((es) => {
    document.body.classList.toggle("at-end", es[0].isIntersecting);
    if (es[0].isIntersecting) { cursorEl.classList.remove("show"); }
    if (es[0].isIntersecting && S.units.length && S.t >= END - 0.01) {
      buildEnd();
      endEl.classList.add("in");
      TT.sound.tear();
    }
  }, { threshold: 0.25 }).observe(endEl);

  function bornLine() {
    const b = Math.max(START, S.born + 0.5);
    const atBirth = S.units.reduce((s, u) => s + price(u.id, b), 0);
    const now = S.units.reduce((s, u) => s + price(u.id, END), 0);
    return S.born >= START
      ? `Since you were born in ${S.born}, this cart went from ${fmt(atBirth)} to ${fmt(now)} (${(now / atBirth).toFixed(1)}×).`
      : `You were ${1980 - S.born} when you filled this cart. Today you're ${2026 - S.born}.`;
  }
  function receiptPNG() {
    const r = S.result;
    const pct = Math.round((r.kept / r.total) * 100);
    const EMO = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
    const W = 720, rowH = 34;
    const H = 420 + r.rows.length * rowH + (S.born ? 40 : 0);
    const c = document.createElement("canvas");
    c.width = W * 2; c.height = H * 2;
    const g = c.getContext("2d");
    g.scale(2, 2);
    // background card
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0f0c1d"); bg.addColorStop(1, "#1d1036");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // headline
    g.textAlign = "center"; g.fillStyle = "#fff";
    g.font = `800 34px Inter, ${EMO}, sans-serif`;
    g.fillText(`My $100 now keeps ${r.kept} of ${r.total} items.`, W / 2, 62);
    g.font = `500 17px Inter, ${EMO}, sans-serif`; g.fillStyle = "#c9b8ff";
    g.fillText(`Same cart, 1980 → 2026: ${fmt(r.then)} → ${fmt(r.now)}  (${(r.now / r.then).toFixed(1)}×, ${pct}% left)`, W / 2, 94);
    // paper
    const px = 60, pw = W - 120, py = 122, ph = H - 190;
    g.fillStyle = "#fbfaf4"; g.fillRect(px, py, pw, ph);
    g.fillStyle = "#1d1036";
    for (let x = px; x < px + pw; x += 16) { g.beginPath(); g.moveTo(x, py + ph); g.lineTo(x + 8, py + ph - 10); g.lineTo(x + 16, py + ph); g.fill(); }
    g.fillStyle = "#1b1b1f"; g.font = `800 28px "JetBrains Mono", monospace`; g.fillText("TIME-MART", W / 2, py + 44);
    g.font = `500 13px "JetBrains Mono", monospace`; g.fillStyle = "#666"; g.fillText("RECEIPT · JAN 1980 → NOV 2026", W / 2, py + 66);
    let y = py + 104;
    const col1 = px + 24, col2 = px + pw - 150, col3 = px + pw - 24;
    g.font = `600 13px "JetBrains Mono", monospace`; g.fillStyle = "#888";
    g.textAlign = "left"; g.fillText("QTY ITEM", col1, y); g.textAlign = "right"; g.fillText("1980", col2, y); g.fillText("2026", col3, y);
    y += rowH;
    for (const [id, n] of r.rows) {
      g.font = `500 17px "JetBrains Mono", ${EMO}, monospace`; g.fillStyle = "#222";
      g.textAlign = "left"; g.fillText(`${n} × ${byId[id].emoji} ${byId[id].name}`, col1, y);
      g.textAlign = "right"; g.fillText(fmt(n * price(id, T0)), col2, y);
      g.fillStyle = "#c0262d"; g.fillText(fmt(n * price(id, END)), col3, y);
      y += rowH;
    }
    g.fillStyle = "#222"; g.fillRect(col1, y - 22, col3 - col1, 2);
    g.font = `800 19px "JetBrains Mono", monospace`;
    g.textAlign = "left"; g.fillText("TOTAL", col1, y + 4); g.textAlign = "right"; g.fillText(fmt(r.then), col2, y + 4);
    g.fillStyle = "#c0262d"; g.fillText(fmt(r.now), col3, y + 4);
    y += 36;
    g.font = `500 15px "JetBrains Mono", monospace`; g.fillStyle = "#444";
    g.textAlign = "left"; g.fillText("HOURS AT MIN. WAGE", col1, y); g.textAlign = "right"; g.fillText(`${r.h1980.toFixed(1)} h`, col2, y); g.fillText(`${r.hNow.toFixed(1)} h`, col3, y);
    y += 40; g.textAlign = "center";
    if (S.born) { g.font = `500 14px Inter, sans-serif`; g.fillStyle = "#5a4500"; g.fillText(bornLine(), W / 2, y); y += 30; }
    g.font = `600 14px "JetBrains Mono", monospace`; g.fillStyle = "#666"; g.fillText("THANK YOU FOR SHOPPING THROUGH TIME", W / 2, y);
    // footer link
    g.font = `600 15px Inter, sans-serif`; g.fillStyle = "#c9b8ff";
    g.fillText("Try yours → supersunny7.github.io/your-100", W / 2, H - 28);
    return c;
  }
  $("#dlBtn").addEventListener("click", () => {
    if (!S.result) buildEnd();
    const url = receiptPNG().toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = "my-100-dollar-receipt.png";
    document.body.appendChild(a); a.click(); a.remove();
    $("#endNote").textContent = "If nothing downloaded, your browser blocked it. Try 'Copy my result' instead.";
  });
  $("#copyBtn").addEventListener("click", async () => {
    if (!S.result) buildEnd();
    const r = S.result;
    const text = `In 1980 my $100 bought ${r.total} things. Today that cart costs ${fmt(r.now)} (${(r.now / r.then).toFixed(1)}×), and $100 only keeps ${r.kept} of them. #YourHundred`;
    try { await navigator.clipboard.writeText(text); $("#endNote").textContent = "Copied!"; }
    catch (e) { $("#endNote").textContent = text; }
  });
  $("#againBtn").addEventListener("click", () => {
    for (const u of S.units.concat(S.agent.extra)) cart.remove(u, false);
    S.units = []; S.agent = { applied: false, undone: false, fav: null, extra: [] };
    for (const uid of [...S.lines.keys()]) dropLine(uid);
    agentBar.hidden = true;
    document.body.classList.remove("agent-on");
    endEl.classList.remove("in"); endEl.inert = true;
    S.dipT = 0; S.holding = null; S.ended = false; S.result = null; queue.length = 0;
    $("#endNote").textContent = "";
    shopUI();
    snapNext = true;
    scrollTo({ top: 0, behavior: "auto" });
  });

  /* ================= the birth-year gate ================= */
  const gate = $("#gate"), gateInput = $("#gateInput"), gateHint = $("#gateHint");
  gateInput.addEventListener("input", () => { gateInput.value = gateInput.value.replace(/\D/g, "").slice(0, 4); });
  setTimeout(() => gateInput.focus(), 300);
  gate.addEventListener("click", (e) => { if (!e.target.closest("button")) gateInput.focus(); });
  $("#gateForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const y = parseInt(gateInput.value, 10);
    if (!(y >= 1920 && y <= 2026)) {
      gateHint.textContent = "PLEASE ENTER A YEAR BETWEEN 1920 AND 2026";
      gateHint.classList.add("err");
      gateInput.value = "";
      return;
    }
    S.born = y;
    buildLife(y);
    gateHint.classList.remove("err");
    gateHint.textContent = y >= 2026 ? "LOADING. WELCOME, NEWBORN..." : y >= START ? `LOADING ${2026 - y} YEAR${2026 - y > 1 ? "S" : ""} OF YOUR LIFE...` : "LOADING YOUR LIFE...";
    TT.sound.buy();
    setTimeout(() => {
      gate.classList.add("off");
      document.body.classList.remove("gated");
      snapNext = true;
      scrollTo({ top: 0 });
      setTimeout(() => gate.remove(), 450);
    }, reduce ? 0 : 220);
  });

  shopUI();
  requestAnimationFrame((n) => { lastNow = n; frame(n); });
})();
