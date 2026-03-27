# ⚙️ Orbit Terminal — Server

Express API server with SQLite persistence for the Orbit Terminal financial dashboard.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js (ESM) | Runtime |
| Express | HTTP framework |
| better-sqlite3 | SQLite persistence (12 tables) |
| node-cron | Scheduled tasks |

## Key Features

- **Bearer token auth** on all protected routes
- **Token-bucket rate limiter** (TrafficController) for Alpha Vantage
- **Yahoo Finance crumb management** for fundamental data
- **Multi-provider fallback chains** (FMP → Alpha Vantage → Yahoo Finance)
- **Brute-force protection** on vault endpoints
- **Demo mode seeding** with realistic sample data

## Directory Structure

```
src/
├── db/
│   └── database.ts          # SQLite schema (12 tables), migrations
├── middleware/
│   └── auth.ts              # Bearer token verification, brute-force protection
├── routes/                  # 16 route files
│   ├── vault.ts             # Vault CRUD, session management
│   ├── workspace.ts         # Slot state, layout, export/import
│   ├── notes.ts             # Per-ticker trade thesis
│   ├── market.ts            # Candles, fundamentals, search (multi-provider)
│   ├── watchlist.ts         # Watchlist CRUD, reorder
│   ├── alerts.ts            # Price alert CRUD, trigger check
│   ├── news.ts              # Finnhub / Alpha Vantage news
│   ├── portfolio.ts         # Holdings, transactions, summary
│   ├── earnings.ts          # Earnings calendar (Finnhub)
│   ├── journal.ts           # Trade journal CRUD
│   ├── crypto.ts            # CoinGecko top 50
│   ├── forex.ts             # Frankfurter rates & conversion
│   ├── insider.ts           # Insider transactions (Finnhub)
│   ├── economic.ts          # Economic calendar (Finnhub)
│   ├── sentiment.ts         # Reddit sentiment (ApeWisdom)
│   └── demo.ts              # Demo mode data seeding
├── services/
│   └── TrafficController.ts # Token-bucket rate limiter
├── index.ts                 # App entry, route registration
└── __tests__/               # 48 Vitest tests
```

## Database Tables (12)

| Table | Purpose |
|-------|---------|
| `vault` | Encrypted API key blobs |
| `sessions` | Auth tokens |
| `slots` | Workspace slot state |
| `notes` | Per-ticker trade thesis |
| `watchlist` | Tracked tickers |
| `alerts` | Price alert thresholds |
| `holdings` | Portfolio positions |
| `transactions` | Buy/sell transaction log |
| `journal` | Trade journal entries |
| `settings` | App settings (theme, etc.) |
| `demo_sessions` | Demo mode tracking |
| `login_attempts` | Brute-force protection |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/vault/init` | No | Create vault |
| POST | `/api/vault/verify` | No | Unlock vault |
| GET | `/api/vault/keys` | Yes | List stored keys |
| POST | `/api/vault/keys` | Yes | Store encrypted key |
| DELETE | `/api/vault/keys/:provider` | Yes | Remove key |
| GET | `/api/workspace` | Yes | Get workspace state |
| PUT | `/api/workspace` | Yes | Update workspace |
| GET/PUT | `/api/notes` | Yes | Trade thesis CRUD |
| GET | `/api/market/candles` | Yes | OHLCV data |
| GET | `/api/market/fundamentals` | Yes | Financial ratios |
| GET | `/api/market/search` | Yes | Ticker search |
| GET/POST/DELETE | `/api/watchlist` | Yes | Watchlist CRUD |
| PUT | `/api/watchlist/reorder` | Yes | Reorder watchlist |
| GET/POST/DELETE | `/api/alerts` | Yes | Price alerts CRUD |
| GET | `/api/news` | Yes | Ticker news |
| GET/POST/DELETE | `/api/portfolio/*` | Yes | Portfolio CRUD |
| GET | `/api/portfolio/summary` | Yes | Live P&L summary |
| GET | `/api/earnings` | Yes | Earnings calendar |
| GET/POST/PUT/DELETE | `/api/journal` | Yes | Trade journal CRUD |
| GET | `/api/crypto` | Yes | Crypto top 50 |
| GET | `/api/forex/rates` | Yes | Forex rates |
| GET | `/api/forex/convert` | Yes | Currency conversion |
| GET | `/api/insider` | Yes | Insider transactions |
| GET | `/api/economic` | Yes | Economic calendar |
| GET | `/api/sentiment` | Yes | Reddit sentiment |
| POST | `/api/demo/init` | No | Seed demo data |

## Running

From the monorepo root:

```bash
npm run dev
```

Server starts at http://localhost:3001. The SQLite database (`orbit.db`) is created automatically on first run.

## Testing

```bash
npm test
```

48 tests covering auth middleware, market routes, rate limiting (TrafficController), and workspace validation.
