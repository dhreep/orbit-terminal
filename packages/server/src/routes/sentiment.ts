import { Router, Request, Response } from 'express';
import type { ApiResponse, SentimentData } from '@orbit/shared';

const router = Router();
const APEWISDOM = 'https://apewisdom.io/api/v1.0/filter/all-stocks/page/1';

async function fetchSentiment(): Promise<SentimentData[]> {
  const response = await fetch(APEWISDOM);
  const data = await response.json();
  return (data?.results ?? []).map((r: any) => ({
    ticker: r.ticker ?? '',
    mentions: r.mentions ?? 0,
    upvotes: r.upvotes ?? 0,
    rank: r.rank ?? 0,
    mentionsChange24h: r.mentions_24h_ago != null ? r.mentions - r.mentions_24h_ago : 0,
  }));
}

// GET / — Top mentioned stocks on Reddit
router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await fetchSentiment();
    res.json({ success: true, data } satisfies ApiResponse<SentimentData[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<SentimentData[]>);
  }
});

// GET /:ticker — Sentiment for specific ticker
router.get('/:ticker', async (req: Request, res: Response) => {
  try {
    const ticker = (req.params.ticker as string).toUpperCase();
    const all = await fetchSentiment();
    const match = all.filter((s) => s.ticker.toUpperCase() === ticker);
    res.json({ success: true, data: match } satisfies ApiResponse<SentimentData[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<SentimentData[]>);
  }
});

export default router;
