import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { ApiResponse, WorkspaceExport, NoteRecord, Workspace } from '@orbit/shared';

const router = Router();

// ─── Get current workspace state ──────────────────────────
router.get('/', (_req, res) => {
  const db = getDatabase();
  const row = db.prepare('SELECT data, updated_at as updatedAt FROM workspace WHERE id = 1').get() as
    | { data: string; updatedAt: string }
    | undefined;

  if (!row) {
    // Return default workspace
    const defaultWorkspace: Workspace = {
      layout: 'grid',
      slots: [
        { id: 0, ticker: null, chartMode: 'candle', thesis: '' },
        { id: 1, ticker: null, chartMode: 'candle', thesis: '' },
        { id: 2, ticker: null, chartMode: 'candle', thesis: '' },
        { id: 3, ticker: null, chartMode: 'candle', thesis: '' },
      ],
      updatedAt: new Date().toISOString(),
    };
    return res.json({ success: true, data: defaultWorkspace } satisfies ApiResponse<Workspace>);
  }

  try {
    res.json({ success: true, data: JSON.parse(row.data) } satisfies ApiResponse<any>);
  } catch {
    res.status(500).json({ success: false, error: 'Corrupted workspace data' } satisfies ApiResponse<never>);
  }
});

// ─── Save workspace state ────────────────────────────────
router.put('/', (req, res) => {
  const workspace = req.body as Workspace;
  const db = getDatabase();
  const data = JSON.stringify(workspace);

  db.prepare(`
    INSERT INTO workspace (id, data, updated_at)
    VALUES (1, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      updated_at = datetime('now')
  `).run(data);

  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Export full workspace ───────────────────────────────
router.get('/export', (_req, res) => {
  const db = getDatabase();

  const workspaceRow = db.prepare('SELECT data FROM workspace WHERE id = 1').get() as { data: string } | undefined;
  const workspace: Workspace = workspaceRow
    ? JSON.parse(workspaceRow.data)
    : {
        layout: 'grid',
        slots: [
          { id: 0, ticker: null, chartMode: 'candle', thesis: '' },
          { id: 1, ticker: null, chartMode: 'candle', thesis: '' },
          { id: 2, ticker: null, chartMode: 'candle', thesis: '' },
          { id: 3, ticker: null, chartMode: 'candle', thesis: '' },
        ],
        updatedAt: new Date().toISOString(),
      };

  const notes = db.prepare(
    'SELECT id, slot_id as slotId, ticker, content, updated_at as updatedAt FROM notes'
  ).all() as NoteRecord[];

  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  settingsRows.forEach((r) => (settings[r.key] = r.value));

  const exportData: WorkspaceExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workspace,
    notes,
    settings,
  };

  res.json({ success: true, data: exportData } satisfies ApiResponse<WorkspaceExport>);
});

// ─── Import workspace ────────────────────────────────────
router.post('/import', (req, res) => {
  const importData = req.body;
  if (!importData || importData.version !== 1 || !importData.workspace || !Array.isArray(importData.notes)) {
    return res.status(400).json({ success: false, error: 'Invalid import format' } satisfies ApiResponse<never>);
  }
  const ws = importData.workspace;
  if (!Array.isArray(ws.slots) || !ws.layout) {
    return res.status(400).json({ success: false, error: 'Invalid workspace data' } satisfies ApiResponse<never>);
  }

  const db = getDatabase();
  const transaction = db.transaction(() => {
    // Restore workspace
    db.prepare(`
      INSERT INTO workspace (id, data, updated_at) VALUES (1, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')
    `).run(JSON.stringify(importData.workspace));

    // Restore notes
    db.prepare('DELETE FROM notes').run();
    const insertNote = db.prepare(`
      INSERT INTO notes (slot_id, ticker, content, updated_at) VALUES (?, ?, ?, ?)
    `);
    for (const note of importData.notes) {
      insertNote.run(note.slotId, note.ticker, note.content, note.updatedAt);
    }

    // Restore settings
    const upsertSetting = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    for (const [key, value] of Object.entries(importData.settings)) {
      upsertSetting.run(key, value);
    }
  });

  transaction();
  res.json({ success: true } satisfies ApiResponse<never>);
});

export default router;
