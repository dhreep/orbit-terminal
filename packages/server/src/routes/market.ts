import { Router, Request, Response } from 'express';
import { alphaVantageController } from '../services/TrafficController.js';
import type { ApiResponse, CandleData, FundamentalRatios } from '@orbit/shared';
import fs from 'fs';
import path from 'path';

const router = Router();
const LOG_FILE = 'C:\\Users\\Dhruv Bajaj\\Desktop\\OrbitTerminal\\server_debug_final.log';

// In-memory fundamentals cache (30 min TTL) to avoid re-fetching during rate limits
const fundamentalsCache = new Map<string, { data: FundamentalRatios; expiry: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function logToFile(msg: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`);
}

// In-memory store for decrypted API keys (volatile — lost on restart)
const apiKeys: Map<string, string> = new Map();

export function setApiKey(provider: string, key: string): void {
  apiKeys.set(provider, key);
  logToFile(`🔑 Set API Key for ${provider}: ${key.substring(0, 4)}...`);
}

export function clearApiKeys(): void {
  apiKeys.clear();
}

export function getApiKey(provider: string): string | undefined {
  return apiKeys.get(provider);
}

// ─── Session: receive decrypted key for usage ────────────
router.post('/session/keys', (req: Request, res: Response) => {
  const { provider, apiKey } = req.body as { provider: string; apiKey: string };
  if (!provider || !apiKey) {
    return res.status(400).json({ success: false, error: 'provider and apiKey required' } satisfies ApiResponse<never>);
  }
  setApiKey(provider, apiKey);
  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Clear session keys (lock vault) ─────────────────────
router.post('/session/lock', (_req: Request, res: Response) => {
  clearApiKeys();
  res.json({ success: true } satisfies ApiResponse<never>);
});

// ─── Fetch candle data (Alpha Vantage → Yahoo Finance fallback) ───
router.get('/candles/:ticker', async (req: Request, res: Response) => {
  const ticker = (req.params.ticker as string).toUpperCase();
  const rangeParam = (req.query.range as string || '3M').toUpperCase();
  const avKey = apiKeys.get('alpha_vantage');

  // Map client range to Yahoo Finance range format
  const yahooRangeMap: Record<string, string> = {
    '1W': '5d', '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y', '5Y': '5y',
  };
  const yahooRange = yahooRangeMap[rangeParam] || '3mo';
  const yahooInterval = ['5Y'].includes(rangeParam) ? '1wk' : '1d';

  // Map range to cutoff date for filtering AV data (AV always returns ~100 days for compact)
  const avOutputSize = ['1Y', '5Y'].includes(rangeParam) ? 'full' : 'compact';
  const rangeDays: Record<string, number> = {
    '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '5Y': 1825,
  };
  const cutoffDate = new Date(Date.now() - (rangeDays[rangeParam] || 90) * 86400000)
    .toISOString().split('T')[0];

  // --- Try Alpha Vantage first ---
  if (avKey) {
    try {
      await alphaVantageController.acquire();
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=${avOutputSize}&apikey=${avKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data['Error Message'] && !data['Note'] && !data['Information']) {
        const timeSeries = data['Time Series (Daily)'];
        if (timeSeries) {
          const candles: CandleData[] = Object.entries(timeSeries)
            .map(([date, values]: [string, any]) => ({
              time: date,
              open: parseFloat(values['1. open']),
              high: parseFloat(values['2. high']),
              low: parseFloat(values['3. low']),
              close: parseFloat(values['4. close']),
              volume: parseInt(values['5. volume'], 10),
            }))
            .filter((c) => c.time >= cutoffDate)
            .sort((a, b) => a.time.localeCompare(b.time));
          logToFile(`✅ [Candles] AV Success for ${ticker} (${rangeParam}): ${candles.length} candles`);
          return res.json({ success: true, data: candles } satisfies ApiResponse<CandleData[]>);
        }
      }
      logToFile(`⚠️ [Candles] AV failed for ${ticker}: ${data['Note'] || data['Error Message'] || 'No data'}`);
    } catch (err) {
      logToFile(`⚠️ [Candles] AV error for ${ticker}: ${(err as Error).message}`);
    }
  }

  // --- Fallback: Yahoo Finance (no API key needed) ---
  try {
    logToFile(`🔄 [Candles] Falling back to Yahoo Finance for ${ticker} (${yahooRange})`);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${yahooRange}&interval=${yahooInterval}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 OrbitTerminal/1.0' },
    });
    const data = await response.json();

    const result = data?.chart?.result?.[0];
    if (!result) {
      return res.status(404).json({ success: false, error: 'No Yahoo data for ticker' } satisfies ApiResponse<never>);
    }

    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};

    const candles: CandleData[] = timestamps.map((ts: number, i: number) => ({
      time: new Date(ts * 1000).toISOString().split('T')[0],
      open: quote.open?.[i] ?? 0,
      high: quote.high?.[i] ?? 0,
      low: quote.low?.[i] ?? 0,
      close: quote.close?.[i] ?? 0,
      volume: quote.volume?.[i] ?? 0,
    })).filter((c: CandleData) => c.open > 0 && c.close > 0);

    logToFile(`✅ [Candles] Yahoo Success for ${ticker} (${yahooRange}): ${candles.length} candles`);
    return res.json({ success: true, data: candles } satisfies ApiResponse<CandleData[]>);
  } catch (err) {
    logToFile(`🔥 [Candles] Yahoo error for ${ticker}: ${(err as Error).message}`);
  }

  res.status(500).json({ success: false, error: 'All providers failed for candle data' } satisfies ApiResponse<never>);
});

// ─── Fetch fundamentals (Cache → FMP → AV OVERVIEW → Yahoo chart meta) ───
router.get('/fundamentals/:ticker', async (req: Request, res: Response) => {
  const ticker = (req.params.ticker as string).toUpperCase();
  const fmpKey = apiKeys.get('fmp');
  const avKey = apiKeys.get('alpha_vantage');

  // --- Check cache first ---
  const cached = fundamentalsCache.get(ticker);
  if (cached && cached.expiry > Date.now()) {
    logToFile(`⚡ [Fundamentals] Cache hit for ${ticker}`);
    return res.json({ success: true, data: cached.data } satisfies ApiResponse<FundamentalRatios>);
  }

  // --- Tier 1: Try FMP ---
  if (fmpKey) {
    try {
      logToFile(`🔍 [Fundamentals] Trying FMP for ${ticker}`);
      const [profileRes, ratiosRes] = await Promise.all([
        fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${fmpKey}`),
        fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${fmpKey}`),
      ]);
      const [profileData, ratiosData] = await Promise.all([profileRes.json(), ratiosRes.json()]);

      logToFile(`  FMP profile status: ${profileRes.status}, isArray: ${Array.isArray(profileData)}, len: ${Array.isArray(profileData) ? profileData.length : 'N/A'}`);
      logToFile(`  FMP ratios status: ${ratiosRes.status}, isArray: ${Array.isArray(ratiosData)}, len: ${Array.isArray(ratiosData) ? ratiosData.length : 'N/A'}`);

      // Check for FMP error responses (rate limit, Upgrade required)
      if (!Array.isArray(profileData) && profileData?.['Error Message']) {
        logToFile(`  FMP Error: ${profileData['Error Message']}`);
      } else if (!Array.isArray(profileData) && profileData?.['message']) {
        logToFile(`  FMP Error: ${profileData['message']}`);
      }

      const profile = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null;
      const ratios = Array.isArray(ratiosData) && ratiosData.length > 0 ? ratiosData[0] : null;

      if (profile && (profile.companyName || profile.mktCap)) {
        const fundamentals: FundamentalRatios = {
          peRatio: ratios?.peRatioTTM ?? profile?.pe ?? null,
          pegRatio: ratios?.pegRatioTTM ?? null,
          debtToEquity: ratios?.debtEquityRatioTTM ?? null,
          marketCap: profile?.mktCap ?? null,
          beta: profile?.beta ?? null,
          roe: ratios?.returnOnEquityTTM ?? null,
          eps: profile?.eps ?? null,
          dividendYield: ratios?.dividendYieldTTM ?? profile?.lastDiv ?? null,
          currentRatio: ratios?.currentRatioTTM ?? null,
          companyName: profile?.companyName ?? ticker,
          sector: profile?.sector ?? 'Unknown',
          lastUpdated: new Date().toISOString(),
        };
        logToFile(`✅ [Fundamentals] FMP Success for ${ticker}: PE=${fundamentals.peRatio}, MCap=${fundamentals.marketCap}`);
        fundamentalsCache.set(ticker, { data: fundamentals, expiry: Date.now() + CACHE_TTL });
        return res.json({ success: true, data: fundamentals } satisfies ApiResponse<FundamentalRatios>);
      }
      logToFile(`⚠️ [Fundamentals] FMP returned empty or invalid data for ${ticker}`);
    } catch (err) {
      logToFile(`⚠️ [Fundamentals] FMP error for ${ticker}: ${(err as Error).message}`);
    }
  }

  // --- Tier 2: Alpha Vantage OVERVIEW function ---
  if (avKey) {
    try {
      logToFile(`🔍 [Fundamentals] Trying AV OVERVIEW for ${ticker}`);
      // Skip rate limiter — OVERVIEW is independent from TIME_SERIES calls
      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${avKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data['Note'] || data['Information']) {
        logToFile(`⚠️ [Fundamentals] AV OVERVIEW rate limited for ${ticker}`);
      } else if (data['Symbol']) {
        const fundamentals: FundamentalRatios = {
          peRatio: data['TrailingPE'] ? parseFloat(data['TrailingPE']) : null,
          pegRatio: data['PEGRatio'] ? parseFloat(data['PEGRatio']) : null,
          debtToEquity: null,
          marketCap: data['MarketCapitalization'] ? parseFloat(data['MarketCapitalization']) : null,
          beta: data['Beta'] ? parseFloat(data['Beta']) : null,
          roe: data['ReturnOnEquityTTM'] ? parseFloat(data['ReturnOnEquityTTM']) : null,
          eps: data['EPS'] ? parseFloat(data['EPS']) : null,
          dividendYield: data['DividendYield'] ? parseFloat(data['DividendYield']) : null,
          currentRatio: null,
          companyName: data['Name'] || ticker,
          sector: data['Sector'] || 'Unknown',
          lastUpdated: new Date().toISOString(),
        };
        logToFile(`✅ [Fundamentals] AV OVERVIEW Success for ${ticker}: PE=${fundamentals.peRatio}, MCap=${fundamentals.marketCap}, Beta=${fundamentals.beta}`);
        fundamentalsCache.set(ticker, { data: fundamentals, expiry: Date.now() + CACHE_TTL });
        return res.json({ success: true, data: fundamentals } satisfies ApiResponse<FundamentalRatios>);
      } else {
        logToFile(`⚠️ [Fundamentals] AV OVERVIEW returned no Symbol for ${ticker}: ${JSON.stringify(data).substring(0, 200)}`);
      }
    } catch (err) {
      logToFile(`⚠️ [Fundamentals] AV OVERVIEW error for ${ticker}: ${(err as Error).message}`);
    }
  }

  // --- Tier 3: Yahoo Finance v8 chart meta (company name + price only) ---
  try {
    logToFile(`🔄 [Fundamentals] Falling back to Yahoo v8/chart meta for ${ticker}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`;
    const chartRes = await fetch(chartUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 OrbitTerminal/1.0' },
      signal: controller.signal,
    });
    const chartData = await chartRes.json();
    clearTimeout(timeout);

    const meta = chartData?.chart?.result?.[0]?.meta;
    if (meta) {
      const fundamentals: FundamentalRatios = {
        peRatio: null,
        pegRatio: null,
        debtToEquity: null,
        marketCap: null,
        beta: null,
        roe: null,
        eps: null,
        dividendYield: null,
        currentRatio: null,
        companyName: meta.shortName || meta.longName || ticker,
        sector: 'Unknown',
        lastUpdated: new Date().toISOString(),
      };
      logToFile(`✅ [Fundamentals] Yahoo meta-only Success for ${ticker}: name=${fundamentals.companyName}`);
      return res.json({ success: true, data: fundamentals } satisfies ApiResponse<FundamentalRatios>);
    }
  } catch (err) {
    logToFile(`🔥 [Fundamentals] Yahoo error for ${ticker}: ${(err as Error).message}`);
  }

  res.status(500).json({ success: false, error: 'All providers failed for fundamentals' } satisfies ApiResponse<never>);
});

// ─── Ticker search (FMP → AV → Yahoo Finance fallback) ───
router.get('/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  logToFile(`🔍 [MarketSearch] Incoming request for query: "${query}"`);

  if (!query || query.length < 1) {
    return res.json({ success: true, data: [] } satisfies ApiResponse<never[]>);
  }

  const fmpKey = apiKeys.get('fmp');
  const avKey = apiKeys.get('alpha_vantage');

  // --- Attempt FMP Search First ---
  if (fmpKey) {
    try {
      const url = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${fmpKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const results = data.map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          exchange: item.stockExchange || item.exchangeShortName || 'Unknown',
        }));
        logToFile(`✅ [MarketSearch] FMP Success: ${results.length} found`);
        return res.json({ success: true, data: results } satisfies ApiResponse<typeof results>);
      }
      logToFile(`⚠️ [MarketSearch] FMP Failed/Limited`);
    } catch (err) {
      logToFile(`⚠️ [MarketSearch] FMP Err: ${(err as Error).message}`);
    }
  }

  // --- Fallback to Alpha Vantage Search ---
  if (avKey) {
    try {
      logToFile(`🔄 [MarketSearch] Trying Alpha Vantage for "${query}"`);
      const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${avKey}`;
      const response = await fetch(url);
      const data = await response.json();

      const matches = data['bestMatches'];
      if (Array.isArray(matches) && matches.length > 0) {
        const results = matches.map((item: any) => ({
          symbol: item['1. symbol'],
          name: item['2. name'],
          exchange: item['4. region'] || 'Global',
        }));
        logToFile(`✅ [MarketSearch] AV Success: ${results.length} found`);
        return res.json({ success: true, data: results } satisfies ApiResponse<typeof results>);
      }

      if (data['Note'] || data['Information']) {
        logToFile(`⚠️ [MarketSearch] AV Rate Limited`);
      }
    } catch (err) {
      logToFile(`⚠️ [MarketSearch] AV Err: ${(err as Error).message}`);
    }
  }

  // --- Fallback: Yahoo Finance (no API key needed) ---
  try {
    logToFile(`🔄 [MarketSearch] Falling back to Yahoo Finance for "${query}"`);
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 OrbitTerminal/1.0' },
    });
    const data = await response.json();

    const quotes = data?.quotes || [];
    if (quotes.length > 0) {
      const results = quotes
        .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          exchange: q.exchange || 'Unknown',
        }));
      logToFile(`✅ [MarketSearch] Yahoo Success: ${results.length} found`);
      return res.json({ success: true, data: results } satisfies ApiResponse<typeof results>);
    }
  } catch (err) {
    logToFile(`🔥 [MarketSearch] Yahoo Err: ${(err as Error).message}`);
  }

  res.json({ success: true, data: [] } satisfies ApiResponse<never[]>);
});

// ─── Rate limiter status ─────────────────────────────────
router.get('/rate-status', (_req: Request, res: Response) => {
  res.json({ success: true, data: alphaVantageController.getStatus() } satisfies ApiResponse<ReturnType<typeof alphaVantageController.getStatus>>);
});

// ─── Session check ───────────────────────────────────────
router.get('/session/check', (_req: Request, res: Response) => {
  const hasAV = apiKeys.has('alpha_vantage');
  const hasFMP = apiKeys.has('fmp');
  res.json({ success: true, data: { alpha_vantage: hasAV, fmp: hasFMP } } satisfies ApiResponse<any>);
});

export default router;
