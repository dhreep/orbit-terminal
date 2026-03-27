import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setAuthToken } from '../../services/api';

interface DemoContextType {
  isDemoMode: boolean;
  enableDemo: () => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({ isDemoMode: false, enableDemo: () => {}, exitDemo: () => {} });

export function useDemo() {
  return useContext(DemoContext);
}

const DEMO_KEY = 'orbit-demo-mode';
const DEMO_TOKEN_KEY = 'orbit-demo-token';

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem(DEMO_KEY) === 'true');

  // On mount in demo mode, restore the token and re-seed if needed (handles server restart)
  useEffect(() => {
    if (!isDemoMode) return;
    const restoreSession = async () => {
      try {
        const res = await fetch('/api/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const json = await res.json();
        if (json.success && json.data?.token) {
          localStorage.setItem(DEMO_TOKEN_KEY, json.data.token);
          setAuthToken(json.data.token);
        }
      } catch {}
    };
    const savedToken = localStorage.getItem(DEMO_TOKEN_KEY);
    if (savedToken) setAuthToken(savedToken);
    restoreSession();
  }, [isDemoMode]);

  const enableDemo = useCallback(async () => {
    localStorage.setItem(DEMO_KEY, 'true');
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (json.success && json.data?.token) {
        localStorage.setItem(DEMO_TOKEN_KEY, json.data.token);
      }
    } catch {}
    window.location.reload();
  }, []);

  const exitDemo = useCallback(async () => {
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(DEMO_TOKEN_KEY);
    setAuthToken(null);
    await fetch('/api/demo/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    window.location.reload();
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode, enableDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}
