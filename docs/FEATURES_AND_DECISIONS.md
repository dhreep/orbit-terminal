# Orbit Terminal — Salient Features & Design Decisions

A high-performance, secure financial dashboard for real-time market analysis. This document explains what Orbit Terminal does, and more importantly, *why* it was built the way it was.

---

## Table of Contents

- [Feature Highlights](#feature-highlights)
- [Design Decisions](#design-decisions)
  - [1. Why React 19 (not Next.js, Remix, etc.)](#1-why-react-19-not-nextjs-remix-etc)
  - [2. Why No React Router](#2-why-no-react-router)
  - [3. Why SQLite (not PostgreSQL, MongoDB, etc.)](#3-why-sqlite-not-postgresql-mongodb-etc)
  - [4. Why Client-Side Encryption (Zero-Knowledge Vault)](#4-why-client-side-encryption-zero-knowledge-vault)
  - [5. Why Multi-Provider Fallback Chains](#5-why-multi-provider-fallback-chains)
  - [6. Why TanStack Query (not Redux, Zustand, etc.)](#6-why-tanstack-query-not-redux-zustand-etc)
  - [7. Why shadcn/ui (not Material UI, Ant Design, Chakra)](#7-why-shadcnui-not-material-ui-ant-design-chakra)
  - [8. Why Tailwind CSS v4 with oklch Colors](#8-why-tailwind-css-v4-with-oklch-colors)
  - [9. Why lightweight-charts (not D3, Recharts, Chart.js)](#9-why-lightweight-charts-not-d3-recharts-chartjs)
  - [10. Why Client-Side Technical Indicators](#10-why-client-side-technical-indicators)
  - [11. Why Single-User, Single-Session Design](#11-why-single-user-single-session-design)
  - [12. Why npm Workspaces (not Turborepo, Nx, Lerna)](#12-why-npm-workspaces-not-turborepo-nx-lerna)
  - [13. Why Demo Mode with Server-Side Seeding](#13-why-demo-mode-with-server-side-seeding)
  - [14. Why cmdk for Command Palette](#14-why-cmdk-for-command-palette)
- [Architectural Tradeoffs Summary](#architectural-tradeoffs-summary)

---

## Feature Highlights

Orbit Terminal ships 24 integrated features across 9 data providers, all free-tier compatible:

| # | Feature | Shortcut | Description |
|---|---------|----------|-------------|
| 1 | **Secure Vault** | — | AES-256-GCM encrypted API key storage via Web Crypto API. PBKDF2 (600K iterations) key derivation. Zero-knowledge — server never sees plaintext keys. Brute-force protection (5 attempts, 30s lockout). |
| 2 | **4-Slot Workspace** | — | Resizable 2×2 grid with draggable dividers, or Spotlight mode for a single focused chart. Drag-and-drop slot rearrangement. Workspace state persists in SQLite. Export/import as JSON. Backspace clears the active slot. |
| 3 | **Candlestick & Line Charts** | — | Interactive charts via TradingView's `lightweight-charts`. Time range selector: 1W, 1M, 3M, 6M, 1Y, 5Y. |
| 4 | **Technical Indicators** | — | Client-side computed via `trading-signals`. Toggleable per slot: SMA(20), EMA(12/26), RSI(14), MACD(12, 26, 9), Bollinger Bands(20, 2). |
| 5 | **Fundamental Analysis** | — | Key ratios: P/E, PEG, D/E, ROE, EPS, Beta, Market Cap, Dividend Yield, Current Ratio. 4-tier fallback chain: FMP → Alpha Vantage → Yahoo quoteSummary → Yahoo chart meta. |
| 6 | **Command Palette** | ⌘K | `cmdk`-powered search for tickers, navigation, and quick actions. Search bar callout in the nav bar. |
| 7 | **Watchlist** | ⌘W | Tracked tickers with live prices, daily change %, and SVG sparklines. Drag-and-drop reordering. Bookmark button per slot. Ticker autocomplete. |
| 8 | **Price Alerts** | ⌘A | Above/below price thresholds per ticker with autocomplete. Persistent in SQLite. Visual notification on trigger. |
| 9 | **News Feed** | — | Per-ticker news inline in each slot. Finnhub (primary) with Alpha Vantage fallback. |
| 10 | **Portfolio Tracker** | — | Holdings with live P&L. Transaction log with weighted average cost basis. Summary cards for total value, gain/loss, allocation. |
| 11 | **Trade Journal** | — | Open and closed trades with entry/exit prices, thesis (markdown), and outcome notes. Auto P&L on close. |
| 12 | **Earnings Calendar** | — | Upcoming earnings dates with timing badges (Before Open / After Close). Powered by Finnhub. |
| 13 | **Data Explorer** | — | Five tabs: Crypto (CoinGecko top 50), Forex (Frankfurter with converter), Insider Trading (Finnhub), Economic Calendar (Finnhub), Social Sentiment (ApeWisdom/Reddit). |
| 14 | **AI Chat** | ⌘I | BYOK LLM chat. Supports Groq (cloud, free tier) or Ollama (local, unlimited). API key stored in vault. |
| 15 | **Stock Screener** | — | Filter stocks by fundamental criteria with a dynamic filter builder. |
| 16 | **Correlation Matrix** | — | Pearson correlation between 2–6 tickers with color-coded table. Ticker autocomplete chips. |
| 17 | **CSV/PDF Export** | — | Export portfolio, trade journal, and watchlist as CSV or styled PDF (via jsPDF). |
| 18 | **Zen Mode** | ⌘Z | Full-screen single chart with all UI chrome hidden. |
| 19 | **Dark / Light Theme** | — | Toggle with persistence. Dark terminal aesthetic by default. |
| 20 | **Session Auth** | — | Bearer token authentication on all protected API routes. Brute-force protection on vault endpoints. |
| 21 | **NYSE Market Status** | — | Live open/closed indicator calculated from Eastern Time with UTC clock display. |
| 22 | **International Stock Support** | — | Suffixed ticker symbols (e.g., `RELIANCE.NS`, `TCS.BO`) for Indian and international exchanges. |
| 23 | **Ticker Autocomplete** | — | Unified autocomplete component used across all ticker input fields — watchlist, alerts, portfolio, journal, screener, correlation matrix. |
| 24 | **Demo Mode** | — | Click "Try Demo" to explore with pre-populated portfolio, trades, alerts, watchlist, and notes. No API keys required. |

---

## Design Decisions

### 1. Why React 19 (not Next.js, Remix, etc.)

Orbit Terminal is a single-page application (SPA) with no SEO requirements and no server-side rendering needs. It's a personal dashboard, not a content website.

- **React 19** is the latest stable release with improved performance characteristics
- **Vite** provides fast HMR and build times without the complexity of a meta-framework
- **No routing library needed** — the app has only 7 views (`terminal`, `portfolio`, `journal`, `explorer`, `earnings`, `screener`, `correlation`) managed by a simple `useState<AppView>` in `App.tsx`
- A meta-framework would add SSR, file-based routing, server components, and data loaders — none of which this app needs

**Tradeoff**: No URL-based routing means no deep linking, no browser back/forward navigation, and no shareable URLs. For a personal financial dashboard, this is acceptable.

### 2. Why No React Router

The entire app navigation is a single `currentView` state variable with 7 possible values. Every view is accessible from the nav bar and the command palette (⌘K).

- State-driven view switching is simpler and has zero bundle cost
- The app is a personal dashboard, not a multi-page website — there's nothing to bookmark
- Adding React Router would mean wrapping the app in a `<BrowserRouter>`, defining `<Route>` elements, and replacing `setCurrentView` with `navigate()` — all for no user-facing benefit

**Tradeoff**: Can't bookmark or share specific views. No browser history integration — the back button does nothing. If this ever becomes a multi-user tool, routing would need to be added.

### 3. Why SQLite (not PostgreSQL, MongoDB, etc.)

SQLite is the right database for a single-user local tool.

- **Zero configuration** — no database server to install, configure, or manage
- **Single file** (`orbit.db`) — easy to backup, move, or delete. The entire app state is one file
- **WAL mode** enabled via `db.pragma('journal_mode = WAL')` — concurrent reads without blocking
- **`better-sqlite3` is synchronous** — this simplifies Express route handlers significantly. No `async/await` for DB calls, no connection pools, no promise chains. A query is just `db.prepare('...').get()`
- **12 tables** cover all features: `vault`, `encrypted_keys`, `notes`, `settings`, `workspace`, `watchlist`, `price_alerts`, `holdings`, `transactions`, `trade_journal`, `fundamentals_cache`, `chat_history`
- The database auto-creates on first run — no migration scripts, no setup steps

**Tradeoff**: No multi-user support. No remote access. No replication. If the file is corrupted, there's no replica to fail over to. For a personal tool, these are non-issues.

### 4. Why Client-Side Encryption (Zero-Knowledge Vault)

API keys are sensitive credentials. They grant access to financial data providers and LLM services. They should never exist in plaintext on the server.

- **Web Crypto API** is built into all modern browsers — no external crypto library needed
- **AES-256-GCM** provides authenticated encryption (integrity + confidentiality in one operation)
- **PBKDF2 with 600K iterations** follows OWASP recommendations for key derivation — makes brute-force attacks computationally expensive
- The server is a **dumb storage layer for ciphertext** — it stores `{ciphertext, iv, salt}` blobs and never performs decryption
- Even if the SQLite database is compromised, the attacker gets only encrypted blobs that are useless without the master password
- On unlock, the client decrypts keys in the browser and sends them to the server's in-memory store (`Map<string, string>`) for API calls

**Tradeoff**: If the user forgets their master password, keys are **unrecoverable by design**. There's no "forgot password" flow — that would defeat the zero-knowledge property. Additionally, the server's in-memory key store is lost on restart, requiring the client to detect the restart (via boot ID polling) and re-sync keys.

### 5. Why Multi-Provider Fallback Chains

Free-tier API providers have strict rate limits, and any single provider can fail at any time.

- **Alpha Vantage**: 25 requests/day — exhausted quickly with active use
- **FMP**: 250 requests total (lifetime on free tier) — a hard ceiling
- **Yahoo Finance**: Free but unreliable, requires crumb-based authentication that can break
- **Finnhub**: 60 requests/minute — generous but still finite

Fallback chains ensure the app degrades gracefully instead of showing errors:

- **Candles**: Alpha Vantage → Yahoo Finance
- **Fundamentals** (deepest chain): In-memory cache (30min TTL) → FMP → Alpha Vantage OVERVIEW → Yahoo quoteSummary → Yahoo chart meta
- **Search**: FMP → Alpha Vantage SYMBOL_SEARCH → Yahoo Finance search
- **News**: Finnhub → Alpha Vantage

Each tier catches errors silently and falls through to the next provider. The last tier returns an empty result or a generic error.

**Tradeoff**: Silent `catch` blocks make debugging provider failures difficult. When data looks wrong, it's hard to know which provider served it. Data quality and field coverage varies between providers — FMP returns `currentRatio`, Yahoo quoteSummary returns `52WeekChange`, Alpha Vantage returns neither. The user sees whatever the first successful provider returns.

### 6. Why TanStack Query (not Redux, Zustand, etc.)

All server state in Orbit Terminal is fetched data — candle prices, fundamentals, news, watchlist items, portfolio holdings. TanStack Query is purpose-built for exactly this.

- **Built-in caching** with stale-while-revalidate — data appears instantly from cache while refetching in the background
- **Background refetching** keeps prices current without manual refresh
- **Retry logic** handles transient network failures automatically
- **No boilerplate** — no reducers, no actions, no action creators. Just `useQuery` and `useMutation`
- **Query invalidation** on mutations keeps the UI in sync — add a watchlist item, and the watchlist query automatically refetches

**Tradeoff**: Local-only state (workspace layout, active view, zen mode, panel open/closed) still uses `useState`, creating a split state model. This is intentional — TanStack Query manages server state, React state manages UI state. But it means there's no single state tree to inspect.

### 7. Why shadcn/ui (not Material UI, Ant Design, Chakra)

shadcn/ui is not a component library — it's a collection of copy-paste components that you own.

- **Full control over source code** — 17 component files live in `src/components/ui/` and can be modified freely. No fighting a library's API or waiting for upstream fixes
- **Built on Radix/base-ui primitives** for accessibility (keyboard navigation, ARIA attributes, focus management)
- **Tailwind CSS integration** — consistent with the rest of the styling approach, no CSS-in-JS runtime
- **Terminal aesthetic** achieved by setting all border radii to `0px` in the theme (`--radius-sm` through `--radius-4xl` all `0px`) and using an oklch gold/dark color palette
- The 17 primitives (badge, button, card, command, dialog, input, input-group, label, scroll-area, select, separator, sheet, switch, table, tabs, textarea, tooltip) cover all UI needs without bloat

**Tradeoff**: More manual work for complex components. There's no pre-built data table with sorting/filtering (though `@tanstack/react-table` is used), no date picker, no rich text editor. Each of these would need to be built or sourced separately.

### 8. Why Tailwind CSS v4 with oklch Colors

- **Utility-first CSS** eliminates context switching between component files and stylesheets. Styles are co-located with markup
- **oklch color space** provides perceptually uniform colors — a 10% lightness change looks the same across hues. This matters for dark themes where subtle contrast differences are visible. The entire palette (81 oklch values in `index.css`) is defined in this space
- **CSS custom properties** enable runtime theme switching without JavaScript — toggling the `.dark` class swaps all colors instantly
- **v4 uses CSS-native `@theme`** instead of a `tailwind.config.js` file — the design system is defined in CSS, not JavaScript

**Tradeoff**: oklch has limited browser support in older browsers (Safari 15.3 and below, pre-Chromium Edge). For a developer tool that targets modern browsers, this is a non-issue.

### 9. Why lightweight-charts (not D3, Recharts, Chart.js)

TradingView's `lightweight-charts` is purpose-built for financial charts.

- **Native candlestick and line series** — no plugins or extensions needed for the core chart types
- **Built-in crosshair, time scale, and price scale** — the interactive elements that make financial charts useful come out of the box
- **Tiny bundle size** compared to D3 (which is a general-purpose visualization toolkit, not a charting library)
- **Performance** — handles thousands of data points smoothly with canvas rendering

**Tradeoff**: Less flexible than D3 for custom visualizations. When the app needs a pie chart for portfolio allocation, `lightweight-charts` can't do it — Recharts is used instead. This means two charting libraries in the bundle, but each is used for what it does best.

### 10. Why Client-Side Technical Indicators

The `trading-signals` library computes SMA, EMA, RSI, MACD, and Bollinger Bands from raw candle data entirely in the browser.

- **No server round-trip** — computation happens on data already in memory from the candle fetch
- **Instant toggle** — users can enable/disable indicators per slot without refetching data
- **No server-side dependency** — the server doesn't need to know about indicators at all

**Tradeoff**: Computation happens on every render cycle. This is mitigated with `useMemo` to avoid recalculating when inputs haven't changed. For the data sizes involved (max ~1,300 daily candles for 5Y range), this is negligible.

### 11. Why Single-User, Single-Session Design

Orbit Terminal is a personal financial dashboard. Multi-user support would add complexity with no benefit.

- **Single in-memory session token** — `crypto.randomUUID()` generates a token on vault unlock, stored in a module-level variable. No JWT, no refresh tokens, no session store, no token rotation
- **Logging in from a second tab overwrites the first session** — `generateSessionToken()` replaces the previous token. The first tab's requests will start returning 401
- **In-memory API keys** — decrypted keys live in a `Map<string, string>` on the server. Fast access, zero persistence overhead
- **Boot ID polling** — the client polls `/api/health` and compares `bootId`. If the server restarted (new boot ID), the client knows its session and keys are gone and triggers re-authentication

**Tradeoff**: No collaboration. No sharing. No multi-device sync. No "remember me" across server restarts. The vault must be unlocked every time the server starts. For a personal tool running on `localhost`, this is the right simplicity tradeoff.

### 12. Why npm Workspaces (not Turborepo, Nx, Lerna)

The monorepo has exactly 3 packages: `@orbit/client`, `@orbit/server`, and `@orbit/shared`.

- **npm workspaces is built into npm** — zero additional tooling to install or configure
- **Simple dependency graph** — both client and server depend on shared, and that's it. No complex inter-package dependencies
- **Shared types consumed as raw TypeScript** — the `@orbit/shared` package exports TypeScript interfaces directly. In development, there's no build step for shared types — Vite and tsx resolve them directly
- `concurrently` runs client and server dev servers in parallel with a single `npm run dev`

**Tradeoff**: No incremental builds. No remote caching. No task orchestration. No dependency graph visualization. For a 3-package monorepo, these features would be pure overhead. If the project grew to 10+ packages, Turborepo would become worth the setup cost.

### 13. Why Demo Mode with Server-Side Seeding

Demo mode lets anyone try the app without API keys or vault setup.

- **Server seeds realistic data** in a single SQLite transaction: 5 portfolio holdings, 8 transactions, 4 journal entries, 5 price alerts, 4 slot notes, 8 watchlist tickers, and a pre-configured workspace
- **Idempotent** via a `demo_seeded` flag in the `settings` table — calling `/api/demo/seed` twice is safe
- **Same auth mechanism as vault** — demo mode generates a real Bearer token via `generateSessionToken()`. No special demo code paths in protected routes. Every `requireAuth` middleware check works identically
- **Free providers serve live data** even in demo mode — Yahoo Finance (candles, fundamentals), CoinGecko (crypto), Frankfurter (forex), ApeWisdom (sentiment) all work without API keys

**Tradeoff**: Features requiring paid API keys (Finnhub news, earnings calendar, insider trading, economic calendar) return empty results in demo mode. The user sees the UI but no data for those tabs. This is an honest representation of what the free tier provides.

### 14. Why cmdk for Command Palette

`cmdk` is a lightweight, unstyled, composable command menu that fits the shadcn/ui philosophy.

- **Unstyled** — the component provides behavior (keyboard navigation, filtering, grouping) while Orbit Terminal provides all styling via Tailwind
- **Server-side ticker search** with client-side command filtering — typing a ticker name hits the search API, while navigation commands are filtered locally
- **Single entry point** for navigation + actions + search — the user doesn't need to remember whether to use the search bar, a menu, or a keyboard shortcut
- Integrated with shadcn/ui's `command.tsx` primitive for consistent look and feel

**Tradeoff**: No fuzzy matching on commands — filtering is exact substring only. Typing "port" matches "Portfolio" but "prtf" does not. For 7 navigation targets and a handful of actions, this is sufficient.

---

## Architectural Tradeoffs Summary

| Decision | Benefit | Tradeoff |
|----------|---------|----------|
| No React Router | Simplicity, zero bundle cost | No deep linking, no browser history |
| SQLite | Zero config, single file, synchronous API | Single user only, no replication |
| Client-side encryption | Zero-knowledge security | Unrecoverable on password loss |
| Multi-provider fallback | Graceful degradation across rate limits | Silent catch blocks make debugging hard |
| In-memory session token | Simple, no JWT complexity | Lost on server restart, single-tab only |
| In-memory API keys | Fast access, no disk persistence of secrets | Lost on server restart (mitigated by boot ID polling) |
| `node-cron` dependency | Listed in both client and server `package.json` | **Dead code** — imported nowhere in the codebase. Should be removed |
| `fundamentals_cache` table | Exists in SQLite schema (`database.ts`) | **Unused** — an in-memory `Map` with 30min TTL is used instead. The table is never read or written |
| Two charting libraries | Each used for its strength | `lightweight-charts` for financial charts, `recharts` for pie/bar — two libraries in the bundle |
| oklch color space | Perceptually uniform dark theme | No support in older browsers |
| Synchronous `better-sqlite3` | Simple route handlers, no async DB code | Blocks the event loop during queries (acceptable for single-user, small dataset) |
