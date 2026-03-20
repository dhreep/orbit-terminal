import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { ApiResponse, NoteRecord, NoteUpdateRequest } from '@orbit/shared';

const router = Router();

// ─── Get note for a slot+ticker ──────────────────────────
router.get('/:slotId/:ticker', (req, res) => {
  const db = getDatabase();
  const note = db.prepare(
    'SELECT id, slot_id as slotId, ticker, content, updated_at as updatedAt FROM notes WHERE slot_id = ? AND ticker = ?'
  ).get(Number(req.params.slotId), req.params.ticker) as NoteRecord | undefined;

  res.json({ success: true, data: note || null } satisfies ApiResponse<NoteRecord | null>);
});

// ─── Upsert note ─────────────────────────────────────────
router.put('/', (req, res) => {
  const { slotId, ticker, content } = req.body as NoteUpdateRequest;
  if (slotId === undefined || !ticker) {
    return res.status(400).json({ success: false, error: 'slotId and ticker are required' } satisfies ApiResponse<never>);
  }

  const db = getDatabase();
  db.prepare(`
    INSERT INTO notes (slot_id, ticker, content, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(slot_id, ticker) DO UPDATE SET
      content = excluded.content,
      updated_at = datetime('now')
  `).run(slotId, ticker, content || '');

  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Get all notes ───────────────────────────────────────
router.get('/', (_req, res) => {
  const db = getDatabase();
  const notes = db.prepare(
    'SELECT id, slot_id as slotId, ticker, content, updated_at as updatedAt FROM notes ORDER BY updated_at DESC'
  ).all() as NoteRecord[];

  res.json({ success: true, data: notes } satisfies ApiResponse<NoteRecord[]>);
});

export default router;
