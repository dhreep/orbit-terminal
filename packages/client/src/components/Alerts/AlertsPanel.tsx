import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { api } from '@/services/api';
import type { AlertCondition } from '@orbit/shared';

interface AlertsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertsPanel({ open, onOpenChange }: AlertsPanelProps) {
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.alerts.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.alerts.create(ticker.toUpperCase(), parseFloat(price), condition),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      setTicker('');
      setPrice('');
      setShowForm(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => api.alerts.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const canSubmit = ticker.trim() && price.trim() && !isNaN(parseFloat(price));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-80 p-0 flex flex-col bg-popover">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-bold uppercase tracking-widest">Price Alerts</SheetTitle>
            <Button variant="ghost" size="icon-xs" onClick={() => setShowForm(!showForm)} aria-label="Add alert">
              <span className="material-symbols-outlined !text-sm">add</span>
            </Button>
          </div>
          <SheetDescription className="text-xs">Get notified on price targets</SheetDescription>
        </SheetHeader>

        {showForm && (
          <div className="flex flex-col gap-2 px-3 py-2 border-b border-border/20">
            <div className="flex gap-1">
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="AAPL"
                className="h-7 text-xs font-mono uppercase flex-1"
                autoFocus
              />
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150.00"
                type="number"
                step="0.01"
                className="h-7 text-xs font-mono w-24"
              />
            </div>
            <div className="flex gap-1 items-center">
              <Select value={condition} onValueChange={(v) => setCondition(v as AlertCondition)}>
                <SelectTrigger size="sm" className="flex-1 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                </SelectContent>
              </Select>
              <Button size="xs" onClick={() => createMutation.mutate()} disabled={!canSubmit}>
                Create
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs py-8">No alerts set</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors group ${alert.triggered ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono font-bold text-sm ${alert.triggered ? 'line-through' : ''}`}>
                      {alert.ticker}
                    </span>
                    <Badge
                      variant={alert.triggered ? 'secondary' : alert.condition === 'above' ? 'default' : 'destructive'}
                      className="text-[9px] font-mono px-1.5 py-0 h-4"
                    >
                      {alert.condition === 'above' ? '↑' : '↓'} ${alert.targetPrice.toFixed(2)}
                    </Badge>
                  </div>
                  {alert.triggered && (
                    <span className="text-[9px] font-mono text-muted-foreground">Triggered</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeMutation.mutate(alert.id)}
                  aria-label={`Remove alert for ${alert.ticker}`}
                >
                  <span className="material-symbols-outlined !text-xs">close</span>
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
