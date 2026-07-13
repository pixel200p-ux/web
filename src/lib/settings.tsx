import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type Currency = 'VND' | 'USD';
export type NumberFormat = 'vi-VN' | 'en-US';

export interface AppSettings {
  theme: ThemeMode;
  currency: Currency;
  exchangeRate: number;
  language: string;
  timezone: string;
  numberFormat: NumberFormat;
}

interface SettingsContextValue {
  settings: AppSettings;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: ThemeMode) => void;
  setCurrency: (c: Currency) => void;
  setExchangeRate: (r: number) => void;
  toggleCurrency: () => void;
  toggleTheme: () => void;
  formatMoney: (valueVND: number, opts?: { decimals?: number; showSymbol?: boolean }) => string;
  formatMoneyInput: (valueVND: number, opts?: { decimals?: number }) => string;
  convertToUSD: (valueVND: number) => number;
  moneyPlaceholder: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  currency: 'VND',
  exchangeRate: 23400,
  language: 'vi',
  timezone: 'Asia/Ho_Chi_Minh',
  numberFormat: 'vi-VN',
};

const STORAGE_KEY = 'app-settings';

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => resolveTheme(loadSettings().theme));

  useEffect(() => {
    const resolved = resolveTheme(settings.theme);
    setResolvedTheme(resolved);
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolvedTheme(resolveTheme('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  const setTheme = (theme: ThemeMode) => setSettings(s => ({ ...s, theme }));
  const setCurrency = (currency: Currency) => setSettings(s => ({ ...s, currency }));
  const setExchangeRate = (exchangeRate: number) => setSettings(s => ({ ...s, exchangeRate }));

  const toggleTheme = () => {
    setSettings(s => ({ ...s, theme: resolvedTheme === 'dark' ? 'light' : 'dark' }));
  };

  const toggleCurrency = () => {
    setSettings(s => ({ ...s, currency: s.currency === 'VND' ? 'USD' : 'VND' }));
  };

  const convertToUSD = (valueVND: number) => valueVND / settings.exchangeRate;

  const moneyPlaceholder = settings.currency === 'VND' ? '0 ₫' : '0 USD';

  const formatMoney = (valueVND: number, opts?: { decimals?: number; showSymbol?: boolean }) => {
    const showSymbol = opts?.showSymbol !== false;
    if (settings.currency === 'USD') {
      const usd = valueVND / settings.exchangeRate;
      const decimals = opts?.decimals ?? 2;
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(usd);
      return showSymbol ? `${formatted} USD` : formatted;
    }
    const formatted = new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: opts?.decimals ?? 0,
    }).format(valueVND);
    return showSymbol ? `${formatted} ₫` : formatted;
  };

  const formatMoneyInput = (valueVND: number, opts?: { decimals?: number }) => {
    if (settings.currency === 'USD') {
      const usd = valueVND / settings.exchangeRate;
      const decimals = opts?.decimals ?? 2;
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(usd);
    }
    return new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: opts?.decimals ?? 0,
    }).format(valueVND);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        resolvedTheme,
        setTheme,
        setCurrency,
        setExchangeRate,
        toggleCurrency,
        toggleTheme,
        formatMoney,
        formatMoneyInput,
        convertToUSD,
        moneyPlaceholder,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
