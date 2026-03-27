import { Router } from 'express';
import type { ApiResponse, NewsArticle } from '@orbit/shared';
import { getApiKey } from './market.js';

const router = Router();

router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const finnhubKey = getApiKey('finnhub');

  // Try Finnhub first
  if (finnhubKey) {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];
      const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${finnhubKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const articles: NewsArticle[] = data.slice(0, 15).map((a: any) => ({
          id: String(a.id),
          headline: a.headline,
          summary: '',
          source: a.source,
          url: a.url,
          datetime: a.datetime,
          related: a.related,
        }));
        return res.json({ success: true, data: articles } satisfies ApiResponse<NewsArticle[]>);
      }
    } catch {}
  }

  // Fallback: Yahoo Finance search (includes news, no key needed)
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${ticker}&quotesCount=0&newsCount=15`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 OrbitTerminal/1.0' },
    });
    const data = await response.json();
    const news = data?.news;
    if (Array.isArray(news) && news.length > 0) {
      const articles: NewsArticle[] = news.map((a: any) => ({
        id: a.uuid || a.link,
        headline: a.title,
        summary: '',
        source: a.publisher || '',
        url: a.link,
        datetime: a.providerPublishTime || Math.floor(Date.now() / 1000),
        related: ticker,
      }));
      return res.json({ success: true, data: articles } satisfies ApiResponse<NewsArticle[]>);
    }
  } catch {}

  res.json({ success: true, data: [] } satisfies ApiResponse<NewsArticle[]>);
});

export default router;
