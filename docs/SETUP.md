# Orbit Terminal — Setup & Running Guide

A step-by-step guide to get Orbit Terminal running on your machine.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running in Development](#running-in-development)
- [Building for Production](#building-for-production)
- [Running Tests](#running-tests)
- [Project Scripts](#project-scripts-root-packagejson)
- [Environment & Configuration](#environment--configuration)
- [First Run Experience](#first-run-experience)
- [API Keys (Optional)](#api-keys-optional)
- [Database](#database)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/) — a `mise.toml` is included for automatic version management via `mise install`
- [npm](https://www.npmjs.com/) (comes with Node.js)
- No other dependencies — no Docker, no external databases

---

## Installation

```bash
git clone https://github.com/dhreep/orbit-terminal.git
cd orbit-terminal
mise install        # optional, if using mise for Node version management
npm install         # installs all 3 workspace packages
```

---

## Running in Development

```bash
npm run dev
```

- This uses `concurrently` to run both client and server simultaneously
- **Client**: http://localhost:5173 (Vite dev server with HMR)
- **Server**: http://localhost:3001 (Express API)
- The server automatically creates `orbit.db` (SQLite) on first run in the server package directory
- Vite proxies `/api` requests to the Express server

---

## Building for Production

```bash
npm run build
```

- Builds in order: **shared → server → client** (respecting dependency chain)
- Client output: `packages/client/dist/`
- Server output: `packages/server/dist/`

---

## Running Tests

```bash
npm test
```

- Runs Vitest across both client and server packages
- **69 tests total** (21 client + 48 server)
- Tests cover: vault encryption/decryption, API route handlers, rate limiting (TrafficController), input validation, utility functions, component rendering

---

## Project Scripts (root package.json)

| Script  | Command                          | Description                      |
|---------|----------------------------------|----------------------------------|
| `dev`   | `concurrently` server + client   | Start both in dev mode           |
| `build` | sequential shared → server → client | Production build              |
| `test`  | client tests then server tests   | Run all tests                    |

---

## Environment & Configuration

- **No `.env` file needed** — all configuration is done through the vault UI
- API keys are stored encrypted in SQLite, not in environment variables
- CORS is configured for `localhost:5173` (dev mode)
- JSON body parser limit: 5MB
- SQLite database: `orbit.db` created automatically in `packages/server/` with WAL journal mode

---

## First Run Experience

1. Run `npm run dev`
2. Open http://localhost:5173
3. You'll see the Vault Setup screen with two options:

   a. **Create Vault**: Set a master password (min 8 chars) to create your encrypted vault. Then add API keys through the key manager.

   b. **Try Demo**: Click "Try Demo — No API Keys Required" to explore with pre-populated sample data (portfolio, trades, alerts, watchlist entries).

4. In demo mode, features using free providers (Yahoo Finance, CoinGecko, Frankfurter, ApeWisdom) show live data. Features requiring API keys (Finnhub, Alpha Vantage, FMP, Groq) return empty results.

---

## API Keys (Optional)

All features work in demo mode without keys. For live data:

| Provider          | Unlocks                                        | Free Tier       | Sign Up                                                        |
|-------------------|------------------------------------------------|-----------------|----------------------------------------------------------------|
| **Finnhub**       | News, earnings, insider trading, economic calendar | 60 req/min      | [finnhub.io](https://finnhub.io/)                              |
| **Alpha Vantage** | Candles, fundamentals, news (fallback)         | 25 req/day      | [alphavantage.co](https://www.alphavantage.co/)                |
| **FMP**           | Fundamentals, search                           | 250 req total   | [financialmodelingprep.com](https://financialmodelingprep.com/) |
| **Groq**          | AI chat (cloud LLM)                            | Free tier       | [console.groq.com](https://console.groq.com/)                  |

Keys are stored locally in your encrypted vault — never sent to any third party beyond the respective API provider.

---

## Database

- **Engine**: SQLite via `better-sqlite3`
- **File**: `packages/server/orbit.db` (auto-created on first run)
- **Journal mode**: WAL (concurrent reads)
- **Schema**: 12 tables created on first run
- **To reset**: delete `orbit.db` and restart the server
- No migrations — schema is created fresh if the DB doesn't exist

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5173 in use | Vite will auto-increment to 5174 |
| Port 3001 in use | Change in `packages/server/src/index.ts` |
| `Cannot find module @orbit/shared` | Run `npm install` from the project root to link workspaces |
| Stale session after server restart | The client auto-detects via boot ID polling and re-syncs |
| Demo mode not loading | Check that the server is running on port 3001 |
