import express from 'express';
import cors from 'cors';
import vaultRouter from './routes/vault.js';
import notesRouter from './routes/notes.js';
import workspaceRouter from './routes/workspace.js';
import marketRouter from './routes/market.js';
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
app.use('/api/notes', requireAuth, notesRouter);
app.use('/api/workspace', requireAuth, workspaceRouter);
app.use('/api/market', requireAuth, marketRouter);

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
