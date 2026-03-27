# 🖥️ Orbit Terminal — Client

React 19 single-page application for the Orbit Terminal financial dashboard.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | 17 UI primitives (dark terminal theme) |
| TanStack Query | Server state & caching |
| lightweight-charts | TradingView candlestick/line charts |
| cmdk | Command palette (⌘K) |
| react-hotkeys-hook | Keyboard shortcuts |
| trading-signals | Client-side SMA, EMA, RSI, MACD, Bollinger Bands |
| Recharts | Portfolio allocation pie chart |
| jsPDF | PDF export |

## Directory Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives (17 components)
│   ├── shared/          # TickerAutocomplete (reused across all forms)
│   ├── SecuritySlot/    # PriceChart, IndicatorOverlay, RatioSidebar, NewsFeed, TradeThesis, TickerSearch
│   ├── Vault/           # VaultSetup, VaultUnlock, VaultProvider, ApiKeyManager
│   ├── Watchlist/       # WatchlistPanel (drag-and-drop, sparklines)
│   ├── Alerts/          # AlertsPanel (price thresholds)
│   ├── Portfolio/       # PortfolioView (holdings, transactions, P&L)
│   ├── Journal/         # TradeJournal (open/closed trades)
│   ├── Earnings/        # EarningsCalendar (Finnhub)
│   ├── DataExplorer/    # CryptoView, ForexView, InsiderView, EconomicView, SentimentView, CorrelationView
│   ├── AIChat/          # AIChatPanel (Groq / Ollama)
│   ├── Screener/        # ScreenerView (dynamic filter builder)
│   ├── Export/          # ExportButton (CSV/PDF)
│   ├── Demo/            # DemoProvider (demo mode context)
│   ├── CommandPalette.tsx
│   └── ResizableGrid.tsx
├── services/            # API client, CryptoService
├── hooks/               # useTheme
├── lib/                 # shadcn/ui cn() utility
├── utils/               # NYSE market status helpers
└── __tests__/           # 21 Vitest tests
```

## Running

From the monorepo root:

```bash
npm run dev
```

Client starts at http://localhost:5173.

## Testing

```bash
npm test
```

21 tests covering API client, crypto service, and market utilities.
