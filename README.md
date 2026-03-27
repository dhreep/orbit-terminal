# 🛰️ Orbit Terminal

**A high-performance, secure financial dashboard for real-time market analysis.**

Built with React 19, Express, and SQLite — featuring encrypted key storage, resizable 4-slot workspaces, technical indicators, AI chat, and 24 integrated features across 9 data providers. All free-tier compatible.

[![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-17%20components-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Tests](https://img.shields.io/badge/Tests-69%20passing-brightgreen?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Educational%2FPersonal-blue)](#license)

---

## 📋 Table of Contents

- [Features](#-features)
- [Demo Mode](#-demo-mode)
- [Getting Started](#-getting-started)
- [API Keys](#-api-keys-optional)
- [Tech Stack](#-tech-stack)
- [Data Providers](#-data-providers)
- [Project Structure](#-project-structure)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Architecture](#-architecture)
- [Testing](#-testing)
- [License](#-license)

---

## ✨ Features

### 🔐 Secure Vault
AES-256-GCM encrypted API key storage via the Web Crypto API. Keys are derived with PBKDF2 (600K iterations) and only exist in memory during active sessions. Zero-knowledge design — the server never sees plaintext keys. Brute-force protection on vault unlock.

### 🖥️ 4-Slot Workspace
Resizable 2×2 grid with draggable dividers, or Spotlight mode for a single focused chart. Each slot independently displays charts, indicators, and news for any ticker — including international stocks (e.g., `RELIANCE.NS`). Drag-and-drop slot rearrangement. Workspace state persists in SQLite. Export and import entire workspaces as JSON. Backspace clears the active slot.

### 📊 Candlestick & Line Charts
Interactive charts powered by TradingView's `lightweight-charts` with time range selector: 1W, 1M, 3M, 6M, 1Y, 5Y.

### 📈 Technical Indicators
Client-side computed via `trading-signals`. Toggleable per slot:
- SMA(20), EMA(12/26)
- RSI(14)
- MACD(12, 26, 9)
- Bollinger Bands(20, 2)

### ⚖️ Fundamental Analysis
Key financial ratios: P/E, PEG, D/E, ROE, EPS, Beta, Market Cap, Dividend Yield, Current Ratio. Multi-provider fallback chain: FMP → Alpha Vantage → Yahoo Finance (with crumb-based authentication).

### 🔍 Command Palette (⌘K)
`cmdk`-powered command palette for ticker search, navigation, and quick actions. Search bar callout in the nav bar. Access keyboard shortcuts dialog via ⌘K → "Show Keyboard Shortcuts".

### 👁️ Watchlist (⌘W)
Tracked tickers with live prices, daily change %, and SVG sparklines. Drag-and-drop reordering. Bookmark button in each slot to quickly add the current ticker. Clear all button. Ticker autocomplete on add.

### 🔔 Price Alerts (⌘A)
Set above/below price thresholds per ticker with autocomplete. Persistent in SQLite. Visual notification when triggered.

### 📰 News Feed
Per-ticker news inline in each slot. Finnhub (primary) with Alpha Vantage fallback.

### 💼 Portfolio Tracker
Holdings with live P&L calculation. Transaction log with weighted average cost basis. Summary cards for total value, gain/loss, and allocation. Ticker autocomplete on all input fields.

### 📓 Trade Journal
Track open and closed trades with entry/exit prices, thesis (with markdown help link), and outcome notes. Auto P&L calculation on close. Ticker autocomplete.

### 📅 Earnings Calendar
Upcoming earnings dates with timing badges (Before Open / After Close). Powered by Finnhub.

### 🌐 Data Explorer
Tabbed interface with five data sources:

| Tab | Source | Key Required | Extras |
|-----|--------|:------------:|--------|
| 🪙 Crypto | Top 50 by market cap (CoinGecko) | No | Search filter |
| 💱 Forex | Exchange rates (Frankfurter) | No | 2-currency converter |
| 🕵️ Insider Trading | Per-ticker insider transactions (Finnhub) | Yes | — |
| 📊 Economic Calendar | Upcoming events with impact ratings (Finnhub) | Yes | — |
| 💬 Social Sentiment | Reddit trending stocks (ApeWisdom) | No | Search filter |

### 🤖 AI Chat (⌘I)
BYOK (Bring Your Own Key) LLM chat. Supports **Groq** (cloud, free tier) or **Ollama** (local, unlimited). API key stored in the vault alongside other keys.

### 🔬 Stock Screener
Filter stocks by fundamental criteria (P/E, ROE, D/E, Market Cap, etc.) with a dynamic filter builder.

### 📐 Correlation Matrix
Pearson correlation between 2–6 tickers with a color-coded table. Ticker autocomplete chips for easy input.

### 📤 CSV/PDF Export
Export portfolio holdings, trade journal, and watchlist as CSV or styled PDF (via jsPDF).

### 🧘 Zen Mode (⌘Z)
Full-screen single chart with all UI chrome hidden.

### 🎨 Dark / Light Theme
Toggle with persistence. Dark terminal aesthetic by default.

### 🛡️ Session Auth
Bearer token authentication on all protected API routes. Brute-force protection on vault endpoints.

### 🕐 NYSE Market Status
Live open/closed indicator calculated from Eastern Time with a UTC clock display.

### 🌍 International Stock Support
Suffixed ticker symbols (e.g., `RELIANCE.NS`, `TCS.BO`) for Indian and international exchanges.

### 🔤 Ticker Autocomplete
Unified autocomplete component used across all ticker input fields — watchlist, alerts, portfolio, journal, screener, and correlation matrix.

---

## 🎮 Demo Mode

Click **"Try Demo"** on the login screen to explore Orbit Terminal without any API keys. Demo mode uses server-side data seeding and comes pre-populated with:

- A realistic portfolio (AAPL, MSFT, GOOGL, NVDA, TSLA)
- Sample trades in the journal
- Active price alerts
- Watchlist entries with sparklines
- Trade notes

All features are functional in demo mode using cached sample data.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/) — a `mise.toml` is included for automatic version management
- [npm](https://www.npmjs.com/)

### Installation

```bash
git clone https://github.com/dhreep/orbit-terminal.git
cd orbit-terminal
mise install        # installs Node 20 (optional, if using mise)
npm install
```

### Running in Development

```bash
npm run dev
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:3001

The server automatically creates `orbit.db` on first run.

Open http://localhost:5173 and click **"Try Demo"** for a pre-populated experience, or create a vault with your own API keys.

---

## 🔑 API Keys (Optional)

All features work in demo mode without keys. For live data:

| Provider | What It Unlocks | Free Tier | Sign Up |
|----------|----------------|-----------|---------|
| **Finnhub** | News, earnings, insider trading, economic calendar | 60 req/min | [finnhub.io](https://finnhub.io/) |
| **Alpha Vantage** | Candles, fundamentals, news | 25 req/day | [alphavantage.co](https://www.alphavantage.co/) |
| **FMP** | Fundamentals, search | 250 req total | [financialmodelingprep.com](https://financialmodelingprep.com/) |
| **Groq** | AI chat (LLM) | Free tier available | [console.groq.com](https://console.groq.com/) |

Keys are stored locally in your encrypted vault — never sent to any third party beyond the respective API provider.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | Component library (17 primitives, dark terminal theme) |
| TanStack Query | Server state & caching |
| lightweight-charts | TradingView candlestick/line charts |
| cmdk | Command palette |
| react-hotkeys-hook | Keyboard shortcuts |
| trading-signals | Technical indicator computation |
| Recharts | Supplementary charts (portfolio allocation) |
| jsPDF | PDF export |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js (ESM) | Runtime |
| Express | HTTP framework |
| better-sqlite3 | Local persistence (12 tables) |
| node-cron | Scheduled tasks |

### Shared
| Technology | Purpose |
|-----------|---------|
| TypeScript | Shared types package across client & server |

### Tooling
| Tool | Purpose |
|------|---------|
| mise | Node 20 version pinning |
| Vitest | Unit testing (69 tests) |
| npm workspaces | Monorepo management |

---

## 📡 Data Providers

All providers are free-tier compatible. No paid subscriptions required.

| Provider | Data | Key Required | Free Limits |
|----------|------|:------------:|-------------|
| Yahoo Finance | Candles, fundamentals, search (crumb-based auth) | No | ~100 req/hr |
| Alpha Vantage | Candles, fundamentals, news | Yes | 25 req/day |
| FMP | Fundamentals, search | Yes | 250 req total |
| Finnhub | News, earnings, insider, economic calendar | Yes | 60 req/min |
| CoinGecko | Crypto market data (top 50) | No | 30 req/min |
| Frankfurter | Forex exchange rates & conversion | No | Unlimited |
| ApeWisdom | Reddit social sentiment | No | No published limits |
| Groq | AI chat (cloud LLM) | Yes | Free tier |
| Ollama | AI chat (local LLM) | No | Local, unlimited |

---

## 📁 Project Structure

```
orbit-terminal/
├── packages/
│   ├── client/                # React SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/              # shadcn/ui primitives (17)
│   │   │   │   ├── shared/          # TickerAutocomplete
│   │   │   │   ├── SecuritySlot/    # Charts, indicators, news, thesis
│   │   │   │   ├── Vault/           # Auth & key management
│   │   │   │   ├── Watchlist/       # Watchlist panel
│   │   │   │   ├── Alerts/          # Price alerts
│   │   │   │   ├── Portfolio/       # Holdings & transactions
│   │   │   │   ├── Journal/         # Trade journal
│   │   │   │   ├── Earnings/        # Earnings calendar
│   │   │   │   ├── DataExplorer/    # Crypto, forex, insider, economic, sentiment, correlation
│   │   │   │   ├── AIChat/          # LLM chat panel
│   │   │   │   ├── Screener/        # Stock screener
│   │   │   │   ├── Export/          # CSV/PDF export
│   │   │   │   └── Demo/            # Demo mode provider
│   │   │   ├── services/            # API client, crypto service
│   │   │   ├── hooks/               # useTheme
│   │   │   ├── lib/                 # shadcn/ui utils
│   │   │   └── utils/               # NYSE status helpers
│   │   └── vitest.config.ts
│   ├── server/                # Express API
│   │   ├── src/
│   │   │   ├── db/                  # SQLite schema (12 tables)
│   │   │   ├── middleware/          # Auth (Bearer token)
│   │   │   ├── routes/              # 16 route files
│   │   │   └── services/            # TrafficController (rate limiter)
│   │   └── vitest.config.ts
│   └── shared/                # TypeScript types (no runtime code)
│       └── src/index.ts             # All shared interfaces & types
├── agents.md                  # AI agent transparency doc
├── mise.toml                  # Node 20 pinned
└── package.json               # Workspace root
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Command Palette |
| `⌘W` / `Ctrl+W` | Watchlist |
| `⌘A` / `Ctrl+A` | Alerts |
| `⌘I` / `Ctrl+I` | AI Chat |
| `⌘Z` / `Ctrl+Z` | Zen Mode |
| `⌘⌥1` / `Ctrl+Alt+1` | Focus Slot 1 |
| `⌘⌥2` / `Ctrl+Alt+2` | Focus Slot 2 |
| `⌘⌥3` / `Ctrl+Alt+3` | Focus Slot 3 |
| `⌘⌥4` / `Ctrl+Alt+4` | Focus Slot 4 |
| `Backspace` | Clear active slot |
| `Escape` | Close panels |

Access the full shortcuts dialog via ⌘K → "Show Keyboard Shortcuts".

---

## 🏗️ Architecture

Orbit Terminal is a **monorepo** with three packages managed by npm workspaces:

```
┌─────────────────────────────────────────────┐
│                   Client                     │
│  React 19 · Vite · Tailwind v4 · shadcn/ui  │
│  TanStack Query · lightweight-charts · cmdk  │
├─────────────────────────────────────────────┤
│                   Shared                     │
│          TypeScript types & interfaces       │
├─────────────────────────────────────────────┤
│                   Server                     │
│  Express · better-sqlite3 · node-cron        │
│  16 route files · 12 DB tables · Auth MW     │
└─────────────────────────────────────────────┘
```

**Security model**: The vault encrypts API keys client-side with AES-256-GCM (PBKDF2 600K iterations). The server stores only ciphertext. A session token (Bearer auth) protects all API routes. Brute-force protection limits unlock attempts.

**Data flow**: The client fetches market data through the Express server, which proxies requests to external providers with rate limiting (token-bucket for Alpha Vantage). Multi-provider fallback ensures resilience — if one provider is down or rate-limited, the next in the chain is tried automatically. Yahoo Finance uses crumb-based authentication for fundamental data.

---

## 🧪 Testing

```bash
npm test
```

Runs Vitest across both `client` and `server` packages. **69 tests** (21 client + 48 server) covering:

- Vault encryption/decryption
- API route handlers
- Rate limiting logic (TrafficController)
- Input validation
- Utility functions
- Component rendering

---

## 📄 License

For educational and personal use. Please comply with the terms of service of all data providers (Alpha Vantage, FMP, Finnhub, CoinGecko, Yahoo Finance) when using their APIs.
