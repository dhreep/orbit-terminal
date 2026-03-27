import { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
const DEMO_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA'];

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem(DEMO_KEY) === 'true');

  const enableDemo = useCallback(() => {
    localStorage.setItem(DEMO_KEY, 'true');
    setIsDemoMode(true);
  }, []);

  const exitDemo = useCallback(() => {
    localStorage.removeItem(DEMO_KEY);
    setIsDemoMode(false);
  }, []);

  // Pre-populate watchlist with demo tickers on first demo activation
  useEffect(() => {
    if (isDemoMode) {
      const seeded = localStorage.getItem('orbit-demo-seeded');
      if (!seeded) {
        localStorage.setItem('orbit-demo-seeded', 'true');
        // Seed watchlist via API (best-effort, no-key Yahoo fallback)
        Promise.allSettled(
          DEMO_TICKERS.map((t) =>
            fetch('/api/watchlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ticker: t }),
            })
          )
        );
      }
    }
  }, [isDemoMode]);

  return (
    <DemoContext.Provider value={{ isDemoMode, enableDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export { DEMO_TICKERS };
