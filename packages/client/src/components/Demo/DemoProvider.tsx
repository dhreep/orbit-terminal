import { createContext, useContext, useState, useCallback } from 'react';

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

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem(DEMO_KEY) === 'true');

  const enableDemo = useCallback(async () => {
    localStorage.setItem(DEMO_KEY, 'true');
    await fetch('/api/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    setIsDemoMode(true);
  }, []);

  const exitDemo = useCallback(async () => {
    localStorage.removeItem(DEMO_KEY);
    await fetch('/api/demo/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    setIsDemoMode(false);
    window.location.reload();
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode, enableDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}
