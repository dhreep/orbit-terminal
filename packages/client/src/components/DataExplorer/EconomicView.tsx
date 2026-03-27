import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const impactStyles: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export function EconomicView() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['economic-events'],
    queryFn: api.economic.events,
    staleTime: 300_000,
  });

  if (isLoading) return <p className="text-muted-foreground text-sm py-6 text-center">Loading economic events…</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Actual</TableHead>
          <TableHead>Estimate</TableHead>
          <TableHead>Previous</TableHead>
          <TableHead>Impact</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((ev, i) => (
          <TableRow key={i}>
            <TableCell className="text-muted-foreground">{ev.date}</TableCell>
            <TableCell className="font-medium">{ev.event}</TableCell>
            <TableCell>{ev.country}</TableCell>
            <TableCell className="font-mono">{ev.actual ?? '—'}</TableCell>
            <TableCell className="font-mono text-muted-foreground">{ev.estimate ?? '—'}</TableCell>
            <TableCell className="font-mono text-muted-foreground">{ev.previous ?? '—'}</TableCell>
            <TableCell>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${impactStyles[ev.impact] ?? ''}`}>
                {ev.impact.toUpperCase()}
              </span>
            </TableCell>
          </TableRow>
        ))}
        {events.length === 0 && (
          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No economic events</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
