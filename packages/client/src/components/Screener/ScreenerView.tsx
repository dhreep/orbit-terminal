import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/services/api';
import type { FundamentalRatios, ScreenerFilter } from '@orbit/shared';

const FIELDS: { key: keyof FundamentalRatios; label: string }[] = [
  { key: 'peRatio', label: 'P/E Ratio' },
  { key: 'pegRatio', label: 'PEG Ratio' },
  { key: 'roe', label: 'ROE' },
  { key: 'debtToEquity', label: 'Debt/Equity' },
  { key: 'marketCap', label: 'Market Cap' },
  { key: 'eps', label: 'EPS' },
  { key: 'beta', label: 'Beta' },
  { key: 'dividendYield', label: 'Div Yield' },
  { key: 'currentRatio', label: 'Current Ratio' },
];

const OPS: { key: ScreenerFilter['operator']; label: string }[] = [
  { key: 'gt', label: '>' },
  { key: 'gte', label: '>=' },
  { key: 'lt', label: '<' },
  { key: 'lte', label: '<=' },
  { key: 'eq', label: '=' },
];

type Result = { ticker: string; companyName: string; ratios: FundamentalRatios };

function passesFilter(ratios: FundamentalRatios, f: ScreenerFilter): boolean {
  const val = ratios[f.field];
  if (val == null || typeof val !== 'number') return false;
  switch (f.operator) {
    case 'gt': return val > f.value;
    case 'gte': return val >= f.value;
    case 'lt': return val < f.value;
    case 'lte': return val <= f.value;
    case 'eq': return val === f.value;
  }
}

export function ScreenerView() {
  const [tickers, setTickers] = useState('');
  const [filters, setFilters] = useState<ScreenerFilter[]>([
    { field: 'peRatio', operator: 'lt', value: 20 },
  ]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const addFilter = () => setFilters((p) => [...p, { field: 'peRatio', operator: 'lt', value: 0 }]);
  const removeFilter = (i: number) => setFilters((p) => p.filter((_, idx) => idx !== i));
  const updateFilter = (i: number, patch: Partial<ScreenerFilter>) =>
    setFilters((p) => p.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const runScreen = useCallback(async () => {
    const list = tickers.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
    if (!list.length) return;
    setLoading(true);
    try {
      const fetched = await Promise.allSettled(
        list.map(async (ticker) => {
          const ratios = await api.market.getFundamentals(ticker);
          return { ticker, companyName: ratios.companyName, ratios };
        })
      );
      const all = fetched
        .filter((r): r is PromiseFulfilledResult<Result> => r.status === 'fulfilled')
        .map((r) => r.value);
      const filtered = all.filter((r) => filters.every((f) => passesFilter(r.ratios, f)));
      setResults(filtered);
    } finally {
      setLoading(false);
    }
  }, [tickers, filters]);

  return (
    <Card className="h-full border-0 rounded-none bg-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined !text-base">filter_alt</span>
          Stock Screener
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 overflow-hidden flex-1">
        {/* Ticker input */}
        <div className="flex gap-2">
          <Input
            value={tickers}
            onChange={(e) => setTickers(e.target.value)}
            placeholder="AAPL, MSFT, GOOGL, TSLA, NVDA"
            className="flex-1 h-8 text-xs font-mono uppercase"
            aria-label="Tickers to screen"
          />
          <Button size="sm" onClick={runScreen} disabled={loading || !tickers.trim()}>
            {loading ? 'Scanning…' : 'Screen'}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2">
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={f.field} onValueChange={(v) => updateFilter(i, { field: v as keyof FundamentalRatios })}>
                <SelectTrigger size="sm" className="w-32" aria-label="Filter field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map((fd) => (
                    <SelectItem key={fd.key} value={fd.key}>{fd.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={f.operator} onValueChange={(v) => updateFilter(i, { operator: v as ScreenerFilter['operator'] })}>
                <SelectTrigger size="sm" className="w-16" aria-label="Operator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPS.map((o) => (
                    <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={f.value}
                onChange={(e) => updateFilter(i, { value: Number(e.target.value) })}
                className="w-24 h-7 text-xs font-mono"
                aria-label="Filter value"
              />
              <Button variant="ghost" size="icon-xs" onClick={() => removeFilter(i)} aria-label="Remove filter">
                <span className="material-symbols-outlined !text-xs">close</span>
              </Button>
            </div>
          ))}
          <Button variant="outline" size="xs" onClick={addFilter} className="w-fit">
            <span className="material-symbols-outlined !text-xs">add</span> Add Filter
          </Button>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {results.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Ticker</TableHead>
                  <TableHead className="text-[10px]">Company</TableHead>
                  <TableHead className="text-[10px]">P/E</TableHead>
                  <TableHead className="text-[10px]">ROE</TableHead>
                  <TableHead className="text-[10px]">D/E</TableHead>
                  <TableHead className="text-[10px]">EPS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.ticker}>
                    <TableCell className="font-mono font-bold text-xs">{r.ticker}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{r.companyName}</TableCell>
                    <TableCell className="text-xs font-mono">{r.ratios.peRatio?.toFixed(1) ?? '—'}</TableCell>
                    <TableCell className="text-xs font-mono">{r.ratios.roe != null ? `${(r.ratios.roe * 100).toFixed(1)}%` : '—'}</TableCell>
                    <TableCell className="text-xs font-mono">{r.ratios.debtToEquity?.toFixed(2) ?? '—'}</TableCell>
                    <TableCell className="text-xs font-mono">{r.ratios.eps?.toFixed(2) ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            !loading && <p className="text-center text-muted-foreground text-xs py-8">Enter tickers and run screener</p>
          )}
          {results.length > 0 && (
            <div className="pt-2">
              <Badge variant="secondary" className="text-[10px]">{results.length} match{results.length !== 1 ? 'es' : ''}</Badge>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
