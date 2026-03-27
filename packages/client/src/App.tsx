import React, { useState, useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { VaultProvider, useVault } from './components/Vault/VaultProvider';
import { VaultSetup } from './components/Vault/VaultSetup';
import { VaultUnlock } from './components/Vault/VaultUnlock';
import { ApiKeyManager } from './components/Vault/ApiKeyManager';
import { SecuritySlot } from './components/SecuritySlot/SecuritySlot';
import { CommandPalette } from './components/CommandPalette';
import { WatchlistPanel } from './components/Watchlist/WatchlistPanel';
import { AlertsPanel } from './components/Alerts/AlertsPanel';
import { AIChatPanel } from './components/AIChat/AIChatPanel';
import { ScreenerView } from './components/Screener/ScreenerView';
import { CorrelationView } from './components/DataExplorer/CorrelationView';
import { ExportButton } from './components/Export/ExportButton';
import { DemoProvider, useDemo } from './components/Demo/DemoProvider';
import { useTheme } from './hooks/useTheme';
import { Badge } from './components/ui/badge';
import { api } from './services/api';
import { getNYSEStatus } from './utils/market';
import { PortfolioView } from './components/Portfolio/PortfolioView';
import { EarningsCalendar } from './components/Earnings/EarningsCalendar';
import { TradeJournal } from './components/Journal/TradeJournal';
import { DataExplorer } from './components/DataExplorer/DataExplorer';
import type { Workspace, LayoutMode, SlotState } from '@orbit/shared';

type AppView = 'terminal' | 'portfolio' | 'journal' | 'explorer' | 'earnings' | 'screener' | 'correlation';

const DEFAULT_WORKSPACE: Workspace = {
  layout: 'grid',
  slots: [
    { id: 0, ticker: null, chartMode: 'candle', thesis: '' },
    { id: 1, ticker: null, chartMode: 'candle', thesis: '' },
    { id: 2, ticker: null, chartMode: 'candle', thesis: '' },
    { id: 3, ticker: null, chartMode: 'candle', thesis: '' },
  ],
  updatedAt: new Date().toISOString(),
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Terminal Crash:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-background p-10 font-mono text-destructive">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">TERMINAL_CRITICAL_FAILURE</h1>
            <pre className="bg-card p-4 overflow-auto text-xs border border-border">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-destructive text-primary-foreground font-bold uppercase tracking-widest text-xs"
            >
              Restart System
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Terminal() {
  const vault = useVault();
  const demo = useDemo();
  const { theme, toggleTheme } = useTheme();
  const [workspace, setWorkspace] = useState<Workspace>(DEFAULT_WORKSPACE);
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('terminal');
  const nyseStatus = getNYSEStatus();

  useHotkeys('mod+k', (e) => { e.preventDefault(); setCmdPaletteOpen(true); }, { enableOnFormTags: true });
  useHotkeys('mod+w', (e) => { e.preventDefault(); setWatchlistOpen((v) => !v); }, { enableOnFormTags: true });
  useHotkeys('mod+a', (e) => { e.preventDefault(); setAlertsOpen((v) => !v); }, { enableOnFormTags: true });
  useHotkeys('mod+i', (e) => { e.preventDefault(); setAiChatOpen((v) => !v); }, { enableOnFormTags: true });
  useHotkeys('mod+z', (e) => { e.preventDefault(); setZenMode((v) => !v); }, { enableOnFormTags: true });
  useHotkeys('escape', () => { setCmdPaletteOpen(false); setWatchlistOpen(false); setAlertsOpen(false); setShowKeyManager(false); setAiChatOpen(false); if (zenMode) setZenMode(false); });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (vault.status === 'unlocked' && !workspaceLoaded) {
      api.workspace.get().then((ws) => {
        setWorkspace(ws);
        setWorkspaceLoaded(true);
      }).catch(() => setWorkspaceLoaded(true));
    }
  }, [vault.status, workspaceLoaded]);

  useEffect(() => {
    if (!workspaceLoaded) return;
    const timer = setTimeout(() => {
      api.workspace.save(workspace).catch(console.error);
    }, 1000);
    return () => clearTimeout(timer);
  }, [workspace, workspaceLoaded]);

  const updateSlot = useCallback((slotId: number, updates: Partial<SlotState>) => {
    setWorkspace((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const toggleLayout = useCallback(() => {
    setWorkspace((prev) => ({
      ...prev,
      layout: prev.layout === 'grid' ? 'spotlight' : 'grid',
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const data = await api.workspace.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbit-workspace-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await api.workspace.importAll(data);
        setWorkspace(data.workspace);
      } catch (err) {
        console.error('Import failed:', err);
      }
    };
    input.click();
  }, []);

  const handleSelectTicker = useCallback((ticker: string) => {
    const emptySlot = workspace.slots.find((s) => !s.ticker);
    const targetId = emptySlot ? emptySlot.id : 0;
    updateSlot(targetId, { ticker });
  }, [workspace.slots, updateSlot]);

  const handleNavigate = useCallback((view: string) => {
    if (view === 'watchlist') setWatchlistOpen(true);
    else if (view === 'aichat') setAiChatOpen(true);
    else if (['terminal', 'screener', 'correlation', 'portfolio', 'journal', 'explorer', 'earnings'].includes(view)) {
      setCurrentView(view as AppView);
    }
  }, []);

  const handleAction = useCallback((action: string) => {
    if (action === 'export') handleExport();
    else if (action === 'lock') vault.lockVault();
    else if (action === 'toggleLayout') toggleLayout();
    else if (action === 'zenMode') setZenMode((v) => !v);
    else if (action === 'toggleTheme') toggleTheme();
    else if (action === 'aiChat') setAiChatOpen(true);
  }, [handleExport, vault, toggleLayout, toggleTheme]);

  // ─── Vault gates ────────────────────────────────────────
  if (vault.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center animate-fade-in">
          <div className="text-4xl mb-4">🌐</div>
          <p className="text-muted-foreground">Initializing OrbitTerminal…</p>
        </div>
      </div>
    );
  }

  if (vault.status === 'uninitialized' && !demo.isDemoMode) {
    return <VaultSetup onSetup={vault.initVault} onTryDemo={demo.enableDemo} />;
  }

  if (vault.status === 'locked' && !demo.isDemoMode) {
    return <VaultUnlock onUnlock={vault.unlockVault} />;
  }

  // ─── Zen Mode ────────────────────────────────────────────
  if (zenMode) {
    return (
      <div className="bg-background text-foreground h-screen flex flex-col">
        <main className="flex-grow p-0 overflow-hidden">
          <SecuritySlot
            slot={workspace.slots[0]}
            onTickerChange={(ticker) => updateSlot(0, { ticker })}
            onTickerClear={() => updateSlot(0, { ticker: null })}
            onChartModeToggle={() => updateSlot(0, { chartMode: workspace.slots[0].chartMode === 'candle' ? 'line' : 'candle' })}
            isSpotlight={true}
          />
        </main>
        <button
          onClick={() => setZenMode(false)}
          className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-card text-muted-foreground text-[10px] font-mono uppercase tracking-widest hover:bg-accent transition-colors border border-border"
          aria-label="Exit zen mode"
        >
          Exit Zen (⌘Z)
        </button>
      </div>
    );
  }

  // ─── Main terminal ─────────────────────────────────────
  return (
    <div className="bg-background text-foreground select-none h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="bg-background flex justify-between items-center w-full px-4 h-12 flex-shrink-0 border-b border-border">
        <div className="flex items-center gap-6 h-full">
          <span className="text-lg font-black tracking-tighter text-primary italic">ORBIT TERMINAL</span>
          {demo.isDemoMode && <Badge variant="outline" className="text-[9px] font-mono tracking-widest border-primary/40 text-primary">DEMO</Badge>}
          <nav className="flex items-center gap-4 h-full font-heading uppercase tracking-[0.1em] text-[11px] font-bold">
            {([
              ['terminal', 'Terminal'],
              ['portfolio', 'Portfolio'],
              ['journal', 'Journal'],
              ['screener', 'Screener'],
              ['correlation', 'Correlation'],
              ['explorer', 'Explorer'],
              ['earnings', 'Earnings'],
            ] as const).map(([view, label]) => (
              <button
                key={view}
                onClick={() => setCurrentView(view as AppView)}
                className={`h-full flex items-center px-2 transition-colors ${currentView === view ? 'text-primary border-b border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1 h-full">
          <div className="flex border-r border-border pr-2 mr-2 gap-1">
            <button onClick={() => setCmdPaletteOpen(true)} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="Command Palette (⌘K)" aria-label="Open command palette">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button onClick={() => setWatchlistOpen(true)} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="Watchlist (⌘W)" aria-label="Toggle watchlist">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
            <button onClick={() => setAlertsOpen(true)} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="Price Alerts (⌘A)" aria-label="Toggle alerts">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button onClick={() => setAiChatOpen(true)} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="AI Chat (⌘I)" aria-label="Toggle AI chat">
              <span className="material-symbols-outlined">smart_toy</span>
            </button>
            <button onClick={toggleLayout} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="Toggle Layout" aria-label="Toggle layout">
              <span className="material-symbols-outlined">{workspace.layout === 'grid' ? 'grid_view' : 'splitscreen'}</span>
            </button>
            <button onClick={() => setZenMode(true)} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="Zen Mode (⌘Z)" aria-label="Enter zen mode">
              <span className="material-symbols-outlined">fullscreen</span>
            </button>
            <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="Toggle Theme" aria-label="Toggle dark/light theme">
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button onClick={() => setShowKeyManager(true)} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="Keys" aria-label="Manage API keys">
              <span className="material-symbols-outlined">api</span>
            </button>
            <ExportButton />
            <button onClick={handleExport} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="Export Workspace JSON" aria-label="Export workspace">
              <span className="material-symbols-outlined">file_download</span>
            </button>
            <button onClick={handleImport} className="p-2 text-muted-foreground hover:bg-accent transition-colors" title="Import Workspace" aria-label="Import workspace">
              <span className="material-symbols-outlined">file_upload</span>
            </button>
          </div>
          {demo.isDemoMode ? (
            <button onClick={demo.exitDemo} className="flex items-center gap-2 px-3 py-1 liquid-gold font-bold text-[10px] tracking-widest uppercase hover:brightness-110 transition-all" aria-label="Exit demo">
              <span className="material-symbols-outlined !text-sm">logout</span>
              EXIT DEMO
            </button>
          ) : (
            <button onClick={vault.lockVault} className="flex items-center gap-2 px-3 py-1 liquid-gold font-bold text-[10px] tracking-widest uppercase hover:brightness-110 transition-all" aria-label="Lock vault">
              <span className="material-symbols-outlined !text-sm">lock</span>
              SECURE VAULT
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow overflow-hidden bg-background">
        {currentView === 'terminal' && (
          <div className={`h-full p-1 ${workspace.layout === 'grid' ? 'grid-2x2' : 'grid-spotlight'}`}>
            {workspace.slots.map((slot) => (
              <SecuritySlot
                key={slot.id}
                slot={slot}
                onTickerChange={(ticker) => updateSlot(slot.id, { ticker })}
                onTickerClear={() => updateSlot(slot.id, { ticker: null })}
                onChartModeToggle={() =>
                  updateSlot(slot.id, {
                    chartMode: slot.chartMode === 'candle' ? 'line' : 'candle',
                  })
                }
                isSpotlight={workspace.layout === 'spotlight' && slot.id === 0}
              />
            ))}
          </div>
        )}
        {currentView === 'portfolio' && <PortfolioView />}
        {currentView === 'journal' && <TradeJournal />}
        {currentView === 'explorer' && <DataExplorer />}
        {currentView === 'earnings' && <EarningsCalendar />}
        {currentView === 'screener' && <ScreenerView />}
        {currentView === 'correlation' && <CorrelationView />}
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-6 flex-shrink-0 bg-background border-t border-border flex items-center justify-between px-3 text-[9px] font-mono text-muted-foreground">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-orbit-info"></div> CONNECTED</span>
          {demo.isDemoMode && <span className="text-primary font-bold">DEMO MODE</span>}
        </div>
        <div className="flex gap-4">
          <span className={nyseStatus.isOpen ? 'text-orbit-gain' : 'text-orbit-loss'}>NYSE: {nyseStatus.label}</span>
          <span className="text-primary font-bold">UTC: {currentTime.toISOString().substring(11, 19)}</span>
        </div>
      </footer>

      {showKeyManager && <ApiKeyManager onClose={() => setShowKeyManager(false)} />}
      <CommandPalette open={cmdPaletteOpen} onOpenChange={setCmdPaletteOpen} onSelectTicker={handleSelectTicker} onNavigate={handleNavigate} onAction={handleAction} />
      <WatchlistPanel open={watchlistOpen} onOpenChange={setWatchlistOpen} />
      <AlertsPanel open={alertsOpen} onOpenChange={setAlertsOpen} />
      <AIChatPanel open={aiChatOpen} onOpenChange={setAiChatOpen} />
    </div>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <VaultProvider>
        <ErrorBoundary>
          <Terminal />
        </ErrorBoundary>
      </VaultProvider>
    </DemoProvider>
  );
}
