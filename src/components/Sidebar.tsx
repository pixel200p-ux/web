import { useAuth } from '../lib/auth';

export type PageId =
  | 'dashboard' | 'stocks' | 'crypto' | 'etf' | 'dcds' | 'bank'
  | 'transactions' | 'tplus' | 'reports' | 'simulator' | 'audit' | 'settings';

const dashboardItem = { id: 'dashboard' as PageId, label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' };

const investmentItems: { id: PageId; label: string; icon: string }[] = [
  { id: 'dcds', label: 'DCDS', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'etf', label: 'ETF', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'stocks', label: 'Stock', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { 
  id: 'crypto', 
  label: 'Crypto', 
  icon: 'M12 3.5c-2.15 0-3.9 1.15-3.9 2.65 0 1.5 1.75 2.65 3.9 2.65s3.9 1.15 3.9 2.65-1.75 2.65-3.9 2.65-3.9 1.15-3.9 2.65S9.85 19.4 12 19.4m0-15.9v1.3m0 2.65v1.3m0 2.65v1.3m0 2.65v1.3'
},
  { id: 'bank', label: 'Bank', icon: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3' },
];

const lowerItems: { id: PageId; label: string; icon: string }[] = [
  { id: 'transactions', label: 'Transactions', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { id: 'tplus', label: 'Trade T+', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { id: 'reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'simulator', label: 'Simulator', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'audit', label: 'Audit', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
];

const settingsItem = { id: 'settings' as PageId, label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' };

export function Sidebar({
  current,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: {
  current: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { user, signOut } = useAuth();

  const renderNavButton = (item: { id: PageId; label: string; icon: string }) => (
    <button
      key={item.id}
      onClick={() => {
        onNavigate(item.id);
        onCloseMobile();
      }}
      className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        current === item.id
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
      </svg>
      {item.label}
    </button>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-700 dark:bg-slate-900 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">Portfolio</h1>
            <p className="text-xs text-slate-400">Manager T+</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {/* Dashboard */}
          {renderNavButton(dashboardItem)}

          {/* Divider after Dashboard */}
          <div className="flex justify-center py-3">
            <div className="h-px w-[70%] bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Investment Category Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm dark:border-slate-600 dark:bg-slate-800/50">
            {investmentItems.map(item => renderNavButton(item))}
          </div>

          {/* Divider after investment card */}
          <div className="flex justify-center py-3">
            <div className="h-px w-[70%] bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Lower menu */}
          {lowerItems.map(item => renderNavButton(item))}
        </nav>

        {/* Footer: Settings + User */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          {renderNavButton(settingsItem)}
          <div className="mt-2 flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || 'user@example.com'}</p>
            </div>
            <button
              onClick={signOut}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800"
              title="Đăng xuất"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
