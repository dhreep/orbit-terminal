import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { ApiResponse, TradeJournalEntry } from '@orbit/shared';

const router = Router();

const SELECT_COLS = 'id, ticker, entry_price as entryPrice, entry_date as entryDate, exit_price as exitPrice, exit_date as exitDate, shares, thesis, outcome, pnl, status, created_at as createdAt';

// ─── Get all journal entries ─────────────────────────────
router.get('/', (_req, res) => {
  const db = getDatabase();
  const entries = db.prepare(`SELECT ${SELECT_COLS} FROM trade_journal ORDER BY created_at DESC`).all() as TradeJournalEntry[];
  res.json({ success: true, data: entries } satisfies ApiResponse<TradeJournalEntry[]>);
});

// ─── Create journal entry ────────────────────────────────
router.post('/', (req, res) => {
  const { ticker, entryPrice, entryDate, shares, thesis } = req.body as {
    ticker: string; entryPrice: number; entryDate: string; shares: number; thesis?: string;
  };
  if (!ticker || !entryPrice || !entryDate || !shares) {
    return res.status(400).json({ success: false, error: 'ticker, entryPrice, entryDate, and shares required' } satisfies ApiResponse<never>);
  }
  const db = getDatabase();
  const result = db.prepare(
    'INSERT INTO trade_journal (ticker, entry_price, entry_date, shares, thesis) VALUES (?, ?, ?, ?, ?)'
  ).run(ticker.toUpperCase(), entryPrice, entryDate, shares, thesis || '');
  const entry = db.prepare(`SELECT ${SELECT_COLS} FROM trade_journal WHERE id = ?`).get(result.lastInsertRowid) as TradeJournalEntry;
  res.json({ success: true, data: entry } satisfies ApiResponse<TradeJournalEntry>);
});

// ─── Close trade ─────────────────────────────────────────
router.put('/:id/close', (req, res) => {
  const { exitPrice, exitDate, outcome } = req.body as { exitPrice: number; exitDate: string; outcome?: string };
  if (!exitPrice || !exitDate) {
    return res.status(400).json({ success: false, error: 'exitPrice and exitDate required' } satisfies ApiResponse<never>);
  }
  const db = getDatabase();
  const existing = db.prepare(`SELECT ${SELECT_COLS} FROM trade_journal WHERE id = ?`).get(Number(req.params.id)) as TradeJournalEntry | undefined;
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Entry not found' } satisfies ApiResponse<never>);
  }
  const pnl = (exitPrice - existing.entryPrice) * existing.shares;
  db.prepare(
    'UPDATE trade_journal SET exit_price = ?, exit_date = ?, outcome = ?, pnl = ?, status = ? WHERE id = ?'
  ).run(exitPrice, exitDate, outcome || '', pnl, 'closed', Number(req.params.id));
  const entry = db.prepare(`SELECT ${SELECT_COLS} FROM trade_journal WHERE id = ?`).get(Number(req.params.id)) as TradeJournalEntry;
  res.json({ success: true, data: entry } satisfies ApiResponse<TradeJournalEntry>);
});

// ─── Delete journal entry ────────────────────────────────
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  db.prepare('DELETE FROM trade_journal WHERE id = ?').run(Number(req.params.id));
  res.json({ success: true } satisfies ApiResponse<never>);
});

export default router;
