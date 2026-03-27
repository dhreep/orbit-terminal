import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import type { WatchlistItem, CandleData } from '@orbit/shared';

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60, h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} className={cn('shrink-0', up ? 'text-green-400' : 'text-red-400')}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function WatchlistRow({ item, onRemove }: { item: WatchlistItem; onRemove: (t: string) => void }) {
  const { data: candles } = useQuery({
    queryKey: ['candles', item.ticker, '1M'],
    queryFn: () => api.market.getCandles(item.ticker, '1M'),
    staleTime: 60_000,
  });

  const closes = candles?.map((c: CandleData) => c.close) ?? [];
  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  const change = last && prev ? ((last - prev) / prev) * 100 : null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors group">
      <span className="font-mono font-bold text-sm w-16 shrink-0">{item.ticker}</span>
      <Sparkline data={closes.slice(-20)} />
      <div className="ml-auto flex items-center gap-2">
        {last != null && <span className="text-xs font-mono">${last.toFixed(2)}</span>}
        {change != null && (
          <Badge variant={change >= 0 ? 'default' : 'destructive'} className="text-[10px] font-mono px-1.5">
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(item.ticker)}
          aria-label={`Remove ${item.ticker}`}
        >
          <span className="material-symbols-outlined !text-xs">close</span>
        </Button>
      </div>
    </div>
  );
}

interface WatchlistPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WatchlistPanel({ open, onOpenChange }: WatchlistPanelProps) {
  const [addInput, setAddInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.watchlist.getAll(),
  });

  const addMutation = useMutation({
    mutationFn: (ticker: string) => api.watchlist.add(ticker),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlist'] }); setAddInput(''); setShowAdd(false); },
  });

  const removeMutation = useMutation({
    mutationFn: (ticker: string) => api.watchlist.remove(ticker),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const items = qc.getQueryData<WatchlistItem[]>(['watchlist']) || [];
      await Promise.all(items.map(item => api.watchlist.remove(item.ticker)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (tickers: string[]) => api.watchlist.reorder(tickers),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const handleAdd = useCallback(() => {
    const t = addInput.trim().toUpperCase();
    if (t) addMutation.mutate(t);
  }, [addInput, addMutation]);

  const handleDrop = useCallback((targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const items = [...watchlist];
    const [moved] = items.splice(dragIdx, 1);
    items.splice(targetIdx, 0, moved);
    reorderMutation.mutate(items.map(w => w.ticker));
    setDragIdx(null);
    setOverIdx(null);
  }, [dragIdx, watchlist, reorderMutation]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-80 p-0 flex flex-col bg-popover">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-bold uppercase tracking-widest">Watchlist</SheetTitle>
            <div className="flex items-center gap-1">
              {watchlist.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => { if (confirm('Clear all tickers from watchlist?')) clearAllMutation.mutate(); }}
                  disabled={clearAllMutation.isPending}
                  aria-label="Clear all tickers"
                >
                  <span className="material-symbols-outlined !text-sm">delete_sweep</span>
                </Button>
              )}
              <Button variant="ghost" size="icon-xs" onClick={() => setShowAdd(!showAdd)} aria-label="Add ticker">
                <span className="material-symbols-outlined !text-sm">add</span>
              </Button>
            </div>
          </div>
          <SheetDescription className="text-xs">Track your favorite tickers</SheetDescription>
        </SheetHeader>

        {showAdd && (
          <div className="flex gap-1 px-3 py-2 border-b border-border/20">
            <Input
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="AAPL"
              className="h-7 text-xs font-mono uppercase"
              autoFocus
            />
            <Button size="xs" onClick={handleAdd} disabled={!addInput.trim()}>Add</Button>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-y-auto">
          {watchlist.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs py-8">No tickers in watchlist</p>
          ) : (
            watchlist.map((item, i) => (
              <div
                key={item.ticker}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                className={cn(
                  'cursor-grab active:cursor-grabbing transition-colors',
                  overIdx === i && dragIdx !== null && dragIdx !== i && 'border-t-2 border-primary',
                  dragIdx === i && 'opacity-40',
                )}
              >
                <WatchlistRow item={item} onRemove={(t) => removeMutation.mutate(t)} />
              </div>
            ))
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
