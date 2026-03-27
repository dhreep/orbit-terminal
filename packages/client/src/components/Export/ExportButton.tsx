import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '@/services/api';

type ExportType = 'portfolio-csv' | 'portfolio-pdf' | 'journal-csv' | 'watchlist-csv';

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
}

export function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async (type: ExportType) => {
    setLoading(true);
    try {
      const date = new Date().toISOString().split('T')[0];

      if (type === 'portfolio-csv') {
        const holdings = await api.portfolio.getHoldings();
        const csv = toCsv(
          ['Ticker', 'Shares', 'Avg Cost', 'Added'],
          holdings.map((h) => [h.ticker, String(h.shares), String(h.avgCost), h.addedAt])
        );
        downloadFile(csv, `portfolio-${date}.csv`, 'text/csv');
      }

      if (type === 'portfolio-pdf') {
        const holdings = await api.portfolio.getHoldings();
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Orbit Terminal — Portfolio', 14, 20);
        doc.setFontSize(8);
        doc.text(`Exported: ${date}`, 14, 28);
        autoTable(doc, {
          startY: 34,
          head: [['Ticker', 'Shares', 'Avg Cost', 'Added']],
          body: holdings.map((h) => [h.ticker, String(h.shares), `$${h.avgCost.toFixed(2)}`, h.addedAt]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [240, 185, 11] },
        });
        doc.save(`portfolio-${date}.pdf`);
      }

      if (type === 'journal-csv') {
        const entries = await api.journal.getAll();
        const csv = toCsv(
          ['Ticker', 'Entry Price', 'Entry Date', 'Exit Price', 'Exit Date', 'Shares', 'P&L', 'Status'],
          entries.map((e) => [
            e.ticker, String(e.entryPrice), e.entryDate,
            e.exitPrice != null ? String(e.exitPrice) : '', e.exitDate ?? '',
            String(e.shares), e.pnl != null ? String(e.pnl) : '', e.status,
          ])
        );
        downloadFile(csv, `journal-${date}.csv`, 'text/csv');
      }

      if (type === 'watchlist-csv') {
        const items = await api.watchlist.getAll();
        const csv = toCsv(
          ['Ticker', 'Added At'],
          items.map((w) => [w.ticker, w.addedAt])
        );
        downloadFile(csv, `watchlist-${date}.csv`, 'text/csv');
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Select onValueChange={(v) => handleExport(v as ExportType)}>
      <SelectTrigger size="sm" className="w-fit gap-1" aria-label="Export data" disabled={loading}>
        <span className="material-symbols-outlined !text-sm">download</span>
        <SelectValue placeholder="Export" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="portfolio-csv">Portfolio CSV</SelectItem>
        <SelectItem value="portfolio-pdf">Portfolio PDF</SelectItem>
        <SelectItem value="journal-csv">Journal CSV</SelectItem>
        <SelectItem value="watchlist-csv">Watchlist CSV</SelectItem>
      </SelectContent>
    </Select>
  );
}
