import React, { useState, useEffect, useCallback } from 'react';
import { VaultProvider, useVault } from './components/Vault/VaultProvider';
import { VaultSetup } from './components/Vault/VaultSetup';
import { VaultUnlock } from './components/Vault/VaultUnlock';
import { ApiKeyManager } from './components/Vault/ApiKeyManager';
import { SecuritySlot } from './components/SecuritySlot/SecuritySlot';
import { api } from './services/api';
import type { Workspace, LayoutMode, SlotState } from '@orbit/shared';

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
        <div className="flex items-center justify-center h-screen bg-surface p-10 font-mono text-error">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">TERMINAL_CRITICAL_FAILURE</h1>
            <pre className="bg-surface-container p-4 overflow-auto text-xs border border-error/30">
              {this.state.error?.stack}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-error text-on-error font-bold uppercase tracking-widest text-xs"
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
  const [workspace, setWorkspace] = useState<Workspace>(DEFAULT_WORKSPACE);
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time UTC clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load workspace on unlock
  useEffect(() => {
    if (vault.status === 'unlocked' && !workspaceLoaded) {
      api.workspace.get().then((ws) => {
        setWorkspace(ws);
        setWorkspaceLoaded(true);
      }).catch(() => setWorkspaceLoaded(true));
    }
  }, [vault.status, workspaceLoaded]);

  // Save workspace on changes (debounced)
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

  // ─── Vault gates ────────────────────────────────────────
  if (vault.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-orbit-bg)' }}>
        <div className="text-center animate-fade-in">
          <div className="text-4xl mb-4">🌐</div>
          <p style={{ color: 'var(--color-orbit-text-muted)' }}>Initializing OrbitTerminal…</p>
        </div>
      </div>
    );
  }

  if (vault.status === 'uninitialized') {
    return <VaultSetup onSetup={vault.initVault} />;
  }

  if (vault.status === 'locked') {
    return <VaultUnlock onUnlock={vault.unlockVault} />;
  }

  // ─── Main terminal ─────────────────────────────────────
  return (
    <div className="bg-surface-container-lowest text-on-surface select-none h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="bg-surface-container-lowest flex justify-between items-center w-full px-4 h-12 flex-shrink-0 border-b border-surface-variant/15">
        <div className="flex items-center gap-6 h-full">
          <span className="text-lg font-black tracking-tighter text-primary italic">ORBIT TERMINAL</span>
          <nav className="flex items-center gap-4 h-full font-headline uppercase tracking-[0.1em] text-[11px] font-bold">
            <a className="text-primary border-b border-primary h-full flex items-center px-2" href="#">TERMINAL</a>
          </nav>
        </div>
        <div className="flex items-center gap-1 h-full">
          <div className="flex border-r border-surface-variant/30 pr-2 mr-2 gap-1">
            <button onClick={toggleLayout} className="p-2 text-on-surface-variant hover:bg-surface-container transition-colors" title="Toggle Layout">
              <span className="material-symbols-outlined">{workspace.layout === 'grid' ? 'grid_view' : 'splitscreen'}</span>
            </button>
            <button onClick={() => setShowKeyManager(true)} className="p-2 text-on-surface-variant hover:bg-surface-container transition-colors" title="Keys">
              <span className="material-symbols-outlined">api</span>
            </button>
            <button onClick={handleExport} className="p-2 text-on-surface-variant hover:bg-surface-container transition-colors" title="Export Workspace">
              <span className="material-symbols-outlined">file_download</span>
            </button>
            <button onClick={handleImport} className="p-2 text-on-surface-variant hover:bg-surface-container transition-colors" title="Import Workspace">
              <span className="material-symbols-outlined">file_upload</span>
            </button>
          </div>
          <button onClick={vault.lockVault} className="flex items-center gap-2 px-3 py-1 bg-primary-container text-on-primary font-bold text-[10px] tracking-widest uppercase hover:brightness-110 transition-all">
            <span className="material-symbols-outlined !text-sm">lock</span>
            SECURE VAULT
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className={`flex-grow p-1 overflow-hidden bg-surface-container-lowest ${workspace.layout === 'grid' ? 'grid-2x2' : 'grid-spotlight'}`}>
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
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-6 flex-shrink-0 bg-surface-container-lowest border-t border-surface-variant/15 flex items-center justify-between px-3 text-[9px] font-mono text-on-surface-variant">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-tertiary"></div> CONNECTED</span>
        </div>
        <div className="flex gap-4">
          <span>NYSE: OPEN</span>
          <span className="text-primary font-bold">UTC: {currentTime.toISOString().substring(11, 19)}</span>
        </div>
      </footer>

      {/* API Key Manager Modal */}
      {showKeyManager && <ApiKeyManager onClose={() => setShowKeyManager(false)} />}
    </div>
  );
}

// Root app wraps with VaultProvider
export default function App() {
  return (
    <VaultProvider>
      <ErrorBoundary>
        <Terminal />
      </ErrorBoundary>
    </VaultProvider>
  );
}
