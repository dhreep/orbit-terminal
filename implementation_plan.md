# OrbitTerminal — Implementation Plan

A high-density, private information terminal for swing traders. Monorepo with React frontend, Express backend, SQLite database, and client-side encryption.

## User Review Required

> [!IMPORTANT]
> **API Keys Required**: You will need an [Alpha Vantage](https://www.alphavantage.co/support/#api-key) API key (free tier: 25 req/day) and a [Financial Modeling Prep](https://financialmodelingprep.com/developer/docs/) API key. These are entered through the Vault UI and stored encrypted — never in plaintext.

> [!WARNING]
> **Rate Limits**: Alpha Vantage free tier is severely limited (25/day, 5/min). The Traffic Controller will enforce this, but expect limited data refreshes on free plans.

---

## Proposed Changes

### Phase 1: Monorepo Structure

#### [NEW] [package.json](file:///c:/Users/Dhruv%20Bajaj/Desktop/OrbitTerminal/package.json)
Root workspace config with `packages/*` workspaces.

#### [NEW] packages/shared/
Shared TypeScript types: `SecuritySlot`, `Workspace`, `EncryptedKey`, `FundamentalRatios`, `CandleData`.

#### [NEW] packages/server/
Express backend with:
- **SQLite schema** (`orbit.db`): `settings`, `encrypted_keys`, `notes`, `workspaces` tables
- **REST API**: `/api/vault/*`, `/api/notes/*`, `/api/workspace/*`, `/api/market/*`
- **Traffic Controller**: Token-bucket rate limiter for Alpha Vantage (5 calls/min)
- Proxies Alpha Vantage & FMP calls so API keys stay server-side in memory only

#### [NEW] packages/client/
Vite + React + TypeScript + Tailwind CSS frontend.

---

### Phase 2: Security — Zero-Knowledge Vault

#### [NEW] packages/client/src/services/CryptoService.ts
- `deriveKey(password, salt)` → PBKDF2 with 600k iterations → AES-GCM 256-bit key
- `encrypt(plaintext, key)` → returns `{ciphertext, iv, salt}` base64-encoded
- `decrypt(blob, key)` → returns plaintext
- All operations use Web Crypto API — no external crypto libs

#### [NEW] packages/client/src/components/Vault/
- `VaultSetup.tsx` — First-launch password creation (with confirmation)
- `VaultUnlock.tsx` — Login screen with password input
- `VaultProvider.tsx` — React context holding decrypted keys in memory
- `ApiKeyManager.tsx` — Add/remove API keys (encrypt before sending to server)

#### [NEW] packages/server/src/routes/vault.ts
- `POST /api/vault/init` — Store password hash + salt
- `POST /api/vault/verify` — Verify password against stored hash
- `POST /api/vault/keys` — Store encrypted blobs
- `GET /api/vault/keys` — Return encrypted blobs (never plaintext)

---

### Phase 3: UI — Grid & Components

#### Stitch MCP Design
Use Stitch to generate initial screen designs for:
1. Main terminal layout (dark theme, 2×2 grid)
2. SecuritySlot component with chart + ratio sidebar
3. Vault unlock screen

#### [NEW] packages/client/src/components/Grid/
- `ComposableGrid.tsx` — CSS Grid with `grid-template-areas`, toggling between 2×2 and 1+3 spotlight
- `GridToggle.tsx` — Button to switch layouts

#### [NEW] packages/client/src/components/SecuritySlot/
- `SecuritySlot.tsx` — Container: chart area + ratio sidebar + notes area
- `PriceChart.tsx` — TradingView Lightweight Charts (`lightweight-charts` npm), candle/line toggle
- `RatioSidebar.tsx` — P/E, PEG, D/E in JetBrains Mono, vertical layout
- `TradeThesis.tsx` — Markdown editor (react-markdown + textarea), auto-saves to SQLite
- `TickerSearch.tsx` — Autocomplete search input

#### [NEW] packages/client/src/services/
- `MarketDataService.ts` — Alpha Vantage calls via backend proxy
- `FundamentalsService.ts` — FMP calls via backend proxy
- `TrafficController.ts` — Client-side request queue (respects 5/min limit)

#### [NEW] packages/client/src/hooks/
- `useMarketData.ts` — TanStack Query wrapper for price data (staleTime: 5min)
- `useFundamentals.ts` — TanStack Query wrapper for ratios (staleTime: 1hr)
- `useTradeThesis.ts` — Debounced save hook for notes
- `useWorkspace.ts` — Export/import workspace state

---

### Phase 4: Data Portability

#### [NEW] packages/client/src/components/ExportImport/
- `ExportButton.tsx` — Serializes all notes, tickers, settings, layout → `.json` download
- `ImportButton.tsx` — Reads `.json`, validates schema, restores full state
- Does NOT export encrypted API keys (security boundary)

---

## Verification Plan

### Automated Tests

1. **CryptoService unit tests** — Run via Vitest in client package:
   ```bash
   cd packages/client && npx vitest run src/services/__tests__/CryptoService.test.ts
   ```
   Tests: encrypt/decrypt roundtrip, wrong password fails, key derivation determinism.

2. **Server API tests** — Run via Vitest in server package:
   ```bash
   cd packages/server && npx vitest run src/__tests__/
   ```
   Tests: vault CRUD, notes CRUD, workspace export/import.

3. **Traffic Controller tests**:
   ```bash
   cd packages/server && npx vitest run src/__tests__/TrafficController.test.ts
   ```
   Tests: respects 5/min limit, queues excess requests.

### Browser Verification

4. **Security Audit** — After adding an API key through the UI:
   - Query `orbit.db` directly: `SELECT * FROM encrypted_keys` and confirm values are base64 blobs, not plaintext.

5. **UI Smoke Test** — Use the browser subagent to:
   - Open the app at `http://localhost:5173`
   - Verify vault setup → unlock flow
   - Add a ticker (e.g., AAPL) to a slot
   - Confirm chart renders and ratios display
   - Toggle grid layout (2×2 ↔ spotlight)
   - Write a trade thesis note, refresh, confirm persistence
   - Export workspace → verify JSON structure → import back

6. **Performance Audit** — Switch tickers rapidly across all 4 slots, confirm no UI freeze or cross-slot interference.

### Manual Verification (User)

7. **User deploys locally** with `npm run dev` from root, opens `http://localhost:5173`, and:
   - Sets master password
   - Enters API keys
   - Adds tickers to slots
   - Validates data accuracy against Alpha Vantage / FMP directly
