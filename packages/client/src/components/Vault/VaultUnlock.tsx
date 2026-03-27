import React, { useState } from 'react';
import { api } from '../../services/api';

interface VaultUnlockProps {
  onUnlock: (password: string) => Promise<void>;
}

export function VaultUnlock({ onUnlock }: VaultUnlockProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.vault.reset();
      window.location.reload();
    } catch (err) {
      setError('Failed to reset vault.');
      setResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    setLoading(true);
    try {
      await onUnlock(password);
    } catch (err) {
      setError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <header className="bg-orbit-surface-0 flex justify-between items-center w-full px-6 py-4 fixed top-0 border-none z-50">
        <div className="text-xl font-black tracking-tighter text-primary uppercase">
          ORBIT TERMINAL
        </div>
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-primary cursor-help" title="Security Status">security</span>
          <span className="material-symbols-outlined text-primary cursor-help" title="Help">help_outline</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--orbit-gold) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

        <section className="w-full max-w-md bg-card ghost-border relative z-10 p-12 shadow-2xl flex flex-col gap-10">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 flex items-center justify-center liquid-gold">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>orbit</span>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="font-heading font-black text-2xl uppercase tracking-widest text-foreground">Unlock Vault</h1>
              <p className="text-muted-foreground text-xs uppercase tracking-wider opacity-70">
                Enter your master password to decrypt your API keys
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              <label className="block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground" htmlFor="vault_password">
                Secure Access Key
              </label>
              <div className="relative group">
                <input
                  id="vault_password"
                  name="vault_password"
                  type="password"
                  placeholder="••••••••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-orbit-surface-0 border-none border-b border-border focus:ring-0 focus:border-primary text-primary font-mono py-5 px-4 transition-all duration-300 placeholder:text-muted-foreground/40 outline-none"
                />
                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary group-focus-within:w-full transition-all duration-500" />
              </div>
            </div>

            {error && (
              <div className="text-sm px-3 py-3 ghost-border text-center flex items-center justify-center gap-2 text-destructive bg-orbit-surface-0">
                <span className="material-symbols-outlined !text-sm">error</span>
                {error}
              </div>
            )}

            <button disabled={loading} className="w-full liquid-gold font-heading font-extrabold uppercase tracking-widest py-5 text-sm active:scale-[0.98] transition-transform duration-100 flex items-center justify-center gap-2 group disabled:opacity-50" type="submit">
              <span>{loading ? 'Decrypting...' : 'Unlock'}</span>
              {!loading && <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </form>

          <div className="pt-8 border-t border-border/30 text-center flex flex-col gap-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground/40 font-mono text-[10px] tracking-widest uppercase mb-2">
              <span className="material-symbols-outlined text-[12px]">memory</span>
              <span>Keys are decrypted in memory only</span>
            </div>

            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[9px] uppercase tracking-widest text-destructive/50 hover:text-destructive transition-colors font-mono underline decoration-destructive/30 underline-offset-4"
              >
                Forgot Password? Reset Vault
              </button>
            ) : (
              <div className="flex flex-col gap-2 items-center bg-destructive/10 p-3 ghost-border">
                <span className="text-[10px] uppercase tracking-widest text-destructive font-bold font-mono">
                  Warning: This deletes all data & keys
                </span>
                <div className="flex gap-4 mt-2 w-full">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1 bg-orbit-surface-0 ghost-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={resetting}
                    className="flex-1 text-[10px] uppercase tracking-widest text-primary-foreground bg-destructive hover:bg-destructive/90 transition-colors py-1 cursor-pointer font-bold disabled:opacity-50"
                  >
                    {resetting ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-orbit-surface-0 border-t border-border flex flex-col md:flex-row justify-between items-center px-8 py-4 w-full gap-4 z-50">
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground/60">
          SECURE TERMINAL ACCESS // AES-256 ENCRYPTED
        </div>
        <nav className="flex gap-6">
          <a className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground/40 hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground/40 hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-1" href="#">
            <span className="w-1.5 h-1.5 bg-orbit-info"></span>
            System Status
          </a>
        </nav>
      </footer>
    </div>
  );
}
