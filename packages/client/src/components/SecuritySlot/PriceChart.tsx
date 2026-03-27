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

  // Create chart ONCE on mount, clean up on unmount
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#191c1f' },
        textColor: 'rgba(234, 236, 239, 0.6)',
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(79, 70, 51, 0.15)' },
        horzLines: { color: 'rgba(79, 70, 51, 0.15)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(240, 185, 11, 0.3)', style: 2 },
        horzLine: { color: 'rgba(240, 185, 11, 0.3)', style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(79, 70, 51, 0.4)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(79, 70, 51, 0.4)',
        timeVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      try { chart.remove(); } catch (_) { /* already disposed */ }
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Handle mode changes: remove old series, create new one, set data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Remove old series if mode changed or first render
    if (seriesRef.current) {
      try { chart.removeSeries(seriesRef.current); } catch (_) { /* safe */ }
      seriesRef.current = null;
    }

    if (mode === 'candle') {
      const series = chart.addCandlestickSeries({
        upColor: '#b1e4ff',
        downColor: '#ffb4ab',
        borderDownColor: '#ffb4ab',
        borderUpColor: '#b1e4ff',
        wickDownColor: '#ffb4ab',
        wickUpColor: '#b1e4ff',
      });
      const chartData: CandlestickData[] = data.map((d) => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      series.setData(chartData);
      seriesRef.current = series;
    } else {
      const series = chart.addLineSeries({
        color: '#f0b90b',
        lineWidth: 2,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: '#f0b90b',
      });
      const chartData: LineData[] = data.map((d) => ({
        time: d.time as Time,
        value: d.close,
      }));
      series.setData(chartData);
      seriesRef.current = series;
    }

    chart.timeScale().fitContent();
    modeRef.current = mode;
  }, [mode, data]);

  // Determine the latest close price and daily change for the overlay string
  const latestPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const previousPrice = data.length > 1 ? data[data.length - 2].close : latestPrice;
  const changePct = previousPrice > 0 ? ((latestPrice - previousPrice) / previousPrice) * 100 : 0;
  const isPositive = changePct >= 0;

  return (
    <div className="relative w-full h-full flex-1">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#323538 1px, transparent 1px), linear-gradient(90deg, #323538 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {/* Data Overlay */}
      <div className="absolute top-2 left-2 flex flex-col pointer-events-none z-10">
        <span className="text-[24px] font-mono font-bold text-on-surface">
          {latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`text-[11px] font-mono ${isPositive ? 'text-success' : 'text-error'}`}>
          {isPositive ? '+' : ''}{changePct.toFixed(2)}% {isPositive ? '↑' : '↓'}
        </span>
      </div>

      {/* Chart mode toggle */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        <span className="text-[10px] font-mono px-1.5 py-0.5 border border-surface-variant/15 uppercase tracking-widest font-bold bg-primary-container/10 text-primary">
          {ticker}
        </span>
        <button
          onClick={onToggleMode}
          aria-label={mode === 'candle' ? 'Switch to line chart' : 'Switch to candlestick chart'}
          className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 transition-all hover:opacity-80 border border-surface-variant/15 bg-surface-dim text-on-surface-variant cursor-pointer z-30"
        >
          {mode === 'candle' ? '📊 Candle' : '📈 Line'}
        </button>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="w-full h-full relative z-0" />
    </div>
  );
}
