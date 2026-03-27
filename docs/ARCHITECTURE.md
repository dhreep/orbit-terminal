# Orbit Terminal — Architecture

> Internal architecture reference for developers and contributors.
> For setup instructions see [README.md](../README.md).

---

## Table of Contents

- [1. High-Level Overview](#1-high-level-overview)
- [2. Project Structure](#2-project-structure)
- [3. Frontend Architecture](#3-frontend-architecture)
- [4. Backend Architecture](#4-backend-architecture)
- [5. Data Flow](#5-data-flow)
- [6. Security Model](#6-security-model)
- [7. Component Map](#7-component-map)
- [8. Route Map](#8-route-map)

---

## 1. High-Level Overview

Orbit Terminal is a **monorepo** managed by npm workspaces with three packages:

```
root package.json
├── "workspaces": ["packages/shared", "packages/server", "packages/client"]
```

Both `client` and `server` depend on `"@orbit/shared": "*"`, which provides ~30 shared TypeScript type exports consumed at build time.

A root `tsconfig.base.json` (ES2022, strict mode, bundler module resolution) is extended by each package's own `tsconfig.json`.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (port 5173)                         │
│  React 19 · Vite · Tailwind CSS v4 · shadcn/ui (17 primitives)     │
│  TanStack Query · lightweight-charts · cmdk · react-hotkeys-hook    │
│  trading-signals · Recharts · jsPDF                                 │
├─────────────────────────────────────────────────────────────────────┤
│                        SHARED (@orbit/shared)                       │
│  TypeScript types & interfaces · ~30 exports                        │
│  CandleData · SlotState · Workspace · EncryptedBlob · ApiResponse   │
│  WatchlistItem · PriceAlert · Holding · TradeJournalEntry · ...     │
├─────────────────────────────────────────────────────────────────────┤
│                          SERVER (port 3001)                         │
│  Express · better-sqlite3 (WAL mode, 12 tables)                    │
│  16 route files · requireAuth middleware · TrafficController        │
│  In-memory API key store · Yahoo crumb auth                         │
└─────────────────────────────────────────────────────────────────────┘
         │                                           │
         ▼                                           ▼
   ┌───────────┐  ┌──────────┐  ┌─────────┐  ┌───────────┐
   │  Finnhub  │  │Alpha Van.│  │   FMP   │  │Yahoo Fin. │
   └───────────┘  └──────────┘  └─────────┘  └───────────┘
   ┌───────────┐  ┌──────────┐  ┌─────────┐  ┌───────────┐
   │ CoinGecko │  │Frankfurter│ │ApeWisdom│  │Groq/Ollama│
   └───────────┘  └──────────┘  └─────────┘  └───────────┘
```

---

## 2. Project Structure

```
orbit-terminal/
├── package.json                 # Workspace root — scripts: dev, build, test
├── tsconfig.base.json           # Shared TS config (ES2022, strict, bundler)
├── mise.toml                    # Node 20 version pinning
├── agents.md                    # AI agent instructions
│
├── packages/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts         # ~30 type/interface exports
│   │
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       ├── index.ts         # Express app entry — CORS, routes, shutdown
│   │       ├── db/
│   │       │   └── database.ts  # SQLite init, schema (12 tables), WAL mode
│   │       ├── middleware/
│   │       │   └── auth.ts      # Session token generation & requireAuth guard
│   │       ├── routes/          # 16 route files
│   │       │   ├── vault.ts     # Public — init, verify, key CRUD, reset
│   │       │   ├── demo.ts      # Public — seed demo data
│   │       │   ├── market.ts    # Candles, fundamentals, search, session keys
│   │       │   ├── workspace.ts # CRUD + export/import
│   │       │   ├── watchlist.ts # CRUD + reorder
│   │       │   ├── alerts.ts    # CRUD price alerts
│   │       │   ├── portfolio.ts # Holdings + transactions
│   │       │   ├── journal.ts   # Trade journal CRUD + close
│   │       │   ├── news.ts      # Per-ticker news
│   │       │   ├── earnings.ts  # Upcoming + per-ticker earnings
│   │       │   ├── crypto.ts    # Top coins + chart
│   │       │   ├── forex.ts     # Rates + history
│   │       │   ├── insider.ts   # Insider transactions
│   │       │   ├── economic.ts  # Economic calendar
│   │       │   ├── sentiment.ts # Reddit trending
│   │       │   └── notes.ts     # Per-slot trade thesis notes
│   │       ├── services/
│   │       │   └── TrafficController.ts  # Token-bucket rate limiter
│   │       └── __tests__/       # Vitest test files
│   │
│   └── client/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts       # Dev server proxy to :3001
│       ├── vitest.config.ts
│       ├── vitest.setup.ts
│       └── src/
│           ├── main.tsx         # Entry — StrictMode, QueryClientProvider
│           ├── App.tsx          # DemoProvider → VaultProvider → ErrorBoundary → Terminal
│           ├── index.css        # Tailwind v4, oklch theme tokens
│           ├── components/
│           │   ├── SecuritySlot/    # 8 files — chart, indicators, news, ratios
│           │   ├── Vault/           # 4 files — provider, setup, unlock, key mgr
│           │   ├── DataExplorer/    # 7 files — crypto, forex, insider, econ, sentiment, correlation
│           │   ├── AIChat/          # 1 file  — Groq/Ollama chat panel
│           │   ├── Alerts/          # 1 file  — price alerts panel
│           │   ├── Demo/            # 1 file  — demo context provider
│           │   ├── Earnings/        # 1 file  — earnings calendar
│           │   ├── Export/          # 1 file  — CSV/PDF export button
│           │   ├── Journal/         # 1 file  — trade journal
│           │   ├── Portfolio/       # 1 file  — holdings & transactions
│           │   ├── Screener/        # 1 file  — stock screener
│           │   ├── Watchlist/       # 1 file  — watchlist sheet
│           │   ├── shared/          # 1 file  — TickerAutocomplete
│           │   ├── ui/              # 17 files — shadcn/ui primitives
│           │   ├── CommandPalette.tsx
│           │   └── ResizableGrid.tsx
│           ├── services/
│           │   ├── api.ts           # Centralized fetch wrapper, 12 endpoint groups
│           │   └── CryptoService.ts # Web Crypto: AES-256-GCM, PBKDF2
│           ├── hooks/
│           │   └── useTheme.ts      # Dark/light toggle with localStorage
│           ├── lib/
│           │   └── utils.ts         # cn() — clsx + tailwind-merge
│           ├── utils/
│           │   └── market.ts        # NYSE open/closed status
│           └── __tests__/           # Vitest test files
```

---

## 3. Frontend Architecture

### Entry Point

```
main.tsx
  └─ <StrictMode>
       └─ <QueryClientProvider>          ← staleTime: 5min, gcTime: 30min, retry: 1
            └─ <App />
```

### Component Hierarchy

```
App.tsx
  └─ <DemoProvider>                      ← React context: isDemoMode, enableDemo, exitDemo
       └─ <VaultProvider>                ← React context: status, initVault, unlockVault, lockVault
            └─ <ErrorBoundary>           ← Class component, catches render crashes
                 └─ <Terminal />         ← Main application shell
```

### View Routing

There is **no react-router**. Navigation is state-driven:

```typescript
type AppView = 'terminal' | 'portfolio' | 'journal' | 'explorer'
             | 'earnings' | 'screener' | 'correlation';

const [currentView, setCurrentView] = useState<AppView>('terminal');
```

The nav bar renders buttons for each view. The main content area conditionally renders the matching component.

### Vault Gating

Before the Terminal renders, three gates are checked in order:

```
vault.status === 'loading'        → Loading spinner
vault.status === 'uninitialized'  → <VaultSetup />     (first-time password creation)
vault.status === 'locked'         → <VaultUnlock />     (password entry)
vault.status === 'unlocked'       → <Terminal />        (full app)
demo.isDemoMode === true          → <Terminal />        (bypasses vault)
```

### 4-Slot Workspace

The `ResizableGrid` component implements a CSS Grid with a **3×3 cell layout**:

```
┌──────────────┬────┬──────────────┐
│   Slot 0     │ ↔  │   Slot 1     │   ← Row 1 (content)
├──────────────┼────┼──────────────┤
│      ↕       │ ✛  │      ↕       │   ← Row 2 (dividers)
├──────────────┼────┼──────────────┤
│   Slot 2     │ ↔  │   Slot 3     │   ← Row 3 (content)
└──────────────┴────┴──────────────┘
  ↔ = col divider (cursor: col-resize)
  ↕ = row divider (cursor: row-resize)
  ✛ = center intersection (both axes)
```

- Column and row split percentages are stored in local state (`colPct`, `rowPct`)
- Mouse drag resizes within a **15–85%** range
- **Spotlight mode**: alternative layout showing slot 0 as a large focused chart with slots 1–3 as small thumbnails
- Drag-and-drop slot rearrangement via HTML5 drag events on each slot

### SecuritySlot

Each slot is an independent container rendering:

| Sub-component | Purpose |
|---|---|
| `TickerSearch` | Autocomplete ticker input with server-side search |
| `PriceChart` | `lightweight-charts` candlestick/line chart with time range selector (1W–5Y) |
| `IndicatorOverlay` | Client-side computed indicators via `trading-signals` |
| `IndicatorSelector` | Toggle checkboxes for SMA, EMA, RSI, MACD, Bollinger |
| `RatioSidebar` | Fundamental ratios (P/E, ROE, EPS, etc.) |
| `NewsFeed` | Per-ticker news articles |
| `TradeThesis` | Markdown notes persisted to SQLite |

Each slot maintains local state for `timeRange`, active `indicators`, and `activeTab`.

### TanStack Query Usage

- **18 `useQuery`** + **12 `useMutation`** calls across the app
- Query keys are simple string arrays (e.g., `['candles', ticker, range]`)
- Mutations invalidate related queries on success
- Cache tuning per data type:

| Data Type | staleTime | gcTime |
|---|---|---|
| Candles | 5 min | 30 min |
| Fundamentals | 60 min | 2 hr |
| Search results | 30 sec | 5 min |
| Default | 5 min | 30 min |

### shadcn/ui Primitives

17 components with a terminal-themed configuration:

```
badge · button · card · command · dialog · input · input-group · label
scroll-area · select · separator · sheet · switch · table · tabs · textarea · tooltip
```

Theme: oklch color space, `0px` border radii, gold primary (`#f0b90b`).

### Command Palette

`cmdk`-powered dialog (`⌘K`) with:
- Live ticker search (server-side filtering via `/api/market/search`)
- 8 navigation commands (terminal, watchlist, portfolio, journal, explorer, earnings, screener, correlation)
- 6 action commands (export, lock, toggle layout, zen mode, toggle theme, show shortcuts)

### Keyboard Shortcuts

9 hotkeys registered in `App.tsx` via `react-hotkeys-hook`:

| Shortcut | Action |
|---|---|
| `⌘K` | Open command palette |
| `⌘W` | Toggle watchlist |
| `⌘A` | Toggle alerts |
| `⌘Z` | Toggle zen mode |
| `Esc` | Close all panels / exit zen |
| `⌘⌥1` | Focus slot 0 input |
| `⌘⌥2` | Focus slot 1 input |
| `⌘⌥3` | Focus slot 2 input |
| `⌘⌥4` | Focus slot 3 input |

### Theme System

- `useTheme` hook reads/writes `localStorage` key `orbit-theme`
- `index.css` defines oklch dark/light palettes with custom semantic tokens:
  - `--orbit-gain`, `--orbit-loss`, `--orbit-gold`
  - `--orbit-surface-0` through `--orbit-surface-3`
- Dark terminal aesthetic is the default

### API Service Layer

`services/api.ts` provides a centralized `fetch` wrapper:

```typescript
async function request<T>(endpoint: string, options?: RequestInit): Promise<T>
```

- Automatically prepends `/api` base URL
- Attaches `Authorization: Bearer <token>` header when set
- Unwraps `ApiResponse<T>` envelope, throws on `success: false`
- 12 namespaced endpoint groups: `vault`, `notes`, `market`, `workspace`, `watchlist`, `alerts`, `news`, `portfolio`, `earnings`, `journal`, `crypto`, `forex`, `insider`, `economic`, `sentiment`

---

## 4. Backend Architecture

### Entry Point

`packages/server/src/index.ts` bootstraps Express:

```
1. CORS (origin: localhost:5173)
2. JSON body parser (5mb limit)
3. 16 route registrations (2 public + 14 protected)
4. GET /api/health — returns { status, timestamp, bootId }
5. Global error handler
6. SQLite initialization
7. Graceful shutdown (SIGINT, SIGTERM → close DB)
```

### Route Registration

```typescript
// Public (no auth)
app.use('/api/vault', vaultRouter);
app.use('/api/demo',  demoRouter);

// Protected (requireAuth middleware)
app.use('/api/notes',     requireAuth, notesRouter);
app.use('/api/workspace', requireAuth, workspaceRouter);
app.use('/api/market',    requireAuth, marketRouter);
app.use('/api/watchlist', requireAuth, watchlistRouter);
app.use('/api/alerts',    requireAuth, alertsRouter);
app.use('/api/crypto',    requireAuth, cryptoRouter);
app.use('/api/forex',     requireAuth, forexRouter);
app.use('/api/insider',   requireAuth, insiderRouter);
app.use('/api/economic',  requireAuth, economicRouter);
app.use('/api/sentiment', requireAuth, sentimentRouter);
app.use('/api/news',      requireAuth, newsRouter);
app.use('/api/portfolio', requireAuth, portfolioRouter);
app.use('/api/earnings',  requireAuth, earningsRouter);
app.use('/api/journal',   requireAuth, journalRouter);
```

### Authentication

Single in-memory session token via `crypto.randomUUID()`:

```typescript
let sessionToken: string | null = null;

function generateSessionToken(): string {
  sessionToken = crypto.randomUUID();
  return sessionToken;
}

function requireAuth(req, res, next): void {
  const header = req.headers.authorization;
  if (!header || header.slice(7) !== sessionToken) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  next();
}
```

- Generated on vault verify or demo seed
- One active session at a time — new login invalidates previous
- Token returned to client, stored in module-level variable in `api.ts`

### SQLite Database

`better-sqlite3` with WAL mode and foreign keys enabled. **12 tables**:

| # | Table | Key Columns | Constraints |
|---|---|---|---|
| 1 | `vault` | password_hash, salt | `id = 1` (single row) |
| 2 | `encrypted_keys` | provider, ciphertext, iv, salt | provider UNIQUE |
| 3 | `notes` | slot_id, ticker, content | UNIQUE(slot_id, ticker) |
| 4 | `settings` | key, value | key PRIMARY KEY |
| 5 | `workspace` | data (JSON blob) | `id = 1` (single row) |
| 6 | `watchlist` | ticker, sort_order | ticker UNIQUE |
| 7 | `price_alerts` | ticker, target_price, condition, triggered | condition IN (above, below) |
| 8 | `holdings` | ticker, shares, avg_cost | ticker UNIQUE |
| 9 | `transactions` | ticker, type, shares, price, date | type IN (buy, sell) |
| 10 | `trade_journal` | ticker, entry/exit prices, shares, thesis, pnl, status | status IN (open, closed) |
| 11 | `fundamentals_cache` | ticker, data | Unused — in-memory Map used instead |
| 12 | `chat_history` | role, content | role IN (user, assistant) |

The database file (`orbit.db`) is auto-created on first run in the server package directory.

### Rate Limiting

`TrafficController` implements a **token-bucket** algorithm for Alpha Vantage only:

```
┌─────────────────────────────────────────┐
│         TrafficController               │
│  maxTokens: 5    refillInterval: 12s    │
│                                         │
│  acquire() → token available? → proceed │
│            → no token? → queue request  │
│                                         │
│  drainTimer: setInterval checks queue,  │
│  refills tokens, resolves waiting calls │
└─────────────────────────────────────────┘
```

- 5 calls per minute (one token every 12 seconds)
- Excess requests are queued as Promises and drained as tokens refill
- Status endpoint exposes `availableTokens` and `queueLength`

---

## 5. Data Flow

### Request Lifecycle

```
┌────────┐     fetch()      ┌────────────┐    HTTP     ┌──────────────────┐
│ Browser │ ──────────────→  │ Vite Proxy │ ─────────→  │  Express Server  │
│ (React) │ ←────────────── │  (:5173)   │ ←───────── │    (:3001)       │
└────────┘  ApiResponse<T>  └────────────┘             └────────┬─────────┘
                                                                │
                                              ┌─────────────────┼─────────────────┐
                                              │                 │                 │
                                              ▼                 ▼                 ▼
                                        ┌──────────┐    ┌────────────┐    ┌────────────┐
                                        │  SQLite   │    │  In-Memory │    │  External  │
                                        │  (disk)   │    │   Caches   │    │   APIs     │
                                        └──────────┘    └────────────┘    └────────────┘
```

### Provider Fallback Chains

The server implements multi-provider fallback for resilience:

```
Candles:
  Alpha Vantage (rate-limited) → Yahoo Finance (crumb auth)

Fundamentals (4 tiers):
  In-memory cache (30min TTL)
    → FMP API
      → Alpha Vantage
        → Yahoo quoteSummary (crumb auth)
          → Yahoo chart meta (last resort)

Search:
  FMP → Alpha Vantage → Yahoo Finance

News:
  Finnhub → Alpha Vantage
```

### Yahoo Crumb Authentication

Yahoo Finance requires a 2-step authentication flow (since 2024):

```
1. GET https://fc.yahoo.com          → Extract Set-Cookie header
2. GET .../v1/test/getcrumb          → Send cookie, receive crumb token
   (Cookie header from step 1)

Crumb + cookie cached for 1 hour (CRUMB_TTL = 3,600,000ms)
```

### In-Memory API Key Store

```typescript
// market.ts — volatile key storage
const apiKeys: Map<string, string> = new Map();
```

- Keys are **volatile** — lost on server restart
- Client detects restart via boot ID polling (`GET /api/health` every 30s)
- On boot ID change, client re-decrypts keys from vault and re-sends to server

### Key Sync Lifecycle

```
Server restart detected (bootId changed)
  → Client decrypts keys from vault (Web Crypto)
    → POST /api/market/session/keys { provider, apiKey }
      → Server stores in Map<string, string>
        → Keys available for API calls
```

---

## 6. Security Model

### Zero-Knowledge Vault Encryption

The vault uses a **zero-knowledge** design — the server never sees plaintext passwords or API keys.

```
┌─────────────────── CLIENT (Browser) ───────────────────┐
│                                                         │
│  Password ──→ PBKDF2 (600K iterations, SHA-256)         │
│                  │                                      │
│                  ├──→ Hash (sent to server for auth)    │
│                  │                                      │
│                  └──→ AES-256-GCM Key                   │
│                         │                               │
│                         ├──→ encrypt(apiKey) → blob     │
│                         └──→ decrypt(blob) → apiKey     │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
                    ciphertext only
                          │
                          ▼
┌─────────────────── SERVER ──────────────────────────────┐
│                                                         │
│  Stores: password_hash, salt (vault table)              │
│  Stores: ciphertext, iv, salt (encrypted_keys table)    │
│  Never receives: plaintext password or API keys         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Cryptographic parameters:**

| Parameter | Value |
|---|---|
| Algorithm | AES-256-GCM |
| Key derivation | PBKDF2 |
| Iterations | 600,000 |
| Hash | SHA-256 |
| Salt | 16 bytes (random) |
| IV | 12 bytes (random) |
| API | Web Crypto (`crypto.subtle`) |

### API Key Lifecycle

```
1. User enters API key in browser
2. encrypt(key, vaultPassword) → { ciphertext, iv, salt }
3. POST /api/vault/keys — server stores ciphertext blob in SQLite
4. On vault unlock:
   a. GET /api/vault/keys — server returns ciphertext blobs
   b. decrypt(blob, vaultPassword) → plaintext key (in browser)
   c. POST /api/market/session/keys — plaintext sent to server memory
5. Server uses key for external API calls
6. On lock/restart: in-memory keys cleared
```

### Session Authentication

- Bearer token on all 14 protected routes
- Single `crypto.randomUUID()` token per session
- Token checked via `requireAuth` middleware on every request

### Brute-Force Protection

```typescript
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;  // 30 seconds

// On /vault/verify failure:
failedAttempts++;
if (failedAttempts >= MAX_ATTEMPTS) {
  lockoutUntil = Date.now() + LOCKOUT_MS;
}
// Returns HTTP 429 during lockout
```

### Boot ID Polling

- Server generates a unique `bootId` on startup: `Date.now().toString(36) + random`
- Client polls `GET /api/health` every 30 seconds
- If `bootId` changes → server restarted → client re-syncs decrypted keys

---

## 7. Component Map

| Directory | Files | Components | Purpose |
|---|---|---|---|
| `SecuritySlot/` | 8 | PriceChart, IndicatorOverlay, IndicatorSelector, NewsFeed, RatioSidebar, SecuritySlot, TickerSearch, TradeThesis | Per-slot chart, indicators, news, fundamentals, notes |
| `Vault/` | 4 | VaultProvider, VaultSetup, VaultUnlock, ApiKeyManager | Auth context, first-time setup, unlock screen, key CRUD |
| `DataExplorer/` | 7 | DataExplorer, CryptoView, ForexView, InsiderView, EconomicView, SentimentView, CorrelationView | Tabbed data browser + correlation matrix |
| `AIChat/` | 1 | AIChatPanel | BYOK LLM chat (Groq cloud / Ollama local) |
| `Alerts/` | 1 | AlertsPanel | Price alert CRUD in a sheet panel |
| `Demo/` | 1 | DemoProvider | React context for demo mode state |
| `Earnings/` | 1 | EarningsCalendar | Upcoming earnings with timing badges |
| `Export/` | 1 | ExportButton | CSV/PDF export via jsPDF |
| `Journal/` | 1 | TradeJournal | Open/closed trades with P&L |
| `Portfolio/` | 1 | PortfolioView | Holdings tab + transactions tab |
| `Screener/` | 1 | ScreenerView | Dynamic filter builder for fundamentals |
| `Watchlist/` | 1 | WatchlistPanel | Tracked tickers with sparklines in a sheet |
| `shared/` | 1 | TickerAutocomplete | Reusable autocomplete used across 6+ views |
| `ui/` | 17 | badge, button, card, command, dialog, input, input-group, label, scroll-area, select, separator, sheet, switch, table, tabs, textarea, tooltip | shadcn/ui primitives (terminal theme) |
| *(root)* | 2 | CommandPalette, ResizableGrid | ⌘K command dialog, 2×2 resizable grid |

**Total: 14 directories, 48 component files**

---

## 8. Route Map

| Base Path | Auth | Endpoints | Provider |
|---|---|---|---|
| `/api/vault` | No | `GET /status`, `POST /init`, `POST /verify`, `GET /keys`, `POST /keys`, `DELETE /keys/:provider`, `POST /reset` | SQLite |
| `/api/demo` | No | `POST /seed` | SQLite (seeded data) |
| `/api/market` | Yes | `GET /candles/:ticker`, `GET /fundamentals/:ticker`, `GET /search`, `POST /session/keys`, `POST /session/lock`, `GET /rate-status`, `GET /session/check` | Alpha Vantage, FMP, Yahoo Finance |
| `/api/workspace` | Yes | `GET /`, `PUT /`, `GET /export`, `POST /import` | SQLite |
| `/api/watchlist` | Yes | `GET /`, `POST /`, `DELETE /:ticker`, `PUT /reorder` | SQLite |
| `/api/alerts` | Yes | `GET /`, `POST /`, `DELETE /:id` | SQLite |
| `/api/portfolio` | Yes | `GET /holdings`, `POST /holdings`, `DELETE /holdings/:ticker`, `GET /transactions`, `POST /transactions`, `DELETE /transactions/:id` | SQLite |
| `/api/journal` | Yes | `GET /`, `POST /`, `PUT /:id/close`, `DELETE /:id` | SQLite |
| `/api/news` | Yes | `GET /:ticker` | Finnhub, Alpha Vantage |
| `/api/earnings` | Yes | `GET /`, `GET /:ticker` | Finnhub |
| `/api/crypto` | Yes | `GET /`, `GET /:id/chart` | CoinGecko |
| `/api/forex` | Yes | `GET /latest`, `GET /history` | Frankfurter |
| `/api/insider` | Yes | `GET /:ticker` | Finnhub |
| `/api/economic` | Yes | `GET /` | Finnhub |
| `/api/sentiment` | Yes | `GET /`, `GET /:ticker` | ApeWisdom |
| `/api/notes` | Yes | `GET /:slotId/:ticker`, `GET /`, `PUT /` | SQLite |
