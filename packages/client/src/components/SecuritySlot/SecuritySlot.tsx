import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { PriceChart } from './PriceChart';
import { RatioSidebar } from './RatioSidebar';
import { TradeThesis } from './TradeThesis';
import { TickerSearch } from './TickerSearch';
import type { SlotState, ChartMode } from '@orbit/shared';

interface SecuritySlotProps {
  slot: SlotState;
  onTickerChange: (ticker: string) => void;
  onTickerClear: () => void;
  onChartModeToggle: () => void;
  isSpotlight?: boolean;
}

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

export function SecuritySlot({ slot, onTickerChange, onTickerClear, onChartModeToggle, isSpotlight }: SecuritySlotProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');

  const { data: candles, isLoading: candlesLoading, error: candlesError } = useQuery({
    queryKey: ['candles', slot.ticker, timeRange],
    queryFn: () => api.market.getCandles(slot.ticker!, timeRange),
    enabled: !!slot.ticker,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(15000 * (attemptIndex + 1), 60000),
  });

  const { data: fundamentals, isLoading: fundamentalsLoading, error: fundamentalsError } = useQuery({
    queryKey: ['fundamentals', slot.ticker],
    queryFn: () => api.market.getFundamentals(slot.ticker!),
    enabled: !!slot.ticker,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(15000 * (attemptIndex + 1), 60000),
  });

  // Empty slot state
  if (!slot.ticker) {
    return (
      <section className="flex flex-col bg-surface-container-low border border-surface-variant/15 overflow-hidden">
        <header className="h-8 flex items-center justify-between px-2 bg-surface border-b border-surface-variant/15">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-primary tracking-tighter mono">SLOT_{String(slot.id + 1).padStart(2, '0')}</span>
            <TickerSearch currentTicker={null} onSelect={onTickerChange} />
          </div>
        </header>

        <div className="flex flex-grow overflow-hidden bg-surface-container-lowest items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-3 opacity-20">📡</div>
            <p className="text-[11px] font-mono tracking-widest uppercase text-on-surface-variant">Search for a ticker to begin</p>
          </div>
        </div>
      </section>
    );
  }

  const displayName = fundamentals?.companyName || slot.ticker;
  const TIME_RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', '5Y'];

  return (
    <section className="flex flex-col bg-surface-container-low border border-surface-variant/15 overflow-hidden">
      <header className="h-8 flex items-center justify-between px-2 bg-surface border-b border-surface-variant/15">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-primary tracking-tighter mono">SLOT_{String(slot.id + 1).padStart(2, '0')}</span>
          <TickerSearch currentTicker={slot.ticker} onSelect={onTickerChange} />
          {/* Company name */}
          <span className="text-[10px] mono text-tertiary truncate max-w-[180px] hidden sm:inline" title={displayName}>
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Time range selector */}
          <div className="flex items-center border border-surface-variant/15 mr-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider transition-all ${
                  timeRange === range
                    ? 'bg-primary-container/20 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={onTickerClear}
            className="p-0.5 text-on-surface-variant hover:text-error transition-colors"
            title="Clear ticker"
          >
            <span className="material-symbols-outlined !text-sm">close</span>
          </button>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* Chart area */}
        <div className="flex-1 bg-surface-container-lowest relative flex items-end overflow-hidden">
          {candlesLoading ? (
            <div className="w-full h-full flex flex-col justify-center items-center">
              <div className="skeleton w-24 h-4 mx-auto mb-2" />
              <div className="skeleton w-16 h-3 mx-auto" />
            </div>
          ) : candles && candles.length > 0 ? (
            <PriceChart
              data={candles}
              mode={slot.chartMode}
              onToggleMode={onChartModeToggle}
              ticker={slot.ticker}
            />
          ) : candlesError ? (
            <div className="w-full h-full flex flex-col justify-center items-center gap-2">
              <span className="material-symbols-outlined text-primary animate-pulse !text-2xl">sync</span>
              <p className="text-[11px] font-mono tracking-widest text-on-surface-variant uppercase">
                {(candlesError as Error).message?.includes('429') || (candlesError as Error).message?.includes('rate')
                  ? 'Rate limited — retrying...'
                  : 'Loading chart data...'}
              </p>
              <p className="text-[9px] font-mono text-on-surface-variant/50">Free tier: 5 calls/min</p>
            </div>
          ) : (
            <div className="w-full h-full flex justify-center items-center">
              <p className="text-[11px] font-mono tracking-widest text-on-surface-variant">
                No chart data available
              </p>
            </div>
          )}
        </div>

        {/* Fundamentals sidebar */}
        <div className="w-[140px] min-w-[140px] bg-surface-container-low border-l border-surface-variant/15 p-2 flex flex-col gap-2 overflow-y-auto">
          <RatioSidebar data={fundamentals || null} loading={fundamentalsLoading} error={fundamentalsError as Error | null} />
        </div>
      </div>

      <footer className="bg-surface border-t border-surface-variant/15">
        <TradeThesis slotId={slot.id} ticker={slot.ticker} />
      </footer>
    </section>
  );
}
