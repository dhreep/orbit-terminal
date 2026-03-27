import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { api } from '@/services/api';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTicker: (ticker: string) => void;
  onNavigate: (view: string) => void;
  onAction: (action: string) => void;
}

export function CommandPalette({ open, onOpenChange, onSelectTicker, onNavigate, onAction }: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  const { data: searchResults } = useQuery({
    queryKey: ['tickerSearch', search],
    queryFn: () => api.market.search(search),
    enabled: search.length >= 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const select = useCallback((cb: () => void) => {
    cb();
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="bg-popover" shouldFilter={false}>
        <CommandInput placeholder="Search tickers, commands…" value={search} onValueChange={setSearch} />
        <CommandList className="max-h-80">
          <CommandEmpty>No results found.</CommandEmpty>

          {searchResults && searchResults.length > 0 && (
            <CommandGroup heading="Search Tickers">
              {searchResults.slice(0, 6).map((r) => (
                <CommandItem key={r.symbol} onSelect={() => select(() => onSelectTicker(r.symbol))}>
                  <span className="font-mono font-bold">{r.symbol}</span>
                  <span className="text-muted-foreground truncate ml-2 text-xs">{r.name}</span>
                  <CommandShortcut>{r.exchange}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            {([
              ['terminal', 'Terminal', ''],
              ['watchlist', 'Watchlist', '⌘W'],
              ['portfolio', 'Portfolio', ''],
              ['journal', 'Trade Journal', ''],
              ['explorer', 'Data Explorer', ''],
              ['earnings', 'Earnings Calendar', ''],
              ['screener', 'Screener', ''],
              ['correlation', 'Correlation Matrix', ''],
              ['aichat', 'AI Chat', '⌘I'],
            ] as const).map(([view, label, shortcut]) => (
              <CommandItem key={view} onSelect={() => select(() => onNavigate(view))}>
                <span>{label}</span>
                {shortcut && <CommandShortcut>{shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            {([
              ['export', 'Export Workspace'],
              ['lock', 'Lock Vault'],
              ['toggleLayout', 'Toggle Layout'],
              ['zenMode', 'Toggle Zen Mode'],
              ['toggleTheme', 'Toggle Dark/Light Theme'],
              ['aiChat', 'Open AI Chat'],
            ] as const).map(([action, label]) => (
              <CommandItem key={action} onSelect={() => select(() => onAction(action))}>
                <span>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
