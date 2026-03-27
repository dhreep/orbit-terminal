import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { EarningsEvent } from '@orbit/shared';

const hourLabel: Record<string, { text: string; cls: string }> = {
  bmo: { text: 'Before Open', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  amc: { text: 'After Close', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  dmh: { text: 'During Market', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

export function EarningsCalendar() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: api.earnings.upcoming,
  });

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: api.watchlist.getAll,
  });

  const watchTickers = new Set(watchlist.map((w) => w.ticker));

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-auto">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Upcoming Earnings</h2>

      {isLoading ? (
        <p className="text-muted-foreground text-sm py-6 text-center">Loading earnings data…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead>EPS Est.</TableHead>
              <TableHead>Timing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((ev, i) => {
              const h = hourLabel[ev.hour] ?? { text: ev.hour || '—', cls: '' };
              const inWatchlist = watchTickers.has(ev.ticker);
              return (
                <TableRow key={`${ev.ticker}-${i}`}>
                  <TableCell className="text-muted-foreground">{ev.date}</TableCell>
                  <TableCell className="font-mono font-bold">
                    {ev.ticker}
                    {inWatchlist && <span className="ml-1.5 text-yellow-400 text-[10px]">★</span>}
                  </TableCell>
                  <TableCell>{ev.epsEstimate != null ? `$${ev.epsEstimate.toFixed(2)}` : '—'}</TableCell>
                  <TableCell>
                    {h.cls ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${h.cls}`}>{h.text}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">{h.text}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {events.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No upcoming earnings</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
