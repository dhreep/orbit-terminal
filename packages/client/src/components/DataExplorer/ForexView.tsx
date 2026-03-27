import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'KRW'] as const;

export function ForexView() {
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState('1');

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['forex-rates', from],
    queryFn: async () => {
      const serverRates = await api.forex.rates(from);
      if (serverRates.length > 0) return serverRates;
      // Fallback: fetch directly from Frankfurter if server returns empty
      const res = await fetch(`https://api.frankfurter.app/latest?base=${from}`);
      const json = await res.json();
      return Object.entries(json.rates || {}).map(([quote, rate]) => ({
        base: json.base || from,
        quote,
        rate: rate as number,
        date: json.date || '',
      }));
    },
    staleTime: 60_000,
  });

  const rate = rates.find((r) => r.quote === to)?.rate ?? null;
  const converted = rate !== null ? parseFloat(amount || '0') * rate : null;
  const inverse = rate !== null && rate !== 0 ? 1 / rate : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={from} onValueChange={(v) => { if (v) setFrom(v); }}>
          <SelectTrigger className="w-24" aria-label="From currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-xs">→</span>
        <Select value={to} onValueChange={(v) => { if (v) setTo(v); }}>
          <SelectTrigger className="w-24" aria-label="To currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Input
        type="number"
        min="0"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className="w-48 font-mono"
        aria-label="Amount to convert"
      />

      {isLoading ? (
        <p className="text-muted-foreground text-sm py-6 text-center">Loading forex rates…</p>
      ) : from === to ? (
        <Card size="sm"><CardContent className="pt-3">
          <p className="text-sm font-mono">1 {from} = 1 {to}</p>
          <p className="text-lg font-bold font-mono mt-1">{parseFloat(amount || '0').toFixed(2)} {to}</p>
        </CardContent></Card>
      ) : rate !== null ? (
        <Card size="sm"><CardContent className="pt-3 flex flex-col gap-2">
          <p className="text-sm font-mono text-muted-foreground">1 {from} = {rate.toFixed(4)} {to}</p>
          <p className="text-sm font-mono text-muted-foreground">1 {to} = {inverse!.toFixed(4)} {from}</p>
          <p className="text-lg font-bold font-mono mt-1">
            {parseFloat(amount || '0').toFixed(2)} {from} = {converted!.toFixed(2)} {to}
          </p>
        </CardContent></Card>
      ) : (
        <p className="text-muted-foreground text-sm py-6 text-center">No rate available for {from}/{to}</p>
      )}
    </div>
  );
}
