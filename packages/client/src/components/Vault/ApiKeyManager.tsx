import React, { useState } from 'react';
import { useVault } from './VaultProvider';
import type { ApiProvider } from '@orbit/shared';

const PROVIDERS: { id: ApiProvider; label: string; description: string }[] = [
  { id: 'alpha_vantage', label: 'Alpha Vantage', description: 'Price & technical data (candles, indicators)' },
  { id: 'fmp', label: 'Financial Modeling Prep', description: 'Fundamental ratios (P/E, PEG, D/E)' },
  { id: 'finnhub', label: 'Finnhub', description: 'News, earnings, insider trading, economic calendar' },
];

export function ApiKeyManager({ onClose }: { onClose: () => void }) {
  const { keys, addApiKey, removeApiKey } = useVault();
  const [newKey, setNewKey] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const handleSave = async (provider: ApiProvider) => {
    const key = newKey[provider];
    if (!key?.trim()) return;
    setSaving(provider);
    try {
      await addApiKey(provider, key.trim());
      setNewKey((prev) => ({ ...prev, [provider]: '' }));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="API Key Manager" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="animate-fade-in w-full max-w-lg bg-accent ghost-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg uppercase tracking-widest text-foreground">API Key Vault</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {PROVIDERS.map((provider) => {
            const hasKey = keys.has(provider.id);
            return (
              <div key={provider.id} className="p-4 ghost-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-sm uppercase tracking-wider text-foreground">{provider.label}</span>
                    <p className="text-xs mt-0.5 text-muted-foreground">{provider.description}</p>
                  </div>
                  {hasKey && (
                    <span className="text-xs px-2 py-0.5 font-bold uppercase tracking-widest ghost-border bg-orbit-info/10 text-orbit-info">
                      Active
                    </span>
                  )}
                </div>

                {hasKey ? (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-mono flex-1 px-3 py-2 ghost-border bg-orbit-surface-0 text-muted-foreground">
                      ••••••••••••••••
                    </span>
                    <button
                      onClick={() => removeApiKey(provider.id)}
                      className="px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80 ghost-border bg-destructive/10 text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="password"
                      value={newKey[provider.id] || ''}
                      onChange={(e) => setNewKey((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                      placeholder="Paste API key here"
                      className="flex-1 px-3 py-2 text-xs outline-none transition-all ghost-border bg-orbit-surface-0 text-foreground"
                    />
                    <button
                      onClick={() => handleSave(provider.id)}
                      disabled={saving === provider.id || !newKey[provider.id]?.trim()}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 liquid-gold"
                    >
                      {saving === provider.id ? 'Encrypting…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground opacity-70">
            🔓 Keys are encrypted with AES-256-GCM in your browser before storage
          </p>
        </div>
      </div>
    </div>
  );
}
