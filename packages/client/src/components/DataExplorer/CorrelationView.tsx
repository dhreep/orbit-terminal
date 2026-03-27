import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TickerAutocomplete } from '@/components/shared/TickerAutocomplete';
import { api } from '@/services/api';

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX, dy = y[i] - meanY;
    num += dx * dy; denX += dx * dx; denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function dailyReturns(closes: number[]): number[] {
  return closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
}

function corrColor(v: number): string {
  if (v >= 0.7) return 'bg-green-500/40 text-green-300';
  if (v >= 0.3) return 'bg-green-500/20 text-green-400';
  if (v > -0.3) return 'bg-muted text-muted-foreground';
  if (v > -0.7) return 'bg-red-500/20 text-red-400';
  return 'bg-red-500/40 text-red-300';
}

export function CorrelationView() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [loading, setLoading] = useState(false);

  const addTicker = useCallback((ticker: string) => {
    const t = ticker.toUpperCase();
    if (tickers.length >= 6 || tickers.includes(t)) return;
    setTickers(prev => [...prev, t]);
  }, [tickers]);

  const removeTicker = useCallback((ticker: string) => {
    setTickers(prev => prev.filter(t => t !== ticker));
    setMatrix([]);
  }, []);

  const compute = useCallback(async () => {
    if (tickers.length < 2) return;
    setLoading(true);
    try {
      const candleData = await Promise.all(tickers.map(t => api.market.getCandles(t, '3M')));
      const returns = candleData.map(candles => dailyReturns(candles.map(c => c.close)));
      const n = tickers.length;
      const corr: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          corr[i][j] = i === j ? 1 : pearsonCorrelation(returns[i], returns[j]);
      setMatrix(corr);
    } finally {
      setLoading(false);
    }
  }, [tickers]);

  return (
    <Card className="h-full border-0 rounded-none bg-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined !text-base">grid_on</span>
          Correlation Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
            {tickers.map(t => (
              <Badge key={t} variant="secondary" className="text-xs font-mono gap-1 pl-2 pr-1 py-0.5 cursor-pointer hover:bg-destructive/20" onClick={() => removeTicker(t)}>
                {t}
                <span className="material-symbols-outlined !text-[14px] text-muted-foreground hover:text-destructive">close</span>
              </Badge>
            ))}
            {tickers.length < 6 && (
              <TickerAutocomplete
                value=""
                onChange={addTicker}
                placeholder={tickers.length === 0 ? 'Search ticker to add…' : 'Add more…'}
                className="h-7 text-xs w-40"
              />
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-muted-foreground font-mono">{tickers.length}/6 tickers</span>
            <Button size="sm" onClick={compute} disabled={loading || tickers.length < 2}>
              {loading ? 'Computing…' : 'Compute'}
            </Button>
          </div>
        </div>

        {tickers.length > 0 && matrix.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr>
                  <th className="p-2 text-left text-muted-foreground" />
                  {tickers.map(t => <th key={t} className="p-2 text-center font-bold">{t}</th>)}
                </tr>
              </thead>
              <tbody>
                {tickers.map((t, i) => (
                  <tr key={t}>
                    <td className="p-2 font-bold">{t}</td>
                    {matrix[i].map((v, j) => (
                      <td key={j} className={`p-2 text-center rounded ${corrColor(v)}`}>{v.toFixed(2)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 mt-3 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">Green = positive</Badge>
              <Badge variant="outline" className="text-[10px]">Red = negative</Badge>
            </div>
          </div>
        ) : (
          !loading && <p className="text-center text-muted-foreground text-xs py-8">Add 2-6 tickers to compute correlations</p>
        )}
      </CardContent>
    </Card>
  );
}
