import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

export function SentimentView() {
  const [search, setSearch] = useState('');
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['sentiment-trending'],
    queryFn: api.sentiment.trending,
    staleTime: 120_000,
  });

  const filtered = items.filter(s =>
    s.ticker.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <p className="text-muted-foreground text-sm py-6 text-center">Loading sentiment data…</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-64">
        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground !text-sm pointer-events-none">search</span>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticker…"
          className="pl-8 h-8 text-xs"
          aria-label="Search sentiment tickers"
        />
      </div>
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
        {filtered.map((s) => (
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
        {filtered.length === 0 && (
          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No results</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
    </div>
  );
}
