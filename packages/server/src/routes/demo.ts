import { Router } from 'express';
import { getDatabase } from '../db/database.js';
import type { ApiResponse } from '@orbit/shared';

const router = Router();

router.post('/seed', (_req, res) => {
  const db = getDatabase();

  const seeded = db.prepare("SELECT value FROM settings WHERE key = 'demo_seeded'").get();
  if (seeded) {
    return res.json({ success: true, data: { alreadySeeded: true } } satisfies ApiResponse<any>);
  }

  db.transaction(() => {
    // Watchlist
    const insertWatchlist = db.prepare('INSERT OR IGNORE INTO watchlist (ticker, sort_order) VALUES (?, ?)');
    ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'JPM'].forEach((t, i) => insertWatchlist.run(t, i));

    // Workspace with 4 tickers pre-loaded
    const workspace = JSON.stringify({
      layout: 'grid',
      slots: [
        { id: 0, ticker: 'AAPL', chartMode: 'candle', thesis: '' },
        { id: 1, ticker: 'MSFT', chartMode: 'candle', thesis: '' },
        { id: 2, ticker: 'GOOGL', chartMode: 'line', thesis: '' },
        { id: 3, ticker: 'TSLA', chartMode: 'candle', thesis: '' },
      ],
      updatedAt: new Date().toISOString(),
    });
    db.prepare("INSERT INTO workspace (id, data, updated_at) VALUES (1, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')").run(workspace);

    // Portfolio holdings
    const insertHolding = db.prepare('INSERT OR IGNORE INTO holdings (ticker, shares, avg_cost) VALUES (?, ?, ?)');
    insertHolding.run('AAPL', 50, 178.25);
    insertHolding.run('MSFT', 30, 395.50);
    insertHolding.run('GOOGL', 25, 155.75);
    insertHolding.run('NVDA', 20, 875.00);
    insertHolding.run('AMZN', 15, 185.30);

    // Transactions
    const insertTx = db.prepare('INSERT INTO transactions (ticker, type, shares, price, date, notes) VALUES (?, ?, ?, ?, ?, ?)');
    insertTx.run('AAPL', 'buy', 50, 178.25, '2025-01-15', 'Initial position — strong iPhone cycle');
    insertTx.run('MSFT', 'buy', 30, 395.50, '2025-02-03', 'Azure growth thesis');
    insertTx.run('GOOGL', 'buy', 40, 148.00, '2025-01-20', 'AI search moat');
    insertTx.run('GOOGL', 'sell', 15, 168.50, '2025-03-10', 'Trimmed after 14% run');
    insertTx.run('NVDA', 'buy', 20, 875.00, '2025-02-20', 'Data center demand');
    insertTx.run('AMZN', 'buy', 15, 185.30, '2025-03-01', 'AWS + retail recovery');
    insertTx.run('TSLA', 'buy', 25, 245.00, '2025-01-10', 'Robotaxi catalyst');
    insertTx.run('TSLA', 'sell', 25, 195.00, '2025-02-28', 'Stopped out — thesis broken');

    // Trade journal entries
    const insertJournal = db.prepare('INSERT INTO trade_journal (ticker, entry_price, entry_date, exit_price, exit_date, shares, thesis, outcome, pnl, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertJournal.run('TSLA', 245.00, '2025-01-10', 195.00, '2025-02-28', 25, 'Robotaxi announcement expected in Q1. Entry on pullback to 200-day MA.', 'Thesis invalidated — delayed timeline, cut loss.', -1250.00, 'closed');
    insertJournal.run('GOOGL', 148.00, '2025-01-20', 168.50, '2025-03-10', 15, 'AI search moat undervalued. Gemini integration driving engagement.', 'Trimmed at +14% — keeping core position.', 307.50, 'closed');
    insertJournal.run('AAPL', 178.25, '2025-01-15', null, null, 50, 'iPhone 16 super cycle + Services revenue inflection. Target $220.', '', null, 'open');
    insertJournal.run('NVDA', 875.00, '2025-02-20', null, null, 20, 'Blackwell GPU ramp. Data center capex cycle has 2+ years to run.', '', null, 'open');

    // Price alerts
    const insertAlert = db.prepare('INSERT INTO price_alerts (ticker, target_price, condition) VALUES (?, ?, ?)');
    insertAlert.run('AAPL', 220.00, 'above');
    insertAlert.run('AAPL', 165.00, 'below');
    insertAlert.run('NVDA', 1000.00, 'above');
    insertAlert.run('TSLA', 150.00, 'below');
    insertAlert.run('MSFT', 450.00, 'above');

    // Notes for workspace slots
    const insertNote = db.prepare("INSERT OR IGNORE INTO notes (slot_id, ticker, content, updated_at) VALUES (?, ?, ?, datetime('now'))");
    insertNote.run(0, 'AAPL', '## Bull Case\n- iPhone 16 super cycle\n- Services revenue > $100B run rate\n- India market expansion\n\n## Risks\n- China regulatory\n- Antitrust (App Store)');
    insertNote.run(1, 'MSFT', '## Thesis\nAzure is the #2 cloud and gaining share. Copilot monetization just starting.\n\n## Key Metrics\n- Azure growth rate (watch for re-acceleration)\n- Copilot seat count\n- Operating margin expansion');
    insertNote.run(2, 'GOOGL', '## Position\nTrimmed 15 shares at $168.50 (+14%). Holding 25 shares core.\n\n## Watching\n- Search market share vs AI competitors\n- YouTube Shorts monetization\n- Waymo progress');
    insertNote.run(3, 'TSLA', '## Post-Mortem\nStopped out at $195 for -$1,250 loss.\n\n**Lesson**: Don\'t size up on catalyst trades. The robotaxi timeline was always uncertain.');

    // Mark as seeded
    db.prepare("INSERT INTO settings (key, value) VALUES ('demo_seeded', 'true')").run();
  })();

  res.json({ success: true, data: { seeded: true } } satisfies ApiResponse<any>);
});

router.post('/clear', (_req, res) => {
  const db = getDatabase();
  db.transaction(() => {
    db.prepare('DELETE FROM watchlist').run();
    db.prepare('DELETE FROM holdings').run();
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM trade_journal').run();
    db.prepare('DELETE FROM price_alerts').run();
    db.prepare('DELETE FROM notes').run();
    db.prepare('DELETE FROM workspace').run();
    db.prepare("DELETE FROM settings WHERE key = 'demo_seeded'").run();
  })();
  res.json({ success: true } satisfies ApiResponse<never>);
});

export default router;
