import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function SentimentView() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['sentiment-trending'],
    queryFn: api.sentiment.trending,
    staleTime: 120_000,
  });

  if (isLoading) return <p className="text-muted-foreground text-sm py-6 text-center">Loading sentiment data…</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Ticker</TableHead>
          <TableHead className="text-right">Mentions</TableHead>
          <TableHead className="text-right">Upvotes</TableHead>
          <TableHead className="text-right">24h Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((s) => (
          <TableRow key={s.ticker}>
            <TableCell className="text-muted-foreground">{s.rank}</TableCell>
            <TableCell className="font-mono font-bold">{s.ticker}</TableCell>
            <TableCell className="text-right font-mono">{s.mentions.toLocaleString()}</TableCell>
            <TableCell className="text-right font-mono">{s.upvotes.toLocaleString()}</TableCell>
            <TableCell className={`text-right font-mono ${s.mentionsChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {s.mentionsChange24h >= 0 ? '+' : ''}{s.mentionsChange24h.toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No sentiment data</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
