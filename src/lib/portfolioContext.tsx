import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PortfolioData } from './dataStore';
import { loadPortfolio } from './portfolioRepository';

interface PortfolioContextValue { data: PortfolioData | null; loading: boolean; error: string | null; refresh: () => Promise<void>; }
const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortfolioData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => { setLoading(true); try { setData(await loadPortfolio()); setError(null); } catch (cause) { setData(null); setError(cause instanceof Error ? cause.message : 'Không thể tải Portfolio'); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return <PortfolioContext.Provider value={{ data, loading, error, refresh }}>{children}</PortfolioContext.Provider>;
}
export function usePortfolio() { const value = useContext(PortfolioContext); if (!value) throw new Error('usePortfolio must be used within PortfolioProvider'); return value; }
