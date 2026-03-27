import { useMemo } from 'react';
import { SMA, EMA, RSI, MACD, BollingerBands } from 'trading-signals';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CandleData } from '@orbit/shared';

interface IndicatorOverlayProps {
  data: CandleData[];
  indicators: string[];
  timeRange?: string;
}

interface IndicatorValue {
  label: string;
  value: string;
  color?: string;
}

function computeIndicators(data: CandleData[], selected: string[]): IndicatorValue[] {
  if (data.length < 2) return [];
  const closes = data.map((c) => c.close);
  const results: IndicatorValue[] = [];

  try {
    if (selected.includes('sma20')) {
      const sma = new SMA(20);
      closes.forEach((c) => sma.update(c, false));
      const r = sma.getResult();
      if (r != null) results.push({ label: 'SMA(20)', value: r.toFixed(2) });
    }

    if (selected.includes('ema12')) {
      const ema = new EMA(12);
      closes.forEach((c) => ema.update(c, false));
      if (ema.isStable) results.push({ label: 'EMA(12)', value: ema.getResultOrThrow().toFixed(2) });
    }

    if (selected.includes('ema26')) {
      const ema = new EMA(26);
      closes.forEach((c) => ema.update(c, false));
      if (ema.isStable) results.push({ label: 'EMA(26)', value: ema.getResultOrThrow().toFixed(2) });
    }

    if (selected.includes('rsi')) {
      const rsi = new RSI(14);
      closes.forEach((c) => rsi.update(c, false));
      const r = rsi.getResult();
      if (r != null) {
        results.push({
          label: 'RSI(14)',
          value: r.toFixed(1),
          color: r > 70 ? 'text-red-400' : r < 30 ? 'text-green-400' : undefined,
        });
      }
    }

    if (selected.includes('macd')) {
      const short = new EMA(12);
      const long = new EMA(26);
      const signal = new EMA(9);
      const macd = new MACD(short, long, signal);
      closes.forEach((c) => macd.update(c, false));
      const r = macd.getResult();
      if (r) {
        const hist = r.histogram;
        results.push({
          label: 'MACD',
          value: hist.toFixed(2),
          color: hist > 0 ? 'text-green-400' : 'text-red-400',
        });
      }
    }

    if (selected.includes('bb')) {
      const bb = new BollingerBands(20, 2);
      closes.forEach((c) => bb.update(c, false));
      const r = bb.getResult();
      if (r) {
        results.push({ label: 'BB↑', value: r.upper.toFixed(2) });
        results.push({ label: 'BB↓', value: r.lower.toFixed(2) });
      }
    }
  } catch {
    // insufficient data for some indicators — silently skip
  }

  return results;
}

export function IndicatorOverlay({ data, indicators, timeRange }: IndicatorOverlayProps) {
  const values = useMemo(() => computeIndicators(data, indicators), [data, indicators]);

  if (indicators.length === 0 || values.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1 bg-card border-t border-border">
      {timeRange && (
        <span className="text-[8px] font-mono text-muted-foreground/50 mr-1">{timeRange}·{data.length}pts</span>
      )}
      {values.map((v) => (
        <Badge key={v.label} variant="outline" className={cn('text-[9px] font-mono px-1.5 py-0 h-4', v.color ?? 'text-muted-foreground')}>
          {v.label}: {v.value}
        </Badge>
      ))}
    </div>
  );
}
