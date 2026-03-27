import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TickerAutocomplete } from '@/components/shared/TickerAutocomplete';
import type { Holding, Transaction } from '@orbit/shared';

function pnlColor(val: number) {
  return val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-muted-foreground';
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PortfolioView() {
  const qc = useQueryClient();
  const { data: holdings = [] } = useQuery({ queryKey: ['holdings'], queryFn: api.portfolio.getHoldings });
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: api.portfolio.getTransactions });

  // Fetch current prices for each holding
  const priceQueries = useQuery({
    queryKey: ['holdingPrices', holdings.map((h) => h.ticker).join(',')],
    queryFn: async () => {
      const prices: Record<string, number> = {};
      await Promise.all(
        holdings.map(async (h) => {
          try {
            const candles = await api.market.getCandles(h.ticker, '1D');
            prices[h.ticker] = candles.length > 0 ? candles[candles.length - 1].close : h.avgCost;
          } catch {
            prices[h.ticker] = h.avgCost;
          }
        })
      );
      return prices;
    },
    enabled: holdings.length > 0,
  });

  const prices = priceQueries.data ?? {};

  const enriched = holdings.map((h) => {
    const currentPrice = prices[h.ticker] ?? h.avgCost;
    const marketValue = currentPrice * h.shares;
    const cost = h.avgCost * h.shares;
    const pnl = marketValue - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { ...h, currentPrice, marketValue, pnl, pnlPct };
  });

  const totalValue = enriched.reduce((s, h) => s + h.marketValue, 0);
  const totalCost = enriched.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        {([
          ['Total Value', `$${fmt(totalValue)}`],
          ['Total Cost', `$${fmt(totalCost)}`],
          ['Total P&L', `$${fmt(totalPnl)}`],
          ['P&L %', `${fmt(totalPnlPct)}%`],
        ] as const).map(([label, val], i) => (
          <Card key={label} size="sm">
            <CardContent className="pt-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold font-mono ${i >= 2 ? pnlColor(totalPnl) : ''}`}>{val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="holdings">
        <TabsList variant="line">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings">
          <HoldingsTab holdings={enriched} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsTab transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HoldingsTab({ holdings }: { holdings: Array<Holding & { currentPrice: number; marketValue: number; pnl: number; pnlPct: number }> }) {
  const qc = useQueryClient();
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [avgCost, setAvgCost] = useState('');

  const addMut = useMutation({
    mutationFn: () => api.portfolio.addHolding(ticker.toUpperCase(), +shares, +avgCost),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['holdings'] }); setTicker(''); setShares(''); setAvgCost(''); },
  });

  const removeMut = useMutation({
    mutationFn: (t: string) => api.portfolio.removeHolding(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holdings'] }),
  });

  return (
    <div className="flex flex-col gap-2 mt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Avg Cost</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">P&L %</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((h) => (
            <TableRow key={h.ticker}>
              <TableCell className="font-mono font-bold">{h.ticker}</TableCell>
              <TableCell className="text-right">{h.shares}</TableCell>
              <TableCell className="text-right">${fmt(h.avgCost)}</TableCell>
              <TableCell className="text-right">${fmt(h.currentPrice)}</TableCell>
              <TableCell className="text-right">${fmt(h.marketValue)}</TableCell>
              <TableCell className={`text-right font-mono ${pnlColor(h.pnl)}`}>${fmt(h.pnl)}</TableCell>
              <TableCell className={`text-right font-mono ${pnlColor(h.pnlPct)}`}>{fmt(h.pnlPct)}%</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon-xs" onClick={() => removeMut.mutate(h.ticker)} aria-label={`Remove ${h.ticker}`}>✕</Button>
              </TableCell>
            </TableRow>
          ))}
          {holdings.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No holdings yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); if (ticker && shares && avgCost) addMut.mutate(); }}>
        <TickerAutocomplete value={ticker} onChange={setTicker} placeholder="Ticker" className="w-24" />
        <Input placeholder="Shares" type="number" value={shares} onChange={(e) => setShares(e.target.value)} className="w-24" />
        <Input placeholder="Avg Cost" type="number" step="0.01" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} className="w-28" />
        <Button type="submit" size="sm" disabled={addMut.isPending}>Add Holding</Button>
      </form>
    </div>
  );
}

function TransactionsTab({ transactions }: { transactions: Transaction[] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ticker: '', type: 'buy' as 'buy' | 'sell', shares: '', price: '', date: '', notes: '' });

  const addMut = useMutation({
    mutationFn: () => api.portfolio.addTransaction({ ticker: form.ticker.toUpperCase(), type: form.type, shares: +form.shares, price: +form.price, date: form.date || new Date().toISOString().split('T')[0], notes: form.notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); setForm({ ticker: '', type: 'buy', shares: '', price: '', date: '', notes: '' }); },
  });

  return (
    <div className="flex flex-col gap-2 mt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Ticker</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="text-muted-foreground">{t.date}</TableCell>
              <TableCell className="font-mono font-bold">{t.ticker}</TableCell>
              <TableCell><Badge variant={t.type === 'buy' ? 'default' : 'destructive'}>{t.type.toUpperCase()}</Badge></TableCell>
              <TableCell className="text-right">{t.shares}</TableCell>
              <TableCell className="text-right">${fmt(t.price)}</TableCell>
              <TableCell className="text-muted-foreground truncate max-w-[200px]">{t.notes}</TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No transactions yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <form className="flex gap-2 items-end flex-wrap" onSubmit={(e) => { e.preventDefault(); if (form.ticker && form.shares && form.price) addMut.mutate(); }}>
        <TickerAutocomplete value={form.ticker} onChange={(v) => setForm((f) => ({ ...f, ticker: v }))} placeholder="Ticker" className="w-24" />
        <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'buy' | 'sell' }))} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <Input placeholder="Shares" type="number" value={form.shares} onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))} className="w-24" />
        <Input placeholder="Price" type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-28" />
        <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-36" />
        <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-40" />
        <Button type="submit" size="sm" disabled={addMut.isPending}>Add Transaction</Button>
      </form>
    </div>
  );
}
