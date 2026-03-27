import { Router, Request, Response } from 'express';
import { alphaVantageController } from '../services/TrafficController.js';
import type { ApiResponse, CandleData, FundamentalRatios } from '@orbit/shared';

const router = Router();

// In-memory fundamentals cache (30 min TTL) to avoid re-fetching during rate limits
const fundamentalsCache = new Map<string, { data: FundamentalRatios; expiry: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const TICKER_REGEX = /^[A-Z0-9.\-]{1,20}$/;
function isValidTicker(ticker: string): boolean {
  return TICKER_REGEX.test(ticker);
}

// Yahoo Finance crumb/cookie management (required since 2024)
let yahooCrumb: string | null = null;
let yahooCookie: string | null = null;
let yahooCrumbExpiry = 0;
const CRUMB_TTL = 60 * 60 * 1000; // 1 hour

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  if (yahooCrumb && yahooCookie && Date.now() < yahooCrumbExpiry) {
    return { crumb: yahooCrumb, cookie: yahooCookie };
  }
  try {
    const initRes = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': 'Mozilla/5.0 OrbitTerminal/1.0' },
      redirect: 'manual',
    });
    const cookies = initRes.headers.getSetCookie?.() || [];
    const cookie = cookies.map(c => c.split(';')[0]).join('; ');
    if (!cookie) return null;

    const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': 'Mozilla/5.0 OrbitTerminal/1.0', 'Cookie': cookie },
    });
    const crumb = await crumbRes.text();
    if (!crumb || crumb.includes('Unauthorized')) return null;

    yahooCrumb = crumb;
    yahooCookie = cookie;
    yahooCrumbExpiry = Date.now() + CRUMB_TTL;
    return { crumb, cookie };
  } catch {
    return null;
  }
}

// In-memory store for decrypted API keys (volatile — lost on restart)
const apiKeys: Map<string, string> = new Map();

export function setApiKey(provider: string, key: string): void {
  apiKeys.set(provider, key);
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
  if (!isValidTicker(ticker)) {
    return res.status(400).json({ success: false, error: 'Invalid ticker symbol' } satisfies ApiResponse<never>);
  }
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
          return res.json({ success: true, data: candles } satisfies ApiResponse<CandleData[]>);
        }
      }
    } catch (err) {
      // Alpha Vantage failed, fall through to Yahoo
    }
  }

  // --- Fallback: Yahoo Finance (no API key needed) ---
  try {
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

    return res.json({ success: true, data: candles } satisfies ApiResponse<CandleData[]>);
  } catch (err) {
    // Yahoo Finance failed
  }

  res.status(500).json({ success: false, error: 'All providers failed for candle data' } satisfies ApiResponse<never>);
});

// ─── Fetch fundamentals (Cache → FMP → AV OVERVIEW → Yahoo chart meta) ───
router.get('/fundamentals/:ticker', async (req: Request, res: Response) => {
  const ticker = (req.params.ticker as string).toUpperCase();
  if (!isValidTicker(ticker)) {
    return res.status(400).json({ success: false, error: 'Invalid ticker symbol' } satisfies ApiResponse<never>);
  }
  const fmpKey = apiKeys.get('fmp');
  const avKey = apiKeys.get('alpha_vantage');

  // --- Check cache first ---
  const cached = fundamentalsCache.get(ticker);
  if (cached && cached.expiry > Date.now()) {
    return res.json({ success: true, data: cached.data } satisfies ApiResponse<FundamentalRatios>);
  }

  // --- Tier 1: Try FMP ---
  if (fmpKey) {
    try {
      const [profileRes, ratiosRes] = await Promise.all([
        fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${fmpKey}`),
        fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${fmpKey}`),
      ]);
      const [profileData, ratiosData] = await Promise.all([profileRes.json(), ratiosRes.json()]);

      const profile = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null;
      const ratios = Array.isArray(ratiosData) && ratiosData.length > 0 ? ratiosData[0] : null;

      if (profile && (profile.companyName || profile.mktCap)) {
        const fundamentals: FundamentalRatios = {
          peRatio: ratios?.peRatioTTM ?? profile?.pe ?? null,
          pegRatio: ratios?.pegRatioTTM ?? null,
          fiftyTwoWeekChange: null,
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
        fundamentalsCache.set(ticker, { data: fundamentals, expiry: Date.now() + CACHE_TTL });
        return res.json({ success: true, data: fundamentals } satisfies ApiResponse<FundamentalRatios>);
      }
    } catch (err) {
      // FMP failed, fall through to AV
    }
  }

  // --- Tier 2: Alpha Vantage OVERVIEW function ---
  if (avKey) {
    try {
      // Skip rate limiter — OVERVIEW is independent from TIME_SERIES calls
      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${avKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data['Note'] && !data['Information'] && data['Symbol']) {
        const fundamentals: FundamentalRatios = {
          peRatio: data['TrailingPE'] ? parseFloat(data['TrailingPE']) : null,
          pegRatio: data['PEGRatio'] ? parseFloat(data['PEGRatio']) : null,
          fiftyTwoWeekChange: null,
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
        fundamentalsCache.set(ticker, { data: fundamentals, expiry: Date.now() + CACHE_TTL });
        return res.json({ success: true, data: fundamentals } satisfies ApiResponse<FundamentalRatios>);
      }
    } catch (err) {
      // AV OVERVIEW failed, fall through to Yahoo
    }
  }

  // --- Tier 3: Yahoo Finance quoteSummary (no API key needed, uses crumb) ---
  try {
    const auth = await getYahooCrumb();
    if (auth) {
      const summaryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,summaryDetail,assetProfile,financialData,price&crumb=${encodeURIComponent(auth.crumb)}`;
      const summaryRes = await fetch(summaryUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 OrbitTerminal/1.0', 'Cookie': auth.cookie },
      });
      const summaryData = await summaryRes.json();
      const result = summaryData?.quoteSummary?.result?.[0];
      if (result) {
        const stats = result.defaultKeyStatistics || {};
        const detail = result.summaryDetail || {};
        const profile = result.assetProfile || {};
        const financial = result.financialData || {};
        const price = result.price || {};

        const fundamentals: FundamentalRatios = {
          peRatio: detail.trailingPE?.raw ?? stats.trailingPE?.raw ?? null,
          pegRatio: stats.pegRatio?.raw ?? null,
          fiftyTwoWeekChange: stats['52WeekChange']?.raw ?? null,
          debtToEquity: financial.debtToEquity?.raw ? financial.debtToEquity.raw / 100 : null,
          marketCap: price.marketCap?.raw ?? detail.marketCap?.raw ?? null,
          beta: stats.beta?.raw ?? null,
          roe: financial.returnOnEquity?.raw ?? null,
          eps: stats.trailingEps?.raw ?? null,
          dividendYield: detail.dividendYield?.raw ?? null,
          currentRatio: financial.currentRatio?.raw ?? null,
          companyName: price.shortName || price.longName || ticker,
          sector: profile.sector || 'Unknown',
          lastUpdated: new Date().toISOString(),
        };
        fundamentalsCache.set(ticker, { data: fundamentals, expiry: Date.now() + CACHE_TTL });
        return res.json({ success: true, data: fundamentals } satisfies ApiResponse<FundamentalRatios>);
      }
    }
  } catch {
    // Yahoo quoteSummary failed, try chart meta as last resort
  }

  // --- Tier 4: Yahoo Finance chart meta (company name only, all ratios null) ---
  try {
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
        fiftyTwoWeekChange: null,
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
      return res.json({ success: true, data: fundamentals } satisfies ApiResponse<FundamentalRatios>);
    }
  } catch (err) {
    // Yahoo Finance failed
  }

  res.status(500).json({ success: false, error: 'All providers failed for fundamentals' } satisfies ApiResponse<never>);
});

// ─── Ticker search (FMP → AV → Yahoo Finance fallback) ───
router.get('/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;

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
        return res.json({ success: true, data: results } satisfies ApiResponse<typeof results>);
      }
    } catch (err) {
      // FMP search failed, fall through to AV
    }
  }

  // --- Fallback to Alpha Vantage Search ---
  if (avKey) {
    try {
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
        return res.json({ success: true, data: results } satisfies ApiResponse<typeof results>);
      }
    } catch (err) {
      // AV search failed, fall through to Yahoo
    }
  }

  // --- Fallback: Yahoo Finance (no API key needed) ---
  try {
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
      return res.json({ success: true, data: results } satisfies ApiResponse<typeof results>);
    }
  } catch (err) {
    // Yahoo search failed
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
  const hasFH = apiKeys.has('finnhub');
  res.json({ success: true, data: { alpha_vantage: hasAV, fmp: hasFMP, finnhub: hasFH } } satisfies ApiResponse<any>);
});

export default router;
