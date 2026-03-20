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
  if (value === null) return 'text-on-surface-variant';
  
  switch (label) {
    case 'P/E':
      if (value < 15) return 'text-success';
      if (value < 25) return 'text-primary-container';
      return 'text-error';
    case 'PEG':
      if (value < 1) return 'text-success';
      if (value < 2) return 'text-primary-container';
      return 'text-error';
    case 'D/E':
      if (value < 1) return 'text-success';
      if (value < 2) return 'text-primary-container';
      return 'text-error';
    case 'ROE':
      if (value > 0.15) return 'text-success';
      if (value > 0.05) return 'text-primary-container';
      return 'text-error';
    case 'C/R':
      if (value > 1.5) return 'text-success';
      if (value > 1) return 'text-primary-container';
      return 'text-error';
    default:
      return 'text-on-surface';
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
        <p className="text-[9px] font-mono tracking-wider text-on-surface-variant uppercase">
          {isRateLimited ? 'Rate limited' : 'Data unavailable'}
        </p>
        <p className="text-[8px] font-mono text-on-surface-variant/50">
          {isRateLimited ? 'Retrying...' : 'Check API keys'}
        </p>
      </div>
    );
  }

  const ratios = [
    { label: 'P/E', value: data?.peRatio, format: (v: number | null) => formatNumber(v) },
    { label: 'PEG', value: data?.pegRatio, format: (v: number | null) => formatNumber(v) },
    { label: 'D/E', value: data?.debtToEquity, format: (v: number | null) => formatNumber(v) },
    { label: 'ROE', value: data?.roe, format: (v: number | null) => formatPercent(v) },
    { label: 'EPS', value: data?.eps, format: (v: number | null) => formatNumber(v) },
    { label: 'C/R', value: data?.currentRatio, format: (v: number | null) => formatNumber(v) },
  ];

  return (
    <>
      <div className="text-[9px] uppercase tracking-wider text-on-surface-variant border-b border-surface-variant/15 pb-1 font-bold">
        Fundamentals
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {ratios.map((r) => (
          <div key={r.label} className="flex justify-between items-center">
            <span className="text-[9px] uppercase tracking-wider text-on-surface-variant">{r.label}</span>
            <span className={`text-[12px] mono font-bold ${getRatioColor(r.label, r.value ?? null)}`}>
              {r.format(r.value ?? null)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-surface-variant/15 pt-2 flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[10px] mono text-on-surface">
          <span>BETA</span>
          <span className="font-bold">{formatNumber(data?.beta ?? null)}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] mono text-on-surface">
          <span>MKT CAP</span>
          <span className="font-bold text-primary">{formatNumber(data?.marketCap ?? null, 0)}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] mono text-on-surface">
          <span>DIV YIELD</span>
          <span className="font-bold">{formatPercent(data?.dividendYield ?? null)}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] mono text-on-surface">
          <span>SECTOR</span>
          <span className="font-bold text-tertiary text-[9px] truncate max-w-[80px]" title={data?.sector}>{data?.sector ?? '—'}</span>
        </div>
      </div>
    </>
  );
}

