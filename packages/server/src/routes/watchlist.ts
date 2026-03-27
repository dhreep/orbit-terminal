import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { ApiResponse, WatchlistItem } from '@orbit/shared';

const router = Router();

// ─── Get all watchlist items ─────────────────────────────
router.get('/', (_req, res) => {
  const db = getDatabase();
  const rows = db.prepare(
    'SELECT id, ticker, added_at as addedAt, sort_order as sortOrder FROM watchlist ORDER BY sort_order'
  ).all() as WatchlistItem[];

  res.json({ success: true, data: rows } satisfies ApiResponse<WatchlistItem[]>);
});

// ─── Add ticker to watchlist ─────────────────────────────
router.post('/', (req, res) => {
  const { ticker } = req.body as { ticker: string };
  if (!ticker) {
    return res.status(400).json({ success: false, error: 'ticker is required' } satisfies ApiResponse<never>);
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM watchlist WHERE ticker = ?').get(ticker);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Ticker already in watchlist' } satisfies ApiResponse<never>);
  }

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max FROM watchlist').get() as { max: number };
  const result = db.prepare('INSERT INTO watchlist (ticker, sort_order) VALUES (?, ?)').run(ticker, maxOrder.max + 1);

  const item = db.prepare(
    'SELECT id, ticker, added_at as addedAt, sort_order as sortOrder FROM watchlist WHERE id = ?'
  ).get(result.lastInsertRowid) as WatchlistItem;

  res.json({ success: true, data: item } satisfies ApiResponse<WatchlistItem>);
});

// ─── Remove ticker from watchlist ────────────────────────
router.delete('/:ticker', (req, res) => {
  const db = getDatabase();
  db.prepare('DELETE FROM watchlist WHERE ticker = ?').run(req.params.ticker);
  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Reorder watchlist ───────────────────────────────────
router.put('/reorder', (req, res) => {
  const { tickers } = req.body as { tickers: string[] };
  if (!Array.isArray(tickers)) {
    return res.status(400).json({ success: false, error: 'tickers array is required' } satisfies ApiResponse<never>);
  }

  const db = getDatabase();
  const update = db.prepare('UPDATE watchlist SET sort_order = ? WHERE ticker = ?');
  const transaction = db.transaction(() => {
    tickers.forEach((ticker, index) => update.run(index, ticker));
  });
  transaction();

  res.json({ success: true } satisfies ApiResponse<never>);
});

export default router;
