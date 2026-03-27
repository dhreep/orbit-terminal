// ─── Market Data ───────────────────────────────────────────
export interface CandleData {
  time: string;       // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FundamentalRatios {
  peRatio: number | null;
  pegRatio: number | null;
  debtToEquity: number | null;
  marketCap: number | null;
  beta: number | null;
  roe: number | null;
  eps: number | null;
  dividendYield: number | null;
  currentRatio: number | null;
  companyName: string;
  sector: string;
  lastUpdated: string;
}

// ─── Security Slot ─────────────────────────────────────────
export type ChartMode = 'candle' | 'line';

export interface SlotState {
  id: number;          // 0–3
  ticker: string | null;
  chartMode: ChartMode;
  thesis: string;      // markdown content
}

export interface Workspace {
  slots: SlotState[];
  layout: LayoutMode;
  updatedAt: string;
}

export type LayoutMode = 'grid' | 'spotlight';

// ─── Vault / Encryption ───────────────────────────────────
export interface EncryptedBlob {
  ciphertext: string;  // base64
  iv: string;          // base64
  salt: string;        // base64
}

export interface EncryptedKeyRecord {
  id: number;
  provider: ApiProvider;
  encryptedBlob: EncryptedBlob;
  createdAt: string;
}

export type ApiProvider = 'alpha_vantage' | 'fmp' | 'finnhub' | 'twelve_data' | 'groq' | 'ollama';

// ─── API Request / Response ────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface VaultInitRequest {
  passwordHash: string;
  salt: string;
}

export interface VaultVerifyRequest {
  passwordHash: string;
}

export interface StoreKeyRequest {
  provider: ApiProvider;
  encryptedBlob: EncryptedBlob;
}

export interface NoteUpdateRequest {
  slotId: number;
  ticker: string;
  content: string;
}

export interface NoteRecord {
  id: number;
  slotId: number;
  ticker: string;
  content: string;
  updatedAt: string;
}

export interface WorkspaceExport {
  version: 1;
  exportedAt: string;
  workspace: Workspace;
  notes: NoteRecord[];
  settings: Record<string, string>;
}

// ─── Watchlist ──────────────────────────────────────────
export interface WatchlistItem {
  id: number;
  ticker: string;
  addedAt: string;
  sortOrder: number;
}

// ─── Price Alerts ──────────────────────────────────────
export type AlertCondition = 'above' | 'below';
export interface PriceAlert {
  id: number;
  ticker: string;
  targetPrice: number;
  condition: AlertCondition;
  triggered: boolean;
  createdAt: string;
  triggeredAt: string | null;
}

// ─── News ──────────────────────────────────────────────
export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  related: string;
}

// ─── Portfolio ─────────────────────────────────────────
export interface Holding {
  id: number;
  ticker: string;
  shares: number;
  avgCost: number;
  addedAt: string;
}

export interface Transaction {
  id: number;
  ticker: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  date: string;
  notes: string;
}

export interface PortfolioSummary {
  holdings: (Holding & { currentPrice: number; marketValue: number; pnl: number; pnlPercent: number })[];
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
}

// ─── Earnings Calendar ─────────────────────────────────
export interface EarningsEvent {
  ticker: string;
  date: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  hour: 'bmo' | 'amc' | 'dmh' | '';
}

// ─── Trade Journal ─────────────────────────────────────
export interface TradeJournalEntry {
  id: number;
  ticker: string;
  entryPrice: number;
  entryDate: string;
  exitPrice: number | null;
  exitDate: string | null;
  shares: number;
  thesis: string;
  outcome: string;
  pnl: number | null;
  status: 'open' | 'closed';
  createdAt: string;
}

// ─── Crypto ────────────────────────────────────────────
export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  image: string;
}

// ─── Forex ─────────────────────────────────────────────
export interface ForexRate {
  base: string;
  quote: string;
  rate: number;
  date: string;
}

// ─── Insider Trading ───────────────────────────────────
export interface InsiderTransaction {
  name: string;
  share: number;
  change: number;
  transactionDate: string;
  transactionType: string;
  transactionPrice: number | null;
}

// ─── Economic Calendar ─────────────────────────────────
export interface EconomicEvent {
  date: string;
  event: string;
  country: string;
  actual: string | null;
  previous: string | null;
  estimate: string | null;
  impact: 'low' | 'medium' | 'high';
}

// ─── Social Sentiment ──────────────────────────────────
export interface SentimentData {
  ticker: string;
  mentions: number;
  upvotes: number;
  rank: number;
  mentionsChange24h: number;
}

// ─── AI Chat ───────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type AIProvider = 'groq' | 'ollama';

// ─── Screener ──────────────────────────────────────────
export interface ScreenerFilter {
  field: keyof FundamentalRatios;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
}

export interface ScreenerResult {
  ticker: string;
  companyName: string;
  ratios: FundamentalRatios;
}
