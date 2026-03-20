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

export type ApiProvider = 'alpha_vantage' | 'fmp';

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
