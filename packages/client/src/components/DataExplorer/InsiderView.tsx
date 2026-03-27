import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function InsiderView() {
  const [ticker, setTicker] = useState('');
  const [query, setQuery] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['insider', query],
    queryFn: () => api.insider.byTicker(query),
    enabled: query.length > 0,
  });

  return (
    <div className="flex flex-col gap-3">
      <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); setQuery(ticker.toUpperCase()); }}>
        <Input placeholder="Enter ticker (e.g. AAPL)" value={ticker} onChange={(e) => setTicker(e.target.value)} className="w-40" />
        <Button type="submit" size="sm">Search</Button>
      </form>

      {query && isLoading && <p className="text-muted-foreground text-sm py-6 text-center">Loading insider data…</p>}

      {query && !isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-right font-mono">{t.share.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-mono ${t.change > 0 ? 'text-green-400' : t.change < 0 ? 'text-red-400' : ''}`}>
                  {t.change > 0 ? '+' : ''}{t.change.toLocaleString()}
                </TableCell>
                <TableCell className="text-muted-foreground">{t.transactionDate}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">{t.transactionType}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {t.transactionPrice != null ? `$${t.transactionPrice.toFixed(2)}` : '—'}
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No insider transactions found for {query}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
