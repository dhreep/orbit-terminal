import { Router, Request, Response } from 'express';
import type { ApiResponse, ForexRate, CandleData } from '@orbit/shared';

const router = Router();
const FRANKFURTER = 'https://api.frankfurter.app';

// GET /latest?base=USD — Latest rates
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const base = (req.query.base as string) || 'USD';
    const response = await fetch(`${FRANKFURTER}/latest?base=${base}`);
    const data = await response.json();
    const rates: ForexRate[] = Object.entries(data.rates || {}).map(([quote, rate]) => ({
      base: data.base || base,
      quote,
      rate: rate as number,
      date: data.date || new Date().toISOString().split('T')[0],
    }));
    res.json({ success: true, data: rates } satisfies ApiResponse<ForexRate[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<ForexRate[]>);
  }
});

// GET /history?base=USD&quote=EUR&days=30 — Historical rates as CandleData[]
router.get('/history', async (req: Request, res: Response) => {
  try {
    const base = (req.query.base as string) || 'USD';
    const quote = (req.query.quote as string) || 'EUR';
    const days = parseInt(req.query.days as string) || 30;
    const to = new Date();
    const from = new Date(Date.now() - days * 86400000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const response = await fetch(`${FRANKFURTER}/${fmt(from)}..${fmt(to)}?base=${base}&symbols=${quote}`);
    const data = await response.json();
    const candles: CandleData[] = Object.entries(data.rates || {}).map(([date, rates]: [string, any]) => {
      const rate = rates[quote] ?? 0;
      return { time: date, open: rate, high: rate, low: rate, close: rate, volume: 0 };
    }).sort((a, b) => a.time.localeCompare(b.time));
    res.json({ success: true, data: candles } satisfies ApiResponse<CandleData[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<CandleData[]>);
  }
});

export default router;
