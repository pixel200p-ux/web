import { useState } from 'react';
import { Card, Input, Button, Badge } from '../components/ui';
import { showToast } from '../components/Toast';
import { useAuth } from '../lib/auth';
import { useSettings, type ThemeMode, type Currency } from '../lib/settings';
import { MasterDataSection } from '../components/MasterDataSection';
import type { PortfolioData } from '../lib/dataStore';
import type { TargetAllocation } from '../engine/types';

export function SettingsPage({ data }: { data: PortfolioData }) {
  const { user, signOut } = useAuth();
  const { settings, setTheme, setCurrency, setExchangeRate, resolvedTheme } = useSettings();
  const [alloc, setAlloc] = useState<TargetAllocation>({ ...data.targetAllocation });
  const [threshold, setThreshold] = useState('5');
  const [exchangeRateInput, setExchangeRateInput] = useState(String(settings.exchangeRate));

  const handleSave = () => {
    showToast('Đã lưu cài đặt (bản thử nghiệm)', 'success');
  };

  const handleSaveExchangeRate = () => {
    const rate = parseFloat(exchangeRateInput);
    if (rate > 0) {
      setExchangeRate(rate);
      showToast('Tỷ giá đã cập nhật', 'success');
    }
  };

  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'dark', label: 'Tối', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
    { value: 'light', label: 'Sáng', icon: 'M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364-6.364l-1.06 1.06M6.696 17.304l-1.06 1.06m12.728 0l-1.06-1.06M6.696 6.696l-1.06-1.06M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
    { value: 'system', label: 'Hệ thống', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  const currencyOptions: { value: Currency; label: string }[] = [
    { value: 'VND', label: 'VND (₫)' },
    { value: 'USD', label: 'USD ($)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cài đặt</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Cấu hình hệ thống</p>
      </div>

      {/* Profile */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Hồ sơ</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">{user?.email || 'user@example.com'}</p>
                <Badge variant="success">Đã đăng nhập</Badge>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={signOut}>Đăng xuất</Button>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Tùy chọn</h3>
        <div className="space-y-6">
          {/* Theme */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Theme</p>
            <div className="flex gap-2">
              {themeOptions.map(opt => {
                const isActive = settings.theme === opt.value;
                const isResolved = opt.value !== 'system' && resolvedTheme === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-lg border p-3 transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={opt.icon} />
                    </svg>
                    <span className="text-xs font-medium">{opt.label}</span>
                    {isActive && isResolved && <span className="text-[10px] text-blue-400">Đang dùng</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Tiền tệ</p>
            <div className="flex gap-2">
              {currencyOptions.map(opt => {
                const isActive = settings.currency === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setCurrency(opt.value)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-slate-400">Đồng bộ với nút chuyển đổi trên header</p>
          </div>

          {/* Exchange Rate */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Tỷ giá</p>
            <div className="flex items-end gap-2">
              <div className="w-48">
                <Input
                  label="1 USD ="
                  type="number"
                  value={exchangeRateInput}
                  onChange={setExchangeRateInput}
                  step="1"
                />
              </div>
              <span className="pb-2 text-sm text-slate-500">VND</span>
              <Button variant="secondary" onClick={handleSaveExchangeRate}>Lưu</Button>
            </div>
            <p className="mt-1 text-xs text-slate-400">Automatic exchange rate coming in future version.</p>
          </div>

          {/* Language (Coming Soon) */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 018.91 8.5m0 0a18.5 18.5 0 01-5.4 2.5m1.06-2.5L9 17m4.96-9.5a18.5 18.5 0 015.4-2.5M14 3v2m6 0h-6" /></svg>
              <span className="text-sm text-slate-600 dark:text-slate-300">Ngôn ngữ</span>
            </div>
            <Badge variant="default">Sắp có</Badge>
          </div>

          {/* Timezone (Coming Soon) */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm text-slate-600 dark:text-slate-300">Múi giờ</span>
            </div>
            <Badge variant="default">Sắp có</Badge>
          </div>

          {/* Number Format (Coming Soon) */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16M4 4h16" /></svg>
              <span className="text-sm text-slate-600 dark:text-slate-300">Định dạng số</span>
            </div>
            <Badge variant="default">Sắp có</Badge>
          </div>
        </div>
      </Card>

      {/* Master Data / Asset Management */}
      <MasterDataSection />

      {/* Target Allocation */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Phân bổ mục tiêu</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(Object.keys(alloc) as (keyof TargetAllocation)[]).map(key => (
            <Input
              key={key}
              label={`${key} (%)`}
              type="number"
              value={alloc[key]}
              onChange={(v) => setAlloc(prev => ({ ...prev, [key]: parseFloat(v) || 0 }))}
            />
          ))}
        </div>
        <div className="mt-2 text-sm text-slate-400">
          Tổng: {Object.values(alloc).reduce((s, v) => s + v, 0).toFixed(0)}%
        </div>
      </Card>

      {/* Rebalance Threshold */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ngưỡng tái cân bằng</h3>
        <div className="w-48">
          <Input label="Ngưỡng (% lệch)" type="number" value={threshold} onChange={setThreshold} />
        </div>
      </Card>

      {/* Backup */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Sao lưu &amp; Khôi phục</h3>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => showToast('Xuất dữ liệu (bản thử nghiệm)', 'info')}>Xuất dữ liệu</Button>
          <Button variant="secondary" onClick={() => showToast('Nhập dữ liệu (bản thử nghiệm)', 'info')}>Nhập dữ liệu</Button>
        </div>
      </Card>

      {/* About */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Thông tin ứng dụng</h3>
        <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
          <p>Portfolio Manager T+ — Bản thử nghiệm</p>
          <p>Dữ liệu tĩnh (chưa realtime)</p>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">Lưu thay đổi</Button>
      </div>
    </div>
  );
}
