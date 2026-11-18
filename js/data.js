/*
 * $100 Through Time: data
 * Time is continuous: t = year + fraction (2022.91 = Nov 30, 2022).
 *
 * Groceries + gas: BLS Average Price Data via FRED, annual averages (placed at mid-year,
 *   interpolated between years). 2026 = average of Jan–Oct 2026.
 * Stamps, NYC fares, minimum wage: exact dates of each change.
 * Movie tickets and tuition: interpolated between published survey years (approximate).
 */
window.TT = window.TT || {};

TT.START = 1980;
TT.END = 2026.88; // mid-November 2026, "today"

/** "2022-11-30" -> 2022.91 */
TT.d = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  const start = Date.UTC(y, 0, 1), next = Date.UTC(y + 1, 0, 1);
  return y + (Date.UTC(y, m - 1, d) - start) / (next - start);
};

const annual = (from, values) => {
  const o = {};
  values.forEach((v, i) => { if (v != null) o[from + i] = v; });
  return o;
};

// milk: half-gallon series x2 until 1995, gallon series from 1996
const milkHalf = [1.049, 1.117, 1.125, 1.128, 1.127, 1.134, 1.114, 1.137, 1.164, 1.269, 1.424, 1.369, 1.391, 1.394, 1.440, 1.429];
const milkGal = [2.623, 2.614, 2.704, 2.843, 2.781, 2.884, 2.757, 2.761, 3.156, 3.187, 3.081, 3.503, 3.795, 3.109, 3.259, 3.572, 3.493, 3.462, 3.694, 3.419, 3.204, 3.226, 2.896, 3.036, 3.318, 3.545, 4.091, 4.027, 3.984, 4.067, 4.16];

TT.ITEMS = [
  { id: "eggs", emoji: "🥚", name: "Eggs", unit: "dozen", ascii: "EGG", kind: "annual",
    a: annual(1980, [0.844, 0.899, 0.867, 0.894, 1.005, 0.804, 0.870, 0.783, 0.790, 0.998, 1.014, 0.989, 0.860, 0.911, 0.863, 0.925, 1.106, 1.058, 1.037, 0.959, 0.914, 0.929, 1.032, 1.244, 1.340, 1.218, 1.306, 1.676, 1.987, 1.664, 1.660, 1.770, 1.838, 1.910, 2.019, 2.469, 1.684, 1.467, 1.742, 1.396, 1.506, 1.674, 2.857, 2.796, 3.172, 4.252, 2.31]) },
  { id: "bread", emoji: "🍞", name: "White bread", unit: "lb", ascii: "BRD", kind: "annual",
    a: annual(1980, [0.509, 0.525, 0.532, 0.542, 0.541, 0.553, 0.565, 0.547, 0.613, 0.666, 0.695, 0.710, 0.750, 0.752, 0.761, 0.791, 0.876, 0.872, 0.860, 0.887, 0.930, 0.999, 1.016, 1.001, 0.969, 1.040, 1.081, 1.207, 1.366, 1.387, 1.373, 1.445, 1.418, 1.407, 1.401, 1.441, 1.371, 1.333, 1.286, 1.298, 1.452, 1.524, 1.700, 1.960, 1.970, 1.870, 1.84]) },
  { id: "milk", emoji: "🥛", name: "Whole milk", unit: "gallon", ascii: "MLK", kind: "annual",
    a: annual(1980, [...milkHalf.map((v) => +(v * 2).toFixed(3)), ...milkGal]) },
  { id: "bananas", emoji: "🍌", name: "Bananas", unit: "lb", ascii: "BAN", kind: "annual",
    a: annual(1980, [0.342, 0.362, 0.354, 0.386, 0.359, 0.367, 0.385, 0.365, 0.418, 0.449, 0.463, 0.481, 0.458, 0.439, 0.462, 0.490, 0.490, 0.487, 0.494, 0.491, 0.501, 0.507, 0.508, 0.509, 0.495, 0.492, 0.500, 0.510, 0.609, 0.611, 0.580, 0.610, 0.602, 0.600, 0.598, 0.583, 0.573, 0.563, 0.574, 0.574, 0.578, 0.600, 0.637, 0.630, 0.620, 0.647, 0.65]) },
  { id: "coffee", emoji: "☕", name: "Ground coffee", unit: "lb", ascii: "COF", kind: "annual",
    a: annual(1980, [3.143, 2.527, 2.524, 2.466, 2.578, 2.581, 3.433, 2.785, 2.769, 3.073, 2.966, 2.809, 2.577, 2.472, 3.401, 4.038, 3.430, 4.111, 3.765, 3.427, 3.450, 3.093, 2.924, 2.916, 2.849, 3.263, 3.203, 3.469, null, 3.669, 3.906, 5.191, 5.676, 5.453, 4.990, 4.720, 4.393, 4.453, 4.302, 4.141, 4.433, 4.705, 5.891, 6.156, 6.322, 8.180, 9.43]) },
  { id: "gas", emoji: "⛽", name: "Gasoline", unit: "gallon", ascii: "GAS", kind: "annual",
    a: annual(1980, [1.245, 1.378, 1.296, 1.241, 1.212, 1.202, 0.927, 0.948, 0.946, 1.022, 1.164, 1.140, 1.127, 1.108, 1.112, 1.147, 1.231, 1.234, 1.059, 1.165, 1.510, 1.461, 1.358, 1.591, 1.880, 2.295, 2.589, 2.801, 3.266, 2.350, 2.788, 3.527, 3.644, 3.526, 3.367, 2.448, 2.142, 2.408, 2.735, 2.636, 2.174, 3.051, 4.094, 3.658, 3.449, 3.257, 4.02]) },
  { id: "movie", emoji: "🎟️", name: "Movie ticket", unit: "avg.", ascii: "MOV", kind: "anchors",
    a: { 1980: 2.69, 1990: 4.23, 2000: 5.39, 2010: 7.89, 2020: 9.18, 2025: 11.31 } },
  { id: "stamp", emoji: "✉️", name: "Postage stamp", unit: "1st class", ascii: "STP", kind: "steps",
    a: [["1978-05-29", 0.15], ["1981-03-22", 0.18], ["1981-11-01", 0.20], ["1985-02-17", 0.22], ["1988-04-03", 0.25], ["1991-02-03", 0.29], ["1995-01-01", 0.32], ["1999-01-10", 0.33], ["2001-01-07", 0.34], ["2002-06-30", 0.37], ["2006-01-08", 0.39], ["2007-05-14", 0.41], ["2008-05-12", 0.42], ["2009-05-11", 0.44], ["2012-01-22", 0.45], ["2013-01-27", 0.46], ["2014-01-26", 0.49], ["2016-04-10", 0.47], ["2017-01-22", 0.49], ["2018-01-21", 0.50], ["2019-01-27", 0.55], ["2021-08-29", 0.58], ["2022-07-10", 0.60], ["2023-01-22", 0.63], ["2023-07-09", 0.66], ["2024-01-21", 0.68], ["2024-07-14", 0.73], ["2025-07-13", 0.78], ["2026-07-12", 0.82]] },
  { id: "subway", emoji: "🚇", name: "NYC subway", unit: "single ride", ascii: "SUB", kind: "steps",
    a: [["1975-09-01", 0.50], ["1980-06-28", 0.60], ["1981-07-03", 0.75], ["1984-01-02", 0.90], ["1986-01-01", 1.00], ["1990-01-01", 1.15], ["1992-01-01", 1.25], ["1995-11-12", 1.50], ["2003-05-04", 2.00], ["2009-06-28", 2.25], ["2013-03-03", 2.50], ["2015-03-22", 2.75], ["2023-08-20", 2.90], ["2026-01-04", 3.00]] }
];

TT.MINWAGE = [["1980-01-01", 3.10], ["1981-01-01", 3.35], ["1990-04-01", 3.80], ["1991-04-01", 4.25], ["1996-10-01", 4.75], ["1997-09-01", 5.15], ["2007-07-24", 5.85], ["2008-07-24", 6.55], ["2009-07-24", 7.25]];

// public 4-year in-state tuition & fees (academic year starting that fall); interpolated between these
TT.TUITION = { 1980: 804, 1990: 1908, 2000: 3508, 2010: 7605, 2020: 10560, 2025: 11950 };

// the "hot gadget" on display, from its launch date
TT.GADGETS = [
  ["1980-01-01", { emoji: "📼", name: "Sony Walkman", price: 200, note: "arrives in the U.S. June 1980" }],
  ["1989-07-31", { emoji: "🎮", name: "Game Boy", price: 89.99, note: "U.S. launch price" }],
  ["2000-10-26", { emoji: "🕹️", name: "PlayStation 2", price: 299, note: "U.S. launch price" }],
  ["2007-06-29", { emoji: "📱", name: "iPhone", price: 499, note: "the first one, 4GB" }],
  ["2020-10-23", { emoji: "📱", name: "iPhone", price: 799, note: "base model" }],
  ["2026-09-01", { emoji: "📱", name: "iPhone 17", price: 899, note: "after Apple's price rise" }]
];

// CPI-U annual averages (2026 = Jan–Oct)
TT.CPI = {
  1979: 72.6, 1980: 82.4, 1981: 90.9, 1982: 96.5, 1983: 99.6, 1984: 103.9,
  1985: 107.6, 1986: 109.6, 1987: 113.6, 1988: 118.3, 1989: 124.0, 1990: 130.7,
  1991: 136.2, 1992: 140.3, 1993: 144.5, 1994: 148.2, 1995: 152.4, 1996: 156.9,
  1997: 160.5, 1998: 163.0, 1999: 166.6, 2000: 172.2, 2001: 177.1, 2002: 179.9,
  2003: 184.0, 2004: 188.9, 2005: 195.3, 2006: 201.6, 2007: 207.3, 2008: 215.3,
  2009: 214.5, 2010: 218.1, 2011: 224.9, 2012: 229.6, 2013: 233.0, 2014: 236.7,
  2015: 237.0, 2016: 240.0, 2017: 245.1, 2018: 251.1, 2019: 255.7, 2020: 258.8,
  2021: 271.0, 2022: 292.7, 2023: 304.7, 2024: 313.7, 2025: 321.9, 2026: 332.8
};

/* ---------- moments on the timeline ---------- */
TT.MOMENTS = [
  ["1980-01-02", "start", "Your trip begins", "You have one $100 bill. Scroll to move forward in time."],
  ["1980-06-15", "gadget", "Sony Walkman", "The cassette Walkman reaches U.S. stores for $200. Two of your bills."],
  ["1980-12-01", "money", "Inflation: 13.5%", "Prices rose 13.5% this year. Your cart is already shrinking."],
  ["1987-10-19", "money", "Black Monday", "The Dow falls 22.6% in a single day."],
  ["1989-07-31", "gadget", "Game Boy: $89.99", "The first gadget that fits inside your $100."],
  ["1991-08-06", "web", "The Web goes public", "The World Wide Web opens to everyone. Pages are grey."],
  ["1995-08-09", "web", "Netscape IPO", "The dot-com boom begins."],
  ["2000-03-10", "money", "Dot-com peak", "Tech stocks top out, then crash."],
  ["2000-10-26", "gadget", "PlayStation 2: $299", "Three bills."],
  ["2007-06-29", "gadget", "The first iPhone: $499", "The web moves into your pocket."],
  ["2008-09-15", "money", "Lehman collapses", "The global financial crisis."],
  ["2009-07-24", "money", "Minimum wage: $7.25", "It still hasn't changed in 2026."],
  ["2020-03-11", "money", "Pandemic", "COVID-19 shuts the world down. Gas gets cheap for a while."],
  ["2022-06-15", "money", "Inflation: 9.1%", "The fastest price rise in 40 years."],
  ["2022-11-30", "ai", "ChatGPT launches", "AI goes mainstream. Something new appears in the corner of your screen."],
  ["2023-03-14", "ai", "GPT-4", "Text starts arriving one word at a time. Everywhere."],
  ["2024-06-01", "ai", "✨ AI buttons everywhere", "Every app adds a sparkle. Inputs start finishing your sentences."],
  ["2025-03-01", "money", "Eggs: $6.23 a dozen", "Bird flu sends egg prices to a record."],
  ["2025-09-01", "ai", "AI agents", "Software starts clicking things for you. Watch your cart."],
  ["2026-01-04", "money", "Subway: $3.00", "A NYC subway ride crosses $3 for the first time."],
  ["2026-07-12", "money", "Stamps: 82¢", "Up from 15¢ when you started."],
  ["2026-09-01", "gadget", "iPhone 17: $899", "Apple raises the price by $100. Nine of your bills."],
  ["2026-11-18", "ai", "Today", "Your $100 has arrived. Someone wants to talk to you."]
].map(([date, kind, title, text]) => ({ t: TT.d(date), date, kind, title, text }));

TT.CHATGPT = TT.d("2022-11-30");
TT.AI_FULL = 2026.45;

/* ---------- lookups at continuous time t ---------- */
const lerp = (a, b, k) => a + (b - a) * k;

function fromAnnual(map, t) {
  const years = Object.keys(map).map(Number).sort((a, b) => a - b);
  const x = t - 0.5;
  if (x <= years[0]) return map[years[0]];
  if (x >= years[years.length - 1]) return map[years[years.length - 1]];
  for (let i = 0; i < years.length - 1; i++) {
    const a = years[i], b = years[i + 1];
    if (x >= a && x <= b) return lerp(map[a], map[b], (x - a) / (b - a));
  }
}
function fromAnchors(map, t) { // log-linear between anchor years
  const years = Object.keys(map).map(Number).sort((a, b) => a - b);
  const x = t - 0.5;
  if (x <= years[0]) return map[years[0]];
  if (x >= years[years.length - 1]) return map[years[years.length - 1]];
  for (let i = 0; i < years.length - 1; i++) {
    const a = years[i], b = years[i + 1];
    if (x >= a && x <= b) return Math.exp(lerp(Math.log(map[a]), Math.log(map[b]), (x - a) / (b - a)));
  }
}
function fromSteps(steps, t) {
  let v = steps[0][1];
  for (const [date, val] of steps) if (t >= TT.d(date)) v = val;
  return v;
}

TT.price = (id, t) => {
  const it = TT.ITEMS.find((i) => i.id === id);
  if (it.kind === "annual") return fromAnnual(it.a, t);
  if (it.kind === "anchors") return fromAnchors(it.a, t);
  return fromSteps(it.a, t);
};
TT.cpi = (t) => fromAnnual(TT.CPI, t);
TT.minWage = (t) => fromSteps(TT.MINWAGE, t);
TT.tuition = (t) => fromAnchors(TT.TUITION, t);
TT.gadget = (t) => {
  let g = TT.GADGETS[0][1];
  for (const [date, val] of TT.GADGETS) if (t >= TT.d(date)) g = val;
  return g;
};
TT.momentAt = (t) => {
  let m = null;
  for (const mo of TT.MOMENTS) if (mo.t <= t + 0.0001) m = mo;
  return m;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
TT.monthLabel = (t) => MONTHS[Math.min(11, Math.floor((t % 1) * 12))];

TT.FACTS = {
  eggsPeak: "Egg prices hit a record $6.23 a dozen in March 2025 during a bird-flu outbreak. The 2025 average was $4.25; by 2026 it's back near $2.30.",
  coffee: "Ground coffee averaged $4.43/lb in 2020, $8.18 in 2025, and about $9.43 so far in 2026.",
  iphone: "Apple raised the iPhone 17 from $799 to $899 in September 2026.",
  stamp: "A stamp went from 15¢ in 1980 to 82¢ in July 2026.",
  subway: "The NYC subway fare crossed $3 for the first time on January 4, 2026.",
  minwage: "The federal minimum wage has been $7.25 an hour since July 2009."
};
