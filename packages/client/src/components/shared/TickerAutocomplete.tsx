import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

interface TickerAutocompleteProps {
  value: string;
  onChange: (ticker: string) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export function TickerAutocomplete({ value, onChange, placeholder = 'AAPL', className = '' }: TickerAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external value changes
  useEffect(() => { setQuery(value); }, [value]);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await api.market.search(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    setIsOpen(true);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  const handleSelect = (symbol: string) => {
    setQuery('');
    onChange(symbol);
    setIsOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        onChange(query.trim().toUpperCase());
        setQuery('');
        setResults([]);
      }
      if (e.key === 'Escape') setIsOpen(false);
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) handleSelect(results[selectedIndex].symbol);
        else if (query.trim()) { onChange(query.trim().toUpperCase()); setQuery(''); setResults([]); }
        break;
      case 'Escape': setIsOpen(false); break;
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (query.length > 0) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-8 text-xs font-mono uppercase"
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-autocomplete="list"
      />
      {isOpen && query.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-64 shadow-xl z-50 border border-border bg-card max-h-48 overflow-y-auto" role="listbox">
          {loading ? (
            <div className="p-2 text-xs text-muted-foreground">Searching…</div>
          ) : results.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground">No results</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.symbol}
                role="option"
                aria-selected={i === selectedIndex}
                onClick={() => handleSelect(r.symbol)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex justify-between border-b border-border last:border-b-0 ${i === selectedIndex ? 'bg-accent' : ''}`}
              >
                <span>
                  <span className="font-mono font-bold uppercase text-primary">{r.symbol}</span>
                  <span className="ml-2 text-muted-foreground">{r.name?.substring(0, 30)}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">{r.exchange}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
