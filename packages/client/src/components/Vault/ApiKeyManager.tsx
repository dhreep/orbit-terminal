import React, { useState } from 'react';
import { useVault } from './VaultProvider';
import type { ApiProvider } from '@orbit/shared';

const PROVIDERS: { id: ApiProvider; label: string; description: string }[] = [
  { id: 'alpha_vantage', label: 'Alpha Vantage', description: 'Price & technical data (candles, indicators)' },
  { id: 'fmp', label: 'Financial Modeling Prep', description: 'Fundamental ratios (P/E, PEG, D/E)' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(2px)' }}>
      <div className="animate-fade-in w-full max-w-lg ghost-border" style={{ background: 'var(--color-surface-highest)' }}>
        <div className="flex items-center justify-between p-5 border-b ghost-border" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
          <h2 className="font-bold text-lg uppercase tracking-widest" style={{ color: 'var(--color-text-main)' }}>API Key Vault</h2>
          <button onClick={onClose} className="p-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {PROVIDERS.map((provider) => {
            const hasKey = keys.has(provider.id);
            return (
              <div key={provider.id} className="p-4 ghost-border" style={{ background: 'var(--color-surface-low)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-sm text-uppercase tracking-wider" style={{ color: 'var(--color-text-main)' }}>{provider.label}</span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{provider.description}</p>
                  </div>
                  {hasKey && (
                    <span className="text-xs px-2 py-0.5 font-bold uppercase tracking-widest ghost-border" style={{ background: 'rgba(177, 228, 255, 0.1)', color: 'var(--color-success)' }}>
                      Active
                    </span>
                  )}
                </div>

                {hasKey ? (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-mono flex-1 px-3 py-2 ghost-border" style={{ background: 'var(--color-surface-lowest)', color: 'var(--color-text-muted)' }}>
                      ••••••••••••••••
                    </span>
                    <button
                      onClick={() => removeApiKey(provider.id)}
                      className="px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80 ghost-border"
                      style={{ background: 'rgba(255, 180, 171, 0.1)', color: 'var(--color-error)' }}
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
                      className="flex-1 px-3 py-2 text-xs outline-none transition-all ghost-border"
                      style={{ background: 'var(--color-surface-lowest)', color: 'var(--color-text-main)' }}
                    />
                    <button
                      onClick={() => handleSave(provider.id)}
                      disabled={saving === provider.id || !newKey[provider.id]?.trim()}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-40 bg-gradient-gold"
                    >
                      {saving === provider.id ? 'Encrypting…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t text-center ghost-border" style={{ borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
            🔓 Keys are encrypted with AES-256-GCM in your browser before storage
          </p>
        </div>
      </div>
    </div>
  );
}
