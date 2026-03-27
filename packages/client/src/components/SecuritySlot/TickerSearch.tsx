import React, { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../../services/api';

interface TickerSearchProps {
  currentTicker: string | null;
  onSelect: (ticker: string) => void;
  onClear?: () => void;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export function TickerSearch({ currentTicker, onSelect, onClear }: TickerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retryRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showResults = isOpen && query.length > 0;

  const searchTicker = useCallback(async (q: string, retryCount = 0) => {
    if (q.length < 1) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.market.search(q);
      if (data.length === 0 && retryCount === 0) {
        setError('SEARCHING... (RETRY)');
        retryRef.current = setTimeout(() => searchTicker(q, 1), 3000);
        return;
      }
      setResults(data);
      setError(null);
    } catch (err: any) {
      setResults([]);
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('403') || msg.includes('session') || msg.includes('keys required')) {
        setError('API KEY REQUIRED');
      } else if (msg.includes('rate limit') || msg.includes('429')) {
        if (retryCount < 2) {
          setError(`RATE LIMITED — RETRYING (${retryCount + 1}/2)...`);
          retryRef.current = setTimeout(() => searchTicker(q, retryCount + 1), 15000);
          return;
        }
        setError('RATE LIMITED — WAIT 1 MIN & RETRY');
      } else if (msg.includes('upgrade') || msg.includes('subscription') || msg.includes('limit')) {
        if (retryCount < 1) {
          setError('PROVIDER LIMITED — RETRYING...');
          retryRef.current = setTimeout(() => searchTicker(q, retryCount + 1), 5000);
          return;
        }
        setError('FREE TIER LIMIT — WAIT 1 MIN & RETRY');
      } else {
        setError(msg.toUpperCase() || 'SEARCH FAILED');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (value === '' && currentTicker) {
      onClear?.();
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (retryRef.current) clearTimeout(retryRef.current);
    debounceRef.current = setTimeout(() => searchTicker(value), 300);
  };

  const handleSelect = (symbol: string) => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(symbol);
  };

  useEffect(() => { setSelectedIndex(-1); }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) {
      if (e.key === 'Escape') { setIsOpen(false); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) handleSelect(results[selectedIndex].symbol);
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasResults = showResults && results.length > 0;

  return (
    <div ref={containerRef} className="relative flex items-center">
      {!currentTicker && (
        <span className="material-symbols-outlined absolute left-1 text-muted-foreground !text-[10px] pointer-events-none z-10">search</span>
      )}
      <input
        ref={inputRef}
        type="text"
        value={query !== '' ? query : (currentTicker || '')}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (currentTicker && !query) setQuery('');
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="SEARCH"
        role="combobox"
        aria-expanded={hasResults}
        aria-autocomplete="list"
        className={`bg-background border-none text-[11px] font-mono h-6 w-32 focus:ring-1 focus:ring-primary uppercase text-primary outline-none transition-all ${currentTicker ? 'pl-2' : 'pl-5'}`}
      />

      {showResults && (
        <div className="absolute top-full left-0 mt-1 w-64 shadow-xl z-50 overflow-hidden border border-border bg-card" role="listbox">
          {loading ? (
            <div className="p-3 text-xs uppercase tracking-widest text-muted-foreground">Searching…</div>
          ) : error ? (
            <div className="p-3 text-xs uppercase tracking-widest text-destructive flex items-center gap-2">
              <span className="material-symbols-outlined !text-sm">warning</span>
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-xs uppercase tracking-widest text-muted-foreground">No results found</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.symbol}
                role="option"
                aria-selected={i === selectedIndex}
                onClick={() => handleSelect(r.symbol)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-accent flex items-center justify-between border-b border-border last:border-b-0 ${i === selectedIndex ? 'bg-accent' : ''}`}
              >
                <div>
                  <span className="font-mono font-bold tracking-widest uppercase text-primary">{r.symbol}</span>
                  <span className="ml-2 uppercase tracking-wide text-muted-foreground">{r.name?.substring(0, 30)}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground opacity-70">{r.exchange}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
