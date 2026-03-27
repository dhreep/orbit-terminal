import React from 'react';
import type { FundamentalRatios } from '@orbit/shared';

interface RatioSidebarProps {
  data: FundamentalRatios | null;
  loading: boolean;
  error?: Error | null;
}

function formatNumber(value: number | null, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return value.toFixed(decimals);
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${(value * 100).toFixed(2)}%`;
}

function getRatioColor(label: string, value: number | null): string {
  if (value === null) return 'text-muted-foreground';
  switch (label) {
    case 'P/E': return value < 15 ? 'text-orbit-gain' : value < 25 ? 'text-primary' : 'text-orbit-loss';
    case '52W': return value > 0 ? 'text-orbit-gain' : 'text-orbit-loss';
    case 'D/E': return value < 1 ? 'text-orbit-gain' : value < 2 ? 'text-primary' : 'text-orbit-loss';
    case 'ROE': return value > 0.15 ? 'text-orbit-gain' : value > 0.05 ? 'text-primary' : 'text-orbit-loss';
    case 'C/R': return value > 1.5 ? 'text-orbit-gain' : value > 1 ? 'text-primary' : 'text-orbit-loss';
    default: return 'text-foreground';
  }
}

export function RatioSidebar({ data, loading, error }: RatioSidebarProps) {
  if (loading) {
    return (
      <>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col">
            <div className="skeleton w-12 h-3 mb-1" />
            <div className="skeleton w-8 h-4" />
          </div>
        ))}
      </>
    );
  }

  if (error && !data) {
    const msg = error.message?.toLowerCase() || '';
    const isRateLimited = msg.includes('429') || msg.includes('rate') || msg.includes('timeout');
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <span className="material-symbols-outlined text-primary animate-pulse !text-xl">
          {isRateLimited ? 'hourglass_top' : 'error_outline'}
        </span>
        <p className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">
          {isRateLimited ? 'Rate limited' : 'Data unavailable'}
        </p>
        <p className="text-[8px] font-mono text-muted-foreground/50">
          {isRateLimited ? 'Retrying...' : 'Check API keys'}
        </p>
      </div>
    );
  }

  const ratios = [
    { label: 'P/E', value: data?.peRatio, format: (v: number | null) => formatNumber(v) },
    { label: '52W', value: data?.fiftyTwoWeekChange, format: (v: number | null) => formatPercent(v) },
    { label: 'D/E', value: data?.debtToEquity, format: (v: number | null) => formatNumber(v) },
    { label: 'ROE', value: data?.roe, format: (v: number | null) => formatPercent(v) },
    { label: 'EPS', value: data?.eps, format: (v: number | null) => formatNumber(v) },
    { label: 'C/R', value: data?.currentRatio, format: (v: number | null) => formatNumber(v) },
  ];

  return (
    <>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground border-b border-border pb-1 font-bold">
        Fundamentals
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {ratios.map((r) => (
          <div key={r.label} className="flex justify-between items-center">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{r.label}</span>
            <span className={`text-[12px] font-mono font-bold ${getRatioColor(r.label, r.value ?? null)}`}>
              {r.format(r.value ?? null)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-border pt-2 flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[10px] font-mono text-foreground">
          <span>BETA</span>
          <span className="font-bold">{formatNumber(data?.beta ?? null)}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-foreground">
          <span>MKT CAP</span>
          <span className="font-bold text-primary">{formatNumber(data?.marketCap ?? null, 0)}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-foreground">
          <span>DIV YIELD</span>
          <span className="font-bold">{formatPercent(data?.dividendYield ?? null)}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-foreground">
          <span>SECTOR</span>
          <span className="font-bold text-orbit-info text-[9px] truncate max-w-[80px]" title={data?.sector}>{data?.sector ?? '—'}</span>
        </div>
      </div>
    </>
  );
}
