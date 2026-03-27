import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api, setAuthToken } from '../../services/api';
import { encrypt, decrypt, hashPassword } from '../../services/CryptoService';
import type { EncryptedKeyRecord, ApiProvider } from '@orbit/shared';

interface VaultState {
  status: 'loading' | 'uninitialized' | 'locked' | 'unlocked';
  keys: Map<ApiProvider, string>; // decrypted API keys in volatile memory
}

interface VaultContextType extends VaultState {
  initVault: (password: string) => Promise<void>;
  unlockVault: (password: string) => Promise<void>;
  lockVault: () => Promise<void>;
  addApiKey: (provider: ApiProvider, apiKey: string) => Promise<void>;
  removeApiKey: (provider: ApiProvider) => Promise<void>;
  getApiKey: (provider: ApiProvider) => string | undefined;
}

const VaultContext = createContext<VaultContextType | null>(null);

export function useVault(): VaultContextType {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VaultState>({
    status: 'loading',
    keys: new Map(),
  });
  const [password, setPassword] = useState<string | null>(null);

  // Check vault status on mount
  useEffect(() => {
    api.vault.getStatus().then((status) => {
      setState((prev) => ({
        ...prev,
        status: status.initialized ? 'locked' : 'uninitialized',
      }));
    }).catch(() => {
      setState((prev) => ({ ...prev, status: 'uninitialized' }));
    });
  }, []);

  const bootIdRef = useRef<string | null>(null);

  // Boot ID–based sync: poll /api/health every 30s, re-sync only if server restarted
  useEffect(() => {
    if (state.status !== 'unlocked') return;

    const checkAndSync = async () => {
      try {
        const health = await fetch('/api/health').then(r => r.json());
        const newBootId = health.bootId as string;

        if (!bootIdRef.current) {
          bootIdRef.current = newBootId;
          return;
        }

        if (newBootId !== bootIdRef.current) {
          console.warn('🔄 [Vault] Server restarted (bootId changed), re-syncing keys...');
          bootIdRef.current = newBootId;
          const providers: ApiProvider[] = ['alpha_vantage', 'fmp', 'finnhub'];
          for (const p of providers) {
            if (state.keys.has(p)) {
              await api.market.setSessionKey(p, state.keys.get(p)!);
            }
          }
        }
      } catch (e) {
        console.error('[Vault] Health check failed:', e);
      }
    };

    checkAndSync();
    const timer = setInterval(checkAndSync, 30000);
    return () => clearInterval(timer);
  }, [state.status, state.keys]);

  const initVault = useCallback(async (pwd: string) => {
    const { hash, salt } = await hashPassword(pwd);
    await api.vault.init(hash, salt);
    setPassword(pwd);
    setState({ status: 'unlocked', keys: new Map() });
  }, []);

  const unlockVault = useCallback(async (pwd: string) => {
    // Get salt, hash password with it, and verify
    const vaultStatus = await api.vault.getStatus();
    if (!vaultStatus.salt) throw new Error('Vault not initialized');

    const { hash } = await hashPassword(pwd, vaultStatus.salt);
    const result = await api.vault.verify(hash);
    setAuthToken(result.token);

    // Decrypt all stored keys
    const encryptedKeys = await api.vault.getKeys();
    const decryptedKeys = new Map<ApiProvider, string>();

    for (const record of encryptedKeys) {
      try {
        const decrypted = await decrypt(record.encryptedBlob, pwd);
        decryptedKeys.set(record.provider, decrypted);
        // Send to server session (volatile memory only)
        await api.market.setSessionKey(record.provider, decrypted);
      } catch (e) {
        console.error(`Failed to decrypt key for ${record.provider}:`, e);
      }
    }

    setPassword(pwd);
    setState({ status: 'unlocked', keys: decryptedKeys });
  }, []);

  const lockVault = useCallback(async () => {
    await api.market.lockSession();
    setAuthToken(null);
    setPassword(null);
    setState({ status: 'locked', keys: new Map() });
  }, []);

  const addApiKey = useCallback(async (provider: ApiProvider, apiKey: string) => {
    if (!password) throw new Error('Vault is locked');

    // Encrypt in browser
    const blob = await encrypt(apiKey, password);
    // Store ciphertext on server
    await api.vault.storeKey(provider, blob);
    // Set in session for immediate use
    await api.market.setSessionKey(provider, apiKey);

    setState((prev) => {
      const newKeys = new Map(prev.keys);
      newKeys.set(provider, apiKey);
      return { ...prev, keys: newKeys };
    });
  }, [password]);

  const removeApiKey = useCallback(async (provider: ApiProvider) => {
    await api.vault.deleteKey(provider);
    setState((prev) => {
      const newKeys = new Map(prev.keys);
      newKeys.delete(provider);
      return { ...prev, keys: newKeys };
    });
  }, []);

  const getApiKey = useCallback((provider: ApiProvider) => {
    return state.keys.get(provider);
  }, [state.keys]);

  return (
    <VaultContext.Provider
      value={{
        ...state,
        initVault,
        unlockVault,
        lockVault,
        addApiKey,
        removeApiKey,
        getApiKey,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}
