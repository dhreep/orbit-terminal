import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { TradeJournalEntry } from '@orbit/shared';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pnlColor(val: number | null) {
  if (val == null) return '';
  return val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-muted-foreground';
}

export function TradeJournal() {
  const qc = useQueryClient();
  const { data: trades = [] } = useQuery({ queryKey: ['journal'], queryFn: api.journal.getAll });

  const [form, setForm] = useState({ ticker: '', entryPrice: '', entryDate: '', shares: '', thesis: '' });
  const [closing, setClosing] = useState<TradeJournalEntry | null>(null);
  const [closeForm, setCloseForm] = useState({ exitPrice: '', exitDate: '', outcome: '' });

  const createMut = useMutation({
    mutationFn: () => api.journal.create({
      ticker: form.ticker.toUpperCase(),
      entryPrice: +form.entryPrice,
      entryDate: form.entryDate || new Date().toISOString().split('T')[0],
      shares: +form.shares,
      thesis: form.thesis,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); setForm({ ticker: '', entryPrice: '', entryDate: '', shares: '', thesis: '' }); },
  });

  const closeMut = useMutation({
    mutationFn: () => api.journal.close(closing!.id, {
      exitPrice: +closeForm.exitPrice,
      exitDate: closeForm.exitDate || new Date().toISOString().split('T')[0],
      outcome: closeForm.outcome,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); setClosing(null); setCloseForm({ exitPrice: '', exitDate: '', outcome: '' }); },
  });

  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed');

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-auto">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Trade Journal</h2>

      {/* New Trade Form */}
      <form className="flex gap-2 items-end flex-wrap" onSubmit={(e) => { e.preventDefault(); if (form.ticker && form.entryPrice && form.shares) createMut.mutate(); }}>
        <Input placeholder="Ticker" value={form.ticker} onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))} className="w-24" />
        <Input placeholder="Entry Price" type="number" step="0.01" value={form.entryPrice} onChange={(e) => setForm((f) => ({ ...f, entryPrice: e.target.value }))} className="w-28" />
        <Input type="date" value={form.entryDate} onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))} className="w-36" />
        <Input placeholder="Shares" type="number" value={form.shares} onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))} className="w-24" />
        <Textarea placeholder="Thesis…" value={form.thesis} onChange={(e) => setForm((f) => ({ ...f, thesis: e.target.value }))} className="w-60 min-h-8 h-8" />
        <Button type="submit" size="sm" disabled={createMut.isPending}>New Trade</Button>
      </form>

      {/* Open Trades */}
      {openTrades.length > 0 && (
        <>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Open Positions</h3>
          <TradesTable trades={openTrades} onClose={(t) => setClosing(t)} />
        </>
      )}

      {/* Closed Trades */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Closed Trades</h3>
      <TradesTable trades={closedTrades} />

      {/* Close Trade Dialog */}
      <Dialog open={!!closing} onOpenChange={(open) => { if (!open) setClosing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Trade — {closing?.ticker}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input placeholder="Exit Price" type="number" step="0.01" value={closeForm.exitPrice} onChange={(e) => setCloseForm((f) => ({ ...f, exitPrice: e.target.value }))} />
            <Input type="date" value={closeForm.exitDate} onChange={(e) => setCloseForm((f) => ({ ...f, exitDate: e.target.value }))} />
            <Input placeholder="Outcome notes" value={closeForm.outcome} onChange={(e) => setCloseForm((f) => ({ ...f, outcome: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => { if (closeForm.exitPrice) closeMut.mutate(); }} disabled={closeMut.isPending}>Close Trade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TradesTable({ trades, onClose }: { trades: TradeJournalEntry[]; onClose?: (t: TradeJournalEntry) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead className="text-right">Entry</TableHead>
          <TableHead>Entry Date</TableHead>
          <TableHead className="text-right">Exit</TableHead>
          <TableHead>Exit Date</TableHead>
          <TableHead className="text-right">Shares</TableHead>
          <TableHead className="text-right">P&L</TableHead>
          <TableHead>Status</TableHead>
          {onClose && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((t) => (
          <TableRow key={t.id} className={t.status === 'open' ? 'bg-primary/5' : ''}>
            <TableCell className="font-mono font-bold">{t.ticker}</TableCell>
            <TableCell className="text-right">${fmt(t.entryPrice)}</TableCell>
            <TableCell className="text-muted-foreground">{t.entryDate}</TableCell>
            <TableCell className="text-right">{t.exitPrice != null ? `$${fmt(t.exitPrice)}` : '—'}</TableCell>
            <TableCell className="text-muted-foreground">{t.exitDate ?? '—'}</TableCell>
            <TableCell className="text-right">{t.shares}</TableCell>
            <TableCell className={`text-right font-mono ${pnlColor(t.pnl)}`}>{t.pnl != null ? `$${fmt(t.pnl)}` : '—'}</TableCell>
            <TableCell>
              <Badge variant={t.status === 'open' ? 'secondary' : 'outline'}>{t.status}</Badge>
            </TableCell>
            {onClose && (
              <TableCell>
                <Button variant="outline" size="xs" onClick={() => onClose(t)}>Close</Button>
              </TableCell>
            )}
          </TableRow>
        ))}
        {trades.length === 0 && (
          <TableRow><TableCell colSpan={onClose ? 9 : 8} className="text-center text-muted-foreground py-6">No trades</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
