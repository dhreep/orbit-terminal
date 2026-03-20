import express from 'express';
import cors from 'cors';
import vaultRouter from './routes/vault.js';
import notesRouter from './routes/notes.js';
import workspaceRouter from './routes/workspace.js';
import marketRouter from './routes/market.js';
import { getDatabase, closeDatabase } from './db/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ─────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

// ─── Routes ─────────────────────────────────────────────
app.use('/api/vault', vaultRouter);
app.use('/api/notes', notesRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/api/market', marketRouter);

// ─── Health check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
