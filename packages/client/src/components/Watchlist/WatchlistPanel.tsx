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
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={up ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
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

  const handleAdd = useCallback(() => {
    const t = addInput.trim().toUpperCase();
    if (t) addMutation.mutate(t);
  }, [addInput, addMutation]);

  const handleMove = useCallback((index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= watchlist.length) return;
    const reordered = [...watchlist];
    [reordered[index], reordered[newIdx]] = [reordered[newIdx], reordered[index]];
    api.watchlist.reorder(reordered.map((w) => w.ticker));
    qc.invalidateQueries({ queryKey: ['watchlist'] });
  }, [watchlist, qc]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-80 p-0 flex flex-col bg-popover">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-bold uppercase tracking-widest">Watchlist</SheetTitle>
            <Button variant="ghost" size="icon-xs" onClick={() => setShowAdd(!showAdd)} aria-label="Add ticker">
              <span className="material-symbols-outlined !text-sm">add</span>
            </Button>
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
              <div key={item.ticker} className="flex items-center">
                <div className="flex flex-col">
                  <Button
                    variant="ghost" size="icon-xs"
                    className={cn('h-3 w-4', i === 0 && 'invisible')}
                    onClick={() => handleMove(i, -1)}
                    aria-label="Move up"
                  >
                    <span className="material-symbols-outlined !text-[10px]">expand_less</span>
                  </Button>
                  <Button
                    variant="ghost" size="icon-xs"
                    className={cn('h-3 w-4', i === watchlist.length - 1 && 'invisible')}
                    onClick={() => handleMove(i, 1)}
                    aria-label="Move down"
                  >
                    <span className="material-symbols-outlined !text-[10px]">expand_more</span>
                  </Button>
                </div>
                <div className="flex-1">
                  <WatchlistRow item={item} onRemove={(t) => removeMutation.mutate(t)} />
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
