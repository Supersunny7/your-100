# 💵 Your $100

**It's 1980 and you have $100. Fill a shopping cart, then scroll through 46 years of real U.S. prices and watch inflation (and then AI) take it apart.**

Built for the BuildyourOwnWebsite Hackathon 2026 (Devpost).

## How it works
0. **What year were you born?** A 1980 terminal asks one question before anything else. Your birth year becomes part of the timeline: a full-screen "You were born" moment, life milestones (first grade, 13, 16, 18, 21, today) with real prices from that year, a "your life" band on the progress bar, and a line on your final receipt.
1. **Shop in 1980.** Tap real 1980 groceries into a physics cart (or "Fill it for me").
2. **Start the clock.** Scrolling moves time forward, month by month. Every time your $100 can't cover the cart anymore, an item flies out of it with a *ka-ching*, and a thermal receipt prints what you lost and when. Your $100 bill burns at the exact rate the dollar lost value (CPI).
3. **History happens.** Black Monday, the dot-com crash, Lehman, the pandemic: full-screen moments, each showing how much of your cart is left.
4. **Nov 30, 2022: ChatGPT launches.** From here on, the page slowly turns into an AI product: sparkles, an "AI-optimized receipt", and in 2025 an AI shopping agent ("Penny") takes your cursor, deletes the item you bought the most of, fills your cart with bananas and charges a service fee. You can hit **Undo**.
5. **The receipt.** It ends with a printed receipt comparing 1980 and today, plus the same cart in hours of minimum-wage work. Download it as a PNG or copy your result.

The page itself also drifts through web-design history as time passes: green CRT, Windows 95, glossy Web 2.0, flat design, dark mode, and finally the AI look (on purpose, as parody).

**Era Lens:** the cart is rendered through a WebGL fragment shader that turns it into each era's display: a curved CRT tube with phosphor bloom and scanlines, 1990s pixels with ordered dithering, glossy 2000s plastic, and after ChatGPT a glitch and a constant "hallucination" (flowing warp, ghost copies, color fringing) that follows your cursor. Text stays crisp HTML.

## Data
- Eggs, white bread, whole milk, bananas, ground coffee, gasoline: BLS Average Price Data via FRED (annual averages 1980–2025; 2026 = Jan–Oct average), interpolated month to month.
- NYC subway fares: MTA fare history (each change on its real date). Movie tickets: NATO averages, interpolated between survey years.
- CPI-U for the burning bill; federal minimum wage for "hours of work".

## Tech
HTML, CSS and vanilla JavaScript, Matter.js for physics, a raw WebGL shader for the cart's era lens, Web Audio for synthesized sounds (no audio files). Eras are blended live with CSS custom properties.

## AI disclosure
Code and data research were done with help from Claude (Anthropic). "Penny" is scripted parody; no AI model is called.
