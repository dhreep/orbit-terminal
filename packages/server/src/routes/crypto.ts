import { Router, Request, Response } from 'express';
import type { ApiResponse, CryptoQuote, CandleData } from '@orbit/shared';

const router = Router();
const COINGECKO = 'https://api.coingecko.com/api/v3';
const HEADERS = { 'User-Agent': 'OrbitTerminal/1.0' };

// GET / — Top 50 cryptos by market cap
router.get('/', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(
      `${COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`,
      { headers: HEADERS },
    );
    const data = await response.json();
    const quotes: CryptoQuote[] = (Array.isArray(data) ? data : []).map((c: any) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      price: c.current_price ?? 0,
      change24h: c.price_change_percentage_24h ?? 0,
      marketCap: c.market_cap ?? 0,
      volume24h: c.total_volume ?? 0,
      image: c.image ?? '',
    }));
    res.json({ success: true, data: quotes } satisfies ApiResponse<CryptoQuote[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<CryptoQuote[]>);
  }
});

// GET /:id — Single crypto details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${COINGECKO}/coins/${req.params.id}`, { headers: HEADERS });
    const data = await response.json();
    res.json({ success: true, data } satisfies ApiResponse<any>);
  } catch {
    res.json({ success: false, error: 'Failed to fetch crypto details' } satisfies ApiResponse<never>);
  }
});

// GET /:id/chart?days=7 — Price history as CandleData[]
router.get('/:id/chart', async (req: Request, res: Response) => {
  try {
    const days = req.query.days || '7';
    const response = await fetch(
      `${COINGECKO}/coins/${req.params.id}/market_chart?vs_currency=usd&days=${days}`,
      { headers: HEADERS },
    );
    const data = await response.json();
    const prices: [number, number][] = data?.prices ?? [];
    const candles: CandleData[] = prices.map(([ts, price]) => ({
      time: new Date(ts).toISOString().split('T')[0],
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
    }));
    res.json({ success: true, data: candles } satisfies ApiResponse<CandleData[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<CandleData[]>);
  }
});

export default router;
