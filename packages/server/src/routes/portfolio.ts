import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { ApiResponse, Holding, Transaction } from '@orbit/shared';

const router = Router();

// ─── Get all holdings ────────────────────────────────────
router.get('/holdings', (_req, res) => {
  const db = getDatabase();
  const holdings = db.prepare(
    'SELECT id, ticker, shares, avg_cost as avgCost, added_at as addedAt FROM holdings ORDER BY ticker'
  ).all() as Holding[];
  res.json({ success: true, data: holdings } satisfies ApiResponse<Holding[]>);
});

// ─── Add/update holding ──────────────────────────────────
router.post('/holdings', (req, res) => {
  const { ticker, shares, avgCost } = req.body as { ticker: string; shares: number; avgCost: number };
  if (!ticker || shares == null || avgCost == null) {
    return res.status(400).json({ success: false, error: 'ticker, shares, and avgCost required' } satisfies ApiResponse<never>);
  }
  const db = getDatabase();
  db.prepare(`
    INSERT INTO holdings (ticker, shares, avg_cost) VALUES (?, ?, ?)
    ON CONFLICT(ticker) DO UPDATE SET
      shares = holdings.shares + excluded.shares,
      avg_cost = (holdings.avg_cost * holdings.shares + excluded.avg_cost * excluded.shares) / (holdings.shares + excluded.shares)
  `).run(ticker.toUpperCase(), shares, avgCost);
  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Remove holding ──────────────────────────────────────
router.delete('/holdings/:ticker', (req, res) => {
  const db = getDatabase();
  db.prepare('DELETE FROM holdings WHERE ticker = ?').run(req.params.ticker.toUpperCase());
  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Get all transactions ────────────────────────────────
router.get('/transactions', (_req, res) => {
  const db = getDatabase();
  const transactions = db.prepare(
    'SELECT id, ticker, type, shares, price, date, notes FROM transactions ORDER BY date DESC'
  ).all() as Transaction[];
  res.json({ success: true, data: transactions } satisfies ApiResponse<Transaction[]>);
});

// ─── Add transaction + update holdings ───────────────────
router.post('/transactions', (req, res) => {
  const { ticker, type, shares, price, date, notes } = req.body as {
    ticker: string; type: 'buy' | 'sell'; shares: number; price: number; date: string; notes?: string;
  };
  if (!ticker || !type || !shares || !price || !date) {
    return res.status(400).json({ success: false, error: 'ticker, type, shares, price, and date required' } satisfies ApiResponse<never>);
  }

  const db = getDatabase();
  const upperTicker = ticker.toUpperCase();

  const txn = db.transaction(() => {
    db.prepare(
      'INSERT INTO transactions (ticker, type, shares, price, date, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(upperTicker, type, shares, price, date, notes || '');

    if (type === 'buy') {
      db.prepare(`
        INSERT INTO holdings (ticker, shares, avg_cost) VALUES (?, ?, ?)
        ON CONFLICT(ticker) DO UPDATE SET
          shares = holdings.shares + excluded.shares,
          avg_cost = (holdings.avg_cost * holdings.shares + excluded.avg_cost * excluded.shares) / (holdings.shares + excluded.shares)
      `).run(upperTicker, shares, price);
    } else {
      db.prepare('UPDATE holdings SET shares = shares - ? WHERE ticker = ?').run(shares, upperTicker);
    }
  });
  txn();

  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Delete transaction ──────────────────────────────────
router.delete('/transactions/:id', (req, res) => {
  const db = getDatabase();
  db.prepare('DELETE FROM transactions WHERE id = ?').run(Number(req.params.id));
  res.json({ success: true } satisfies ApiResponse<never>);
});

export default router;
