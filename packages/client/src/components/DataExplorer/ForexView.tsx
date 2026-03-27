import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BASES = ['USD', 'EUR', 'GBP', 'JPY'] as const;

export function ForexView() {
  const [base, setBase] = useState('USD');

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['forex-rates', base],
    queryFn: () => api.forex.rates(base),
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Base Currency:</span>
        <Select value={base} onValueChange={(v) => { if (v) setBase(v); }}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BASES.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm py-6 text-center">Loading forex rates…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {rates.map((r) => (
            <Card key={`${r.base}${r.quote}`} size="sm">
              <CardContent className="pt-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.base}/{r.quote}</p>
                <p className="text-lg font-bold font-mono">{r.rate.toFixed(4)}</p>
                <p className="text-[10px] text-muted-foreground">{r.date}</p>
              </CardContent>
            </Card>
          ))}
          {rates.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-6">No forex data available</p>
          )}
        </div>
      )}
    </div>
  );
}
