import { Router, Request, Response } from 'express';
import { getApiKey } from './market.js';
import type { ApiResponse, InsiderTransaction } from '@orbit/shared';

const router = Router();

// GET /:ticker — Insider transactions for ticker
router.get('/:ticker', async (req: Request, res: Response) => {
  const key = getApiKey('finnhub');
  if (!key) {
    return res.json({ success: true, data: [] } satisfies ApiResponse<InsiderTransaction[]>);
  }
  try {
    const ticker = (req.params.ticker as string).toUpperCase();
    const response = await fetch(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${key}`);
    const data = await response.json();
    const txns: InsiderTransaction[] = (data?.data ?? []).map((t: any) => ({
      name: t.name ?? '',
      share: t.share ?? 0,
      change: t.change ?? 0,
      transactionDate: t.transactionDate ?? '',
      transactionType: t.transactionCode ?? '',
      transactionPrice: t.transactionPrice ?? null,
    }));
    res.json({ success: true, data: txns } satisfies ApiResponse<InsiderTransaction[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<InsiderTransaction[]>);
  }
});

export default router;
