# Orbit Terminal — Live Demo Guide

A step-by-step script for showcasing Orbit Terminal to an audience. Follow each act in order for maximum impact.

---

## Before the Demo

- **Prerequisites**: Node.js 20+, npm, project cloned and `npm install` done
- **Start the app**: `npm run dev`
- **Open** http://localhost:5173 in a browser (Chrome recommended for best Web Crypto API support)
- Use a large screen or external monitor for best visual impact
- Have the browser at full screen or near-full screen
- Recommended: Use dark mode (default) for the terminal aesthetic
- Optional: Pre-configure API keys (Finnhub, Alpha Vantage, FMP) for live data. If not, demo mode works great.

---

## Demo Flow (~15 minutes)

### Act 1: First Impression (2 min)

**What to show**: The vault login screen

**Talking points**:

- "This is Orbit Terminal — a secure financial dashboard I built with React 19, Express, and SQLite."
- "Notice the first thing you see is a security gate — not the dashboard. Security is a first-class citizen."
- Click **"Try Demo"** to enter demo mode.
- "Demo mode seeds realistic data so you can explore without any API keys."

> 💡 Pause for a moment on the login screen before clicking — let the audience absorb the vault-first design.

---

### Act 2: The Workspace (3 min)

**What to show**: The 4-slot grid with pre-populated tickers (AAPL, MSFT, GOOGL, TSLA)

**Talking points**:

- "Four independent chart slots, each showing a different ticker."
- Drag the dividers to resize slots — "Fully resizable 2×2 grid with CSS Grid and mouse drag."
- Click on a slot, type a new ticker (e.g., NVDA) — "Live ticker search with autocomplete."
- Toggle between candlestick and line chart modes.
- Change time ranges (1W, 1M, 3M, 6M, 1Y, 5Y).
- Show the fundamentals sidebar (P/E, ROE, EPS, etc.) — "Key ratios fetched via multi-provider fallback chain."
- Show the news tab in a slot.
- Drag and drop to rearrange slots.
- "All workspace state persists in SQLite — refresh the page and everything is exactly where you left it."

> 💡 Resize the grid early — it's a visual wow moment that immediately shows this isn't a toy project.

---

### Act 3: Command Palette & Navigation (2 min)

**What to show**: Press `⌘K` (or `Ctrl+K`)

**Talking points**:

- "Command palette powered by cmdk — search tickers, navigate views, trigger actions."
- Type a ticker name to search — show results with exchange info.
- Select a ticker to load it in the active slot.
- Show navigation commands: Portfolio, Trade Journal, Data Explorer, etc.
- Show action commands: Toggle Layout, Toggle Theme, Export Workspace.
- "9 keyboard shortcuts for power users" — briefly mention `⌘W` (watchlist), `⌘A` (alerts), `⌘Z` (zen mode).

> 💡 Use the command palette frequently throughout the rest of the demo — it shows polish and power-user UX.

---

### Act 4: Technical Indicators (1 min)

**What to show**: Click the indicators button on a slot

**Talking points**:

- Toggle on SMA(20), RSI(14), MACD.
- "All computed client-side using the trading-signals library — no server round-trip."
- "RSI color-coded: red above 70 (overbought), green below 30 (oversold)."
- "Bollinger Bands show volatility envelope."

> 💡 Toggle indicators on and off quickly to show responsiveness — the instant rendering reinforces the client-side computation story.

---

### Act 5: Portfolio & Journal (2 min)

**What to show**: Navigate to Portfolio view (via nav bar or `⌘K`)

**Talking points**:

- "Pre-populated with 5 holdings — live P&L calculation against current prices."
- Show the transaction log — "Full buy/sell history with weighted average cost basis."
- Navigate to Trade Journal.
- "Track open and closed trades with entry/exit prices, thesis, and auto P&L."
- Show a closed trade with calculated profit/loss.
- "Export everything as CSV or styled PDF" — click the export button.

> 💡 Hover over the summary cards (total value, gain/loss) to let the audience read the numbers. The pre-seeded data tells a realistic story.

---

### Act 6: Data Explorer (2 min)

**What to show**: Navigate to Data Explorer

**Talking points**:

- **Crypto tab**: "Top 50 cryptocurrencies from CoinGecko — no API key needed."
- **Forex tab**: "Live exchange rates from Frankfurter — with a currency converter."
- **Social Sentiment tab**: "Reddit trending stocks from ApeWisdom."
- "Three of these five tabs work without any API keys — all free-tier compatible."
- If you have a Finnhub key: show Insider Trading and Economic Calendar tabs.

> 💡 Use the search filter on the Crypto tab and the currency converter on Forex — interactive elements keep the audience engaged.

---

### Act 7: Watchlist & Alerts (1 min)

**What to show**: Press `⌘W` to open watchlist panel

**Talking points**:

- "Slide-out panel with live prices, daily change %, and SVG sparklines."
- "Drag to reorder, bookmark button in each slot to quick-add."
- Press `⌘A` to show alerts.
- "Set price thresholds — visual notification when triggered."

> 💡 The sparklines in the watchlist are a subtle but impressive detail — point them out explicitly.

---

### Act 8: Security Deep Dive (2 min)

**What to show**: Exit demo mode, create a real vault

**Talking points**:

- "Let me show you the security model."
- Create a vault with a password.
- Open the API Key Manager.
- "Keys are encrypted client-side with AES-256-GCM before they ever leave the browser."
- "PBKDF2 with 600,000 iterations for key derivation — follows OWASP recommendations."
- "The server stores only ciphertext — zero-knowledge design."
- "Even if someone gets the database file, they can't read your API keys without your password."
- Lock the vault and unlock it again — "Keys are re-decrypted and re-synced to the server session."

> 💡 Save this for last — it's the most technically impressive part and leaves a strong final impression.

---

### Bonus: Zen Mode & Theme

- Press `⌘Z` — "Full-screen single chart, all chrome hidden."
- Toggle theme via command palette — "Dark terminal aesthetic by default, light mode available."

> 💡 Zen mode is a great visual closer if you have a few extra seconds.

---

## Impressive Talking Points

Keep these in your back pocket for Q&A or to weave into the demo naturally:

- "24 integrated features across 9 data providers, all free-tier compatible."
- "Zero-knowledge encryption — the server never sees your API keys in plaintext."
- "Multi-provider fallback chains — if one API is down, the next one kicks in automatically."
- "No external database — everything runs locally in a single SQLite file."
- "17 shadcn/ui components with a custom terminal theme using oklch color space."
- "69 tests across client and server."
- "The entire app is a monorepo with shared TypeScript types as the contract between frontend and backend."

---

## Common Questions & Answers

| Question | Answer |
|----------|--------|
| Why not use a real database? | SQLite is perfect for a single-user personal tool. Zero config, single file, WAL mode for concurrent reads. |
| Why client-side encryption? | Zero-knowledge design. The server never sees plaintext keys. Even a DB breach doesn't expose credentials. |
| Why no React Router? | Only 7 views, all accessible via nav bar and command palette. State-driven switching is simpler. |
| How do fallback chains work? | Each data endpoint tries providers in order (paid first, free fallback). Silent catch blocks enable graceful degradation. |
| What happens on server restart? | Client detects via boot ID polling (every 30s) and automatically re-syncs decrypted keys to the new server session. |
| Can multiple users use it? | No — single-user by design. One session token at a time. |

---

## Tips for a Great Demo

- **Start with demo mode** — it's pre-populated and impressive out of the box.
- **Resize the workspace grid early** — it's a visual wow moment.
- **Use the command palette frequently** — it shows polish and power-user UX.
- **Show the security model last** — it's the most technically impressive part.
- **If you have API keys configured**, show live news and earnings data.
- **Keep the terminal dark theme** — it looks more professional.
- **Have a backup plan if Yahoo Finance is slow** — switch to a different ticker.
