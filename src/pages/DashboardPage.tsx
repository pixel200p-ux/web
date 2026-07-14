import { Card, Table, Badge, EmptyState } from '../components/ui';
import { formatPct } from '../lib/dataStore';
import { useSettings } from '../lib/settings';
import type { PortfolioData } from '../lib/dataStore';

export function DashboardPage({ data }: { data: PortfolioData }) {
  const { summary, transactions, targetAllocation } = data;
  const { formatMoney } = useSettings();

  const categoryLabels: Record<string, string> = {
    STOCK: 'Stock',
    CRYPTO: 'Crypto',
    ETF: 'ETF',
    FUND: 'DCDS',
    BANK_DEPOSIT: 'Bank',
    CASH: 'Cash',
  };

  const recentTxs = [...transactions]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 8);

  const allocData = Object.entries(summary.allocation).map(([key, pct]) => ({
    key,
    label: categoryLabels[key] || key,
    pct,
    value: summary.categoryBreakdown[key] || 0,
  }));

  const colors: Record<string, string> = {
    STOCK: '#3b82f6',
    CRYPTO: '#f59e0b',
    ETF: '#10b981',
    FUND: '#8b5cf6',
    BANK_DEPOSIT: '#ec4899',
    CASH: '#64748b',
  };

  let cumulativePct = 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  // Total deposits minus withdrawals — original capital only.
  // Never includes realized/unrealized P&L, interest, dividends, or T+ profit.
  const totalDeposit = transactions
    .filter(t => t.transaction_type === 'DEPOSIT')
    .reduce((s, t) => s + t.amount, 0)
    - transactions
      .filter(t => t.transaction_type === 'WITHDRAW')
      .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Tổng quan toàn bộ danh mục đầu tư</p>
      </div>

      {/* KPI Cards — 2 cols on mobile, 4 on desktop, compact */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
        {/* Tổng tài sản */}
        <div className="flex min-h-[90px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[120px] md:p-5">
          <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">Tổng tài sản</p>
          <h3 className="mt-1 truncate text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-2xl">{formatMoney(summary.totalAsset)}</h3>
          <p className={`mt-0.5 truncate text-[10px] font-semibold md:text-xs ${summary.totalReturnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatPct(summary.totalReturnPct)}</p>
        </div>

        {/* Cash */}
        <div className="flex min-h-[90px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[120px] md:p-5">
          <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">Cash</p>
          <h3 className="mt-1 truncate text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-2xl">{formatMoney(summary.totalCash)}</h3>
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400 md:text-xs">{summary.allocation.CASH?.toFixed(1) || 0}% tổng tài sản</p>
        </div>

        {/* Tổng tiền đã nạp */}
        <div className="flex min-h-[90px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[120px] md:p-5">
          <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">Tổng tiền đã nạp</p>
          <h3 className="mt-1 truncate text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-2xl">{formatMoney(totalDeposit)}</h3>
          <p className="mt-0.5 truncate text-[10px] font-medium text-blue-500 md:text-xs">Vốn gốc</p>
        </div>

        {/* Tổng Lãi/Lỗ */}
        <div className="flex min-h-[90px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[120px] md:p-5">
          <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">Tổng Lãi/Lỗ</p>
          <h3 className="mt-1 truncate text-base font-bold tracking-tight text-white md:text-2xl">
            {summary.totalPnL >= 0 ? '+' : ''}{formatMoney(summary.totalPnL)}
          </h3>
          <p className={`mt-0.5 truncate text-[10px] font-semibold md:text-xs ${summary.totalReturnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatPct(summary.totalReturnPct)}</p>
        </div>
      </div>

      {/* Allocation + Asset Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Donut Chart */}
        <Card className="lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Phân bổ tài sản</h3>
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="20" className="dark:stroke-slate-700" />
                {allocData.map((item) => {
                  const dash = (item.pct / 100) * circumference;
                  const offset = -cumulativePct * circumference / 100;
                  cumulativePct += item.pct;
                  return (
                    <circle
                      key={item.key}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="none"
                      stroke={colors[item.key] || '#94a3b8'}
                      strokeWidth="20"
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={offset}
                      transform="rotate(-90 100 100)"
                    />
                  );
                })}
                <text x="100" y="95" textAnchor="middle" className="fill-slate-400 text-xs">Tổng</text>
                <text x="100" y="115" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-sm font-bold">
                  {formatMoney(summary.totalAsset)}
                </text>
              </svg>
            </div>
            <div className="mt-4 w-full space-y-2">
              {allocData.map(item => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[item.key] || '#94a3b8' }} />
                    <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{item.pct.toFixed(1)}%</span>
                    {targetAllocation[item.key as keyof typeof targetAllocation] !== undefined && (
                      <Badge variant={Math.abs(item.pct - targetAllocation[item.key as keyof typeof targetAllocation]) > 5 ? 'warning' : 'success'}>
                        Mục tiêu: {targetAllocation[item.key as keyof typeof targetAllocation]}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Asset Summary by Category */}
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Tổng hợp theo nhóm</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {allocData.filter(a => a.key !== 'CASH').map(item => (
              <div key={item.key} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:p-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[item.key] || '#94a3b8' }} />
                  <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
                </div>
                <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">{formatMoney(item.value)}</p>
                <p className="text-xs text-slate-400">{item.pct.toFixed(1)}% danh mục</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Giao dịch gần đây</h3>
        {recentTxs.length === 0 ? (
          <EmptyState message="Chưa có giao dịch nào" />
        ) : (
          <Table
            columns={[
              { key: 'date', label: 'Ngày' },
              { key: 'type', label: 'Loại' },
              { key: 'asset', label: 'Tài sản' },
              { key: 'amount', label: 'Giá trị', align: 'right' },
              { key: 'status', label: 'Trạng thái', align: 'center' },
            ]}
            rows={recentTxs}
            renderRow={(tx) => {
              const asset = data.assets.find(a => a.id === tx.asset_id);
              return {
                date: tx.transaction_date,
                type: <Badge variant={tx.transaction_type === 'BUY' ? 'info' : tx.transaction_type === 'SELL' ? 'warning' : tx.transaction_type === 'DEPOSIT' ? 'success' : 'default'}>{tx.transaction_type}</Badge>,
                asset: asset?.symbol || 'Cash',
                amount: <span className="whitespace-nowrap">{formatMoney(tx.amount)}</span>,
                status: <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'}>{tx.status === 'COMPLETED' ? 'Hoàn tất' : 'Chờ'}</Badge>,
              };
            }}
          />
        )}
      </Card>

      {/* Alerts */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Cảnh báo</h3>
        <div className="space-y-2">
          {allocData.filter(a => {
            const target = targetAllocation[a.key as keyof typeof targetAllocation];
            return target !== undefined && Math.abs(a.pct - target) > 5;
          }).map(a => (
            <div key={a.key} className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span className="text-sm text-amber-700 dark:text-amber-400">
                {a.label} đang lệch {a.pct > (targetAllocation[a.key as keyof typeof targetAllocation] || 0) ? 'cao' : 'thấp'} hơn mục tiêu ({a.pct.toFixed(1)}% vs {targetAllocation[a.key as keyof typeof targetAllocation]}%)
              </span>
            </div>
          ))}
          {allocData.every(a => {
            const target = targetAllocation[a.key as keyof typeof targetAllocation];
            return target === undefined || Math.abs(a.pct - target) <= 5;
          }) && (
            <EmptyState message="Không có cảnh báo nào" />
          )}
        </div>
      </Card>
    </div>
  );
}
