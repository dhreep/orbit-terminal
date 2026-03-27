# 📦 Orbit Terminal — Shared

TypeScript types and interfaces shared between the client and server packages. No runtime code — types only.

## Usage

```typescript
import type { CandleData, SlotState, PriceAlert } from '@orbit/shared';
```

## Type Categories

| Category | Key Types |
|----------|-----------|
| Market Data | `CandleData`, `FundamentalRatios`, `ChartMode` |
| Workspace | `SlotState`, `Workspace`, `LayoutMode`, `WorkspaceExport` |
| Vault | `EncryptedBlob`, `EncryptedKeyRecord`, `ApiProvider`, `VaultInitRequest`, `VaultVerifyRequest`, `StoreKeyRequest` |
| Portfolio | `Holding`, `Transaction`, `PortfolioSummary` |
| Alerts | `PriceAlert`, `AlertCondition` |
| News | `NewsArticle` |
| Crypto | `CryptoQuote` |
| Forex | `ForexRate` |
| Earnings | `EarningsEvent` |
| Journal | `TradeJournalEntry` |
| Insider | `InsiderTransaction` |
| Economic | `EconomicEvent` |
| Sentiment | `SentimentData` |
| AI Chat | `ChatMessage`, `AIProvider` |
| Screener | `ScreenerFilter`, `ScreenerResult` |
| Notes | `NoteRecord`, `NoteUpdateRequest` |
| API | `ApiResponse<T>` |
