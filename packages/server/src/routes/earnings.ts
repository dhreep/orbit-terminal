import { Router } from 'express';
import type { ApiResponse, EarningsEvent } from '@orbit/shared';
import { getApiKey } from './market.js';

const router = Router();

function mapEarnings(data: any): EarningsEvent[] {
  const events = data?.earningsCalendar;
  if (!Array.isArray(events)) return [];
  return events.map((e: any) => ({
    ticker: e.symbol,
    date: e.date,
    epsEstimate: e.epsEstimate ?? null,
    epsActual: e.epsActual ?? null,
    revenueEstimate: e.revenueEstimate ?? null,
    revenueActual: e.revenueActual ?? null,
    hour: e.hour || '',
  }));
}

// ─── Upcoming earnings (next 7 days) ────────────────────
router.get('/', async (_req, res) => {
  const finnhubKey = getApiKey('finnhub');
  if (!finnhubKey) {
    return res.json({ success: true, data: [] } satisfies ApiResponse<EarningsEvent[]>);
  }
  try {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${finnhubKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json({ success: true, data: mapEarnings(data) } satisfies ApiResponse<EarningsEvent[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<EarningsEvent[]>);
  }
});

// ─── Earnings for specific ticker ────────────────────────
router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const finnhubKey = getApiKey('finnhub');
  if (!finnhubKey) {
    return res.json({ success: true, data: [] } satisfies ApiResponse<EarningsEvent[]>);
  }
  try {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${ticker}&from=${from}&to=${to}&token=${finnhubKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json({ success: true, data: mapEarnings(data) } satisfies ApiResponse<EarningsEvent[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<EarningsEvent[]>);
  }
});

export default router;
