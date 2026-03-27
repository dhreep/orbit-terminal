import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { ApiResponse, PriceAlert } from '@orbit/shared';

const router = Router();

// ─── Get all alerts ──────────────────────────────────────
router.get('/', (_req, res) => {
  const db = getDatabase();
  const rows = db.prepare(
    'SELECT id, ticker, target_price as targetPrice, condition, triggered, created_at as createdAt, triggered_at as triggeredAt FROM price_alerts'
  ).all() as Array<Omit<PriceAlert, 'triggered'> & { triggered: number }>;

  const alerts: PriceAlert[] = rows.map((r) => ({ ...r, triggered: !!r.triggered }));
  res.json({ success: true, data: alerts } satisfies ApiResponse<PriceAlert[]>);
});

// ─── Create alert ────────────────────────────────────────
router.post('/', (req, res) => {
  const { ticker, targetPrice, condition } = req.body as { ticker: string; targetPrice: number; condition: string };
  if (!ticker || targetPrice == null || !condition) {
    return res.status(400).json({ success: false, error: 'ticker, targetPrice, and condition are required' } satisfies ApiResponse<never>);
  }
  if (condition !== 'above' && condition !== 'below') {
    return res.status(400).json({ success: false, error: 'condition must be "above" or "below"' } satisfies ApiResponse<never>);
  }

  const db = getDatabase();
  const result = db.prepare('INSERT INTO price_alerts (ticker, target_price, condition) VALUES (?, ?, ?)').run(ticker, targetPrice, condition);

  const alert = db.prepare(
    'SELECT id, ticker, target_price as targetPrice, condition, triggered, created_at as createdAt, triggered_at as triggeredAt FROM price_alerts WHERE id = ?'
  ).get(result.lastInsertRowid) as Omit<PriceAlert, 'triggered'> & { triggered: number };

  res.json({ success: true, data: { ...alert, triggered: !!alert.triggered } } satisfies ApiResponse<PriceAlert>);
});

// ─── Delete alert ────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  db.prepare('DELETE FROM price_alerts WHERE id = ?').run(req.params.id);
  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Trigger alert ───────────────────────────────────────
router.put('/:id/trigger', (req, res) => {
  const db = getDatabase();
  const result = db.prepare("UPDATE price_alerts SET triggered = 1, triggered_at = datetime('now') WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Alert not found' } satisfies ApiResponse<never>);
  }
  res.json({ success: true } satisfies ApiResponse<never>);
});

export default router;
