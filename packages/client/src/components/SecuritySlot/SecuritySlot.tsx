import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { PriceChart } from './PriceChart';
import { RatioSidebar } from './RatioSidebar';
import { TradeThesis } from './TradeThesis';
import { TickerSearch } from './TickerSearch';
import { IndicatorOverlay } from './IndicatorOverlay';
import { IndicatorSelector } from './IndicatorSelector';
import { NewsFeed } from './NewsFeed';
import type { SlotState, ChartMode } from '@orbit/shared';

interface SecuritySlotProps {
  slot: SlotState;
  onTickerChange: (ticker: string) => void;
  onTickerClear: () => void;
  onChartModeToggle: () => void;
  isSpotlight?: boolean;
  dragHandle?: React.ReactNode;
}

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';
type SlotTab = 'chart' | 'news';

export function SecuritySlot({ slot, onTickerChange, onTickerClear, onChartModeToggle, isSpotlight, dragHandle }: SecuritySlotProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');
  const [indicators, setIndicators] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<SlotTab>('chart');
  const [showIndicatorSelector, setShowIndicatorSelector] = useState(false);

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

  const queryClient = useQueryClient();
  const addToWatchlist = useMutation({
    mutationFn: (ticker: string) => api.watchlist.add(ticker),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  if (!slot.ticker) {
    return (
      <section className="flex flex-col h-full min-h-0 bg-card border border-border">
        <header className="h-8 flex items-center justify-between px-2 bg-secondary border-b border-border relative z-20">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-primary tracking-tighter font-mono">SLOT_{String(slot.id + 1).padStart(2, '0')}</span>
            <TickerSearch currentTicker={null} onSelect={onTickerChange} />
          </div>
        </header>
        <div className="flex flex-grow overflow-hidden bg-background items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-3 opacity-20">📡</div>
            <p className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground">Search for a ticker to begin</p>
          </div>
        </div>
      </section>
    );
  }

  const displayName = fundamentals?.companyName || slot.ticker;
  const TIME_RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', '5Y'];

  return (
    <section className="flex flex-col h-full min-h-0 bg-card border border-border">
      <header className="h-8 flex items-center justify-between px-2 bg-secondary border-b border-border relative z-20">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-primary tracking-tighter font-mono">SLOT_{String(slot.id + 1).padStart(2, '0')}</span>
          <TickerSearch currentTicker={slot.ticker} onSelect={onTickerChange} />
          <span className="text-[10px] font-mono text-orbit-info truncate max-w-[180px] hidden sm:inline" title={displayName}>
            {displayName}
          </span>
          <button
            onClick={() => addToWatchlist.mutate(slot.ticker!)}
            className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
            title="Add to watchlist"
            aria-label="Add to watchlist"
          >
            <span className="material-symbols-outlined !text-sm">bookmark_add</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center border border-border mr-1">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider transition-all ${activeTab === 'chart' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
            >
              CHART
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider transition-all ${activeTab === 'news' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
            >
              NEWS
            </button>
          </div>
          <button
            onClick={() => setShowIndicatorSelector(!showIndicatorSelector)}
            className={`p-0.5 transition-colors ${showIndicatorSelector ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            title="Technical Indicators"
          >
            <span className="material-symbols-outlined !text-sm">analytics</span>
          </button>
          <div className="flex items-center border border-border mr-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider transition-all ${
                  timeRange === range ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={onTickerClear}
            className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
            title="Clear ticker"
          >
            <span className="material-symbols-outlined !text-sm">close</span>
          </button>
        </div>
      </header>

      {showIndicatorSelector && (
        <div className="px-2 py-1 bg-secondary border-b border-border overflow-x-auto">
          <IndicatorSelector selected={indicators} onChange={setIndicators} />
        </div>
      )}

      <div className="flex flex-grow overflow-hidden">
        <div className="flex-1 bg-background relative flex flex-col overflow-hidden">
          {activeTab === 'news' ? (
            <NewsFeed ticker={slot.ticker} />
          ) : (
            <>
              <div className="flex-1 relative flex items-end overflow-hidden">
                {candlesLoading ? (
                  <div className="w-full h-full flex flex-col justify-center items-center">
                    <div className="skeleton w-24 h-4 mx-auto mb-2" />
                    <div className="skeleton w-16 h-3 mx-auto" />
                  </div>
                ) : candles && candles.length > 0 ? (
                  <PriceChart data={candles} mode={slot.chartMode} onToggleMode={onChartModeToggle} ticker={slot.ticker} />
                ) : candlesError ? (
                  <div className="w-full h-full flex flex-col justify-center items-center gap-2">
                    <span className="material-symbols-outlined text-primary animate-pulse !text-2xl">sync</span>
                    <p className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
                      {(candlesError as Error).message?.includes('429') || (candlesError as Error).message?.includes('rate')
                        ? 'Rate limited — retrying...'
                        : 'Loading chart data...'}
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground/50">Free tier: 5 calls/min</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                    <p className="text-[11px] font-mono tracking-widest text-muted-foreground">No chart data available</p>
                  </div>
                )}
              </div>
              {candles && candles.length > 0 && indicators.length > 0 && (
                <IndicatorOverlay data={candles} indicators={indicators} timeRange={timeRange} />
              )}
            </>
          )}
        </div>

        <div className="w-[140px] min-w-[140px] bg-card border-l border-border p-2 flex flex-col gap-2 overflow-y-auto">
          <RatioSidebar data={fundamentals || null} loading={fundamentalsLoading} error={fundamentalsError as Error | null} />
        </div>
      </div>

      <footer className="bg-secondary border-t border-border">
        <div className="flex items-start gap-1">
          <div className="flex-1 min-w-0">
            <TradeThesis slotId={slot.id} ticker={slot.ticker} />
          </div>
          {dragHandle}
        </div>
      </footer>
    </section>
  );
}
