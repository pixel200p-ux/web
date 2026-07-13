import { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { SettingsProvider, useSettings } from './lib/settings';
import { LoginPage } from './pages/LoginPage';
import { Sidebar, type PageId } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { AssetModulePage } from './pages/AssetModulePage';
import { TransactionsPage } from './pages/TransactionsPage';
import { TradeTPlusPage } from './pages/TradeTPlusPage';
import { ReportsPage } from './pages/ReportsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { loadMockData, type PortfolioData } from './lib/dataStore';

function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useSettings();
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      title={isDark ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
    >
      {isDark ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364-6.364l-1.06 1.06M6.696 17.304l-1.06 1.06m12.728 0l-1.06-1.06M6.696 6.696l-1.06-1.06M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function CurrencyToggle() {
  const { settings, toggleCurrency } = useSettings();
  return (
    <button
      onClick={toggleCurrency}
      className="flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      title="Chuyển đơn vị tiền tệ"
    >
      {settings.currency === 'VND' ? 'VND' : 'USD'}
      <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
      <span className="text-slate-400">{settings.currency === 'VND' ? 'USD' : 'VND'}</span>
    </button>
  );
}

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const data: PortfolioData = useMemo(() => loadMockData(), []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-400">Đang tải...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage data={data} />;
      case 'stocks': return <AssetModulePage data={data} assetType="STOCK" title="Stock" subtitle="Quản lý Stock VPS & SSI" />;
      case 'crypto': return <AssetModulePage data={data} assetType="CRYPTO" title="Crypto" subtitle="Quản lý ví crypto" currencyLabel="USDT" />;
      case 'etf': return <AssetModulePage data={data} assetType="ETF" title="ETF" subtitle="Quản lý quỹ ETF" />;
      case 'dcds': return <AssetModulePage data={data} assetType="FUND" title="DCDS" subtitle="Quản lý quỹ mở DCDS" />;
      case 'bank': return <AssetModulePage data={data} assetType="BANK_DEPOSIT" title="Bank" subtitle="Quản lý tiền gửi Bank" />;
      case 'transactions': return <TransactionsPage data={data} />;
      case 'tplus': return <TradeTPlusPage data={data} />;
      case 'reports': return <ReportsPage data={data} />;
      case 'simulator': return <SimulatorPage data={data} />;
      case 'audit': return <AuditPage data={data} />;
      case 'settings': return <SettingsPage data={data} />;
      default: return <DashboardPage data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        current={page}
        onNavigate={setPage}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="md:ml-64">
        {/* Mobile + Desktop header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(true)} className="text-slate-600 dark:text-slate-300 md:hidden">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-200">Portfolio Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <CurrencyToggle />
            <ThemeToggle />
          </div>
        </div>
        <main className="p-4 md:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
