import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtLarge(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${fmt(n)}`;
}

export function CryptoView() {
  const [search, setSearch] = useState('');
  const { data: rawCryptos, isLoading } = useQuery({
    queryKey: ['crypto-top'],
    queryFn: () => api.crypto.top(50),
    staleTime: 60_000,
  });
  const cryptos = Array.isArray(rawCryptos) ? rawCryptos : [];
  const filtered = cryptos.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <p className="text-muted-foreground text-sm py-6 text-center">Loading crypto data…</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-64">
        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground !text-sm pointer-events-none">search</span>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search crypto…"
          className="pl-8 h-8 text-xs"
          aria-label="Search cryptocurrencies"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">24h Change</TableHead>
            <TableHead className="text-right">Market Cap</TableHead>
            <TableHead className="text-right">Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c, i) => (
            <TableRow key={c.id}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="font-mono uppercase">{c.symbol}</TableCell>
              <TableCell className="text-right font-mono">${fmt(c.price, c.price < 1 ? 6 : 2)}</TableCell>
              <TableCell className="text-right">
                <span className={c.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {c.change24h >= 0 ? '+' : ''}{fmt(c.change24h)}%
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{fmtLarge(c.marketCap)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{fmtLarge(c.volume24h)}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No results</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
