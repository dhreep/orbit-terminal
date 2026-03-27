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
        const articles: NewsArticle[] = data.slice(0, 20).map((a: any) => ({
          id: String(a.id),
          headline: a.headline,
          summary: a.summary,
          source: a.source,
          url: a.url,
          datetime: a.datetime,
          related: a.related,
        }));
        return res.json({ success: true, data: articles } satisfies ApiResponse<NewsArticle[]>);
      }
    } catch {}
  }

  // Fallback: Alpha Vantage NEWS_SENTIMENT
  const avKey = getApiKey('alpha_vantage');
  if (avKey) {
    try {
      const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=20&apikey=${avKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.feed) {
        const articles: NewsArticle[] = data.feed.slice(0, 20).map((a: any) => ({
          id: a.url,
          headline: a.title,
          summary: a.summary,
          source: a.source,
          url: a.url,
          datetime: Math.floor(new Date(a.time_published?.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')).getTime() / 1000),
          related: ticker,
        }));
        return res.json({ success: true, data: articles } satisfies ApiResponse<NewsArticle[]>);
      }
    } catch {}
  }

  res.json({ success: true, data: [] } satisfies ApiResponse<NewsArticle[]>);
});

export default router;
