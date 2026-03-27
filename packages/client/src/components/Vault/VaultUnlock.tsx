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
    <div className="bg-surface-container-lowest text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      {/* Top Navigation Anchor (Non-interactive/Branding) */}
      <header className="bg-[#0b0e11] flex justify-between items-center w-full px-6 py-4 fixed top-0 border-none z-50">
        <div className="text-xl font-black tracking-tighter bg-gradient-to-r from-[#ffd87f] to-[#f0b90b] bg-clip-text text-transparent uppercase">
          ORBIT TERMINAL
        </div>
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-[#f0b90b] cursor-help" title="Security Status">security</span>
          <span className="material-symbols-outlined text-[#f0b90b] cursor-help" title="Help">help_outline</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Tech Pattern Background Element */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f0b90b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
        
        {/* Vault Unlock Card */}
        <section className="w-full max-w-md bg-surface-container-low ghost-border relative z-10 p-12 shadow-2xl flex flex-col gap-10">
          {/* Brand Mark & Header */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 flex items-center justify-center liquid-gold">
              <span className="material-symbols-outlined text-on-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                orbit
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              <h1 className="font-headline font-black text-2xl uppercase tracking-widest text-on-surface">
                Unlock Vault
              </h1>
              <p className="font-label text-on-surface-variant text-xs uppercase tracking-wider opacity-70">
                Enter your master password to decrypt your API keys
              </p>
            </div>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              <label className="block font-label text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant" htmlFor="vault_password">
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
                  className="w-full bg-[#0b0e11] border-none border-b border-outline-variant focus:ring-0 focus:border-primary-container text-primary font-mono py-5 px-4 transition-all duration-300 placeholder:text-surface-variant outline-none"
                />
                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary group-focus-within:w-full transition-all duration-500"></div>
              </div>
            </div>

            {error && (
              <div className="text-sm px-3 py-3 ghost-border text-center flex items-center justify-center gap-2" style={{ color: 'var(--color-error)', background: 'var(--color-surface-dim)' }}>
                <span className="material-symbols-outlined !text-sm">error</span>
                {error}
              </div>
            )}

            <button disabled={loading} className="w-full liquid-gold text-on-primary font-headline font-extrabold uppercase tracking-widest py-5 text-sm active:scale-[0.98] transition-transform duration-100 flex items-center justify-center gap-2 group disabled:opacity-50" type="submit">
              <span>{loading ? 'Decrypting...' : 'Unlock'}</span>
              {!loading && <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </form>

          {/* Metadata/Status Footnote */}
          <div className="pt-8 border-t border-outline-variant/10 text-center flex flex-col gap-6">
            <div className="flex items-center justify-center gap-2 text-[#d3c5ac]/40 font-mono text-[10px] tracking-widest uppercase mb-2">
              <span className="material-symbols-outlined text-[12px]">memory</span>
              <span>Keys are decrypted in memory only</span>
            </div>

            {/* Reset Vault Sequence */}
            {!showResetConfirm ? (
              <button 
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[9px] uppercase tracking-widest text-[#ffb4ab]/50 hover:text-[#ffb4ab] transition-colors font-mono underline decoration-[#ffb4ab]/30 underline-offset-4"
              >
                Forgot Password? Reset Vault
              </button>
            ) : (
              <div className="flex flex-col gap-2 items-center bg-error/10 p-3 ghost-border">
                <span className="text-[10px] uppercase tracking-widest text-error font-bold font-mono">
                  Warning: This deletes all data & keys
                </span>
                <div className="flex gap-4 mt-2 w-full">
                  <button 
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors py-1 bg-surface-lowest ghost-border"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleReset}
                    disabled={resetting}
                    className="flex-1 text-[10px] uppercase tracking-widest text-on-error bg-error hover:bg-error/90 transition-colors py-1 cursor-pointer font-bold disabled:opacity-50"
                  >
                    {resetting ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Terminal Info */}
      <footer className="bg-[#0b0e11] border-t border-[#323538]/15 flex flex-col md:flex-row justify-between items-center px-8 py-4 w-full gap-4 z-50">
        <div className="font-mono text-[10px] tracking-widest uppercase text-[#d3c5ac]/60">
          SECURE TERMINAL ACCESS // AES-256 ENCRYPTED
        </div>
        <nav className="flex gap-6">
          <a className="font-mono text-[10px] tracking-widest uppercase text-[#d3c5ac]/40 hover:text-[#f0b90b] transition-colors" href="#">Terms of Service</a>
          <a className="font-mono text-[10px] tracking-widest uppercase text-[#d3c5ac]/40 hover:text-[#f0b90b] transition-colors" href="#">Privacy Policy</a>
          <a className="font-mono text-[10px] tracking-widest uppercase text-[#d3c5ac]/40 hover:text-[#f0b90b] transition-colors flex items-center gap-1" href="#">
            <span className="w-1.5 h-1.5 bg-[#b1e4ff] rounded-full"></span>
            System Status
          </a>
        </nav>
      </footer>
    </div>
  );
}
