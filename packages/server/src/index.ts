import express from 'express';
import cors from 'cors';
import vaultRouter from './routes/vault.js';
import demoRouter from './routes/demo.js';
import notesRouter from './routes/notes.js';
import workspaceRouter from './routes/workspace.js';
import marketRouter from './routes/market.js';
import watchlistRouter from './routes/watchlist.js';
import alertsRouter from './routes/alerts.js';
import cryptoRouter from './routes/crypto.js';
import forexRouter from './routes/forex.js';
import insiderRouter from './routes/insider.js';
import economicRouter from './routes/economic.js';
import sentimentRouter from './routes/sentiment.js';
import newsRouter from './routes/news.js';
import portfolioRouter from './routes/portfolio.js';
import earningsRouter from './routes/earnings.js';
import journalRouter from './routes/journal.js';
import { getDatabase, closeDatabase } from './db/database.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;
const bootId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

// ─── Middleware ─────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

// ─── Routes ─────────────────────────────────────────────
app.use('/api/vault', vaultRouter);
app.use('/api/demo', demoRouter);
app.use('/api/notes', requireAuth, notesRouter);
app.use('/api/workspace', requireAuth, workspaceRouter);
app.use('/api/market', requireAuth, marketRouter);
app.use('/api/watchlist', requireAuth, watchlistRouter);
app.use('/api/alerts', requireAuth, alertsRouter);
app.use('/api/crypto', requireAuth, cryptoRouter);
app.use('/api/forex', requireAuth, forexRouter);
app.use('/api/insider', requireAuth, insiderRouter);
app.use('/api/economic', requireAuth, economicRouter);
app.use('/api/sentiment', requireAuth, sentimentRouter);
app.use('/api/news', requireAuth, newsRouter);
app.use('/api/portfolio', requireAuth, portfolioRouter);
app.use('/api/earnings', requireAuth, earningsRouter);
app.use('/api/journal', requireAuth, journalRouter);

// ─── Health check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), bootId });
});

// ─── Global error handler ───────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Initialize DB and start ────────────────────────────
getDatabase();
console.log('📦 SQLite database initialized');

app.listen(PORT, () => {
  console.log(`🚀 OrbitTerminal API running on http://localhost:${PORT}`);
});

// ─── Graceful shutdown ──────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down…');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
