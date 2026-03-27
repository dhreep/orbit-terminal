import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX, dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
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
  const [input, setInput] = useState('AAPL, MSFT, GOOGL');
  const [tickers, setTickers] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [loading, setLoading] = useState(false);

  const compute = useCallback(async () => {
    const list = input.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean).slice(0, 6);
    if (list.length < 2) return;
    setLoading(true);
    try {
      const candleData = await Promise.all(
        list.map((t) => api.market.getCandles(t, '3M'))
      );
      const returns = candleData.map((candles) => dailyReturns(candles.map((c) => c.close)));
      const n = list.length;
      const corr: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          corr[i][j] = i === j ? 1 : pearsonCorrelation(returns[i], returns[j]);
        }
      }
      setTickers(list);
      setMatrix(corr);
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <Card className="h-full border-0 rounded-none bg-surface-container-lowest">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined !text-base">grid_on</span>
          Correlation Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AAPL, MSFT, GOOGL (2-6 tickers)"
            className="flex-1 h-8 text-xs font-mono uppercase"
            aria-label="Tickers for correlation"
          />
          <Button size="sm" onClick={compute} disabled={loading}>
            {loading ? 'Computing…' : 'Compute'}
          </Button>
        </div>

        {tickers.length > 0 && matrix.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr>
                  <th className="p-2 text-left text-muted-foreground" />
                  {tickers.map((t) => (
                    <th key={t} className="p-2 text-center font-bold">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickers.map((t, i) => (
                  <tr key={t}>
                    <td className="p-2 font-bold">{t}</td>
                    {matrix[i].map((v, j) => (
                      <td key={j} className={`p-2 text-center rounded ${corrColor(v)}`}>
                        {v.toFixed(2)}
                      </td>
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
          !loading && <p className="text-center text-muted-foreground text-xs py-8">Enter 2-6 tickers to compute correlations</p>
        )}
      </CardContent>
    </Card>
  );
}
