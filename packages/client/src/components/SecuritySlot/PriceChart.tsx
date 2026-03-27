import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, ColorType, Time } from 'lightweight-charts';
import type { CandleData, ChartMode } from '@orbit/shared';

interface PriceChartProps {
  data: CandleData[];
  mode: ChartMode;
  onToggleMode: () => void;
  ticker: string;
}

export function PriceChart({ data, mode, onToggleMode, ticker }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
  const modeRef = useRef<ChartMode>(mode);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isLight = document.documentElement.classList.contains('light');
    const bgColor = isLight ? '#ffffff' : '#0b0e11';
    const textColor = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(234,236,239,0.6)';
    const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(79,70,51,0.15)';
    const borderColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(79,70,51,0.4)';
    const crossColor = isLight ? 'rgba(240,185,11,0.4)' : 'rgba(240,185,11,0.3)';

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor,
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        vertLine: { color: crossColor, style: 2 },
        horzLine: { color: crossColor, style: 2 },
      },
      rightPriceScale: {
        borderColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor,
        timeVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      try { chart.remove(); } catch (_) { /* already disposed */ }
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      try { chart.removeSeries(seriesRef.current); } catch (_) { /* safe */ }
      seriesRef.current = null;
    }

    // Deduplicate by time and ensure ascending order
    const deduped = [...new Map(data.map(d => [d.time, d])).values()]
      .sort((a, b) => a.time.localeCompare(b.time));

    if (mode === 'candle') {
      const series = chart.addCandlestickSeries({
        upColor: '#6cd2ff',
        downColor: '#ffb4ab',
        borderDownColor: '#ffb4ab',
        borderUpColor: '#6cd2ff',
        wickDownColor: '#ffb4ab',
        wickUpColor: '#6cd2ff',
      });
      series.setData(deduped.map((d) => ({ time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close })));
      seriesRef.current = series;
    } else {
      const series = chart.addLineSeries({
        color: '#f0b90b',
        lineWidth: 2,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: '#f0b90b',
      });
      series.setData(deduped.map((d) => ({ time: d.time as Time, value: d.close })));
      seriesRef.current = series;
    }

    chart.timeScale().fitContent();
    modeRef.current = mode;
  }, [mode, data]);

  const latestPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const previousPrice = data.length > 1 ? data[data.length - 2].close : latestPrice;
  const changePct = previousPrice > 0 ? ((latestPrice - previousPrice) / previousPrice) * 100 : 0;
  const isPositive = changePct >= 0;

  return (
    <div className="relative w-full h-full flex-1">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--orbit-surface-3) 1px, transparent 1px), linear-gradient(90deg, var(--orbit-surface-3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="absolute top-2 left-2 flex flex-col pointer-events-none z-10">
        <span className="text-[24px] font-mono font-bold text-foreground">
          {latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`text-[11px] font-mono ${isPositive ? 'text-orbit-gain' : 'text-orbit-loss'}`}>
          {isPositive ? '+' : ''}{changePct.toFixed(2)}% {isPositive ? '↑' : '↓'}
        </span>
      </div>

      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        <span className="text-[10px] font-mono px-1.5 py-0.5 border border-border uppercase tracking-widest font-bold bg-primary/10 text-primary">
          {ticker}
        </span>
        <button
          onClick={onToggleMode}
          aria-label={mode === 'candle' ? 'Switch to line chart' : 'Switch to candlestick chart'}
          className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 transition-all hover:opacity-80 border border-border bg-secondary text-muted-foreground cursor-pointer z-30"
        >
          {mode === 'candle' ? '📊 Candle' : '📈 Line'}
        </button>
      </div>

      <div ref={containerRef} className="w-full h-full relative z-0" />
    </div>
  );
}
