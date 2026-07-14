import { Card, Table, Badge, EmptyState } from '../components/ui';
import { formatPct } from '../lib/dataStore';
import { useSettings } from '../lib/settings';
import type { PortfolioData } from '../lib/dataStore';

export function ReportsPage({ data }: { data: PortfolioData }) {
  const { summary, incomes, expenses, transactions } = data;
  const { formatMoney } = useSettings();

  // Cash Flow
  const cashInflow = transactions
    .filter(t => ['DEPOSIT', 'SELL', 'DIVIDEND', 'INTEREST'].includes(t.transaction_type))
    .reduce((s, t) => s + t.amount, 0);
  const cashOutflow = transactions
    .filter(t => ['BUY', 'WITHDRAW', 'FEE', 'TAX'].includes(t.transaction_type))
    .reduce((s, t) => s + t.amount + (t.fee || 0) + (t.tax || 0), 0);
  const netCashFlow = cashInflow - cashOutflow;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Báo cáo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Phân tích hiệu suất danh mục</p>
      </div>

      {/* Profit Report */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-700 dark:text-slate-300">Báo cáo lợi nhuận</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
          <div className="flex min-h-[90px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[120px] md:p-5">
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">Tổng Lãi/Lỗ</p>
            <h3 className={`mt-1 truncate text-base font-bold tracking-tight md:text-2xl ${summary.totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {summary.totalPnL >= 0 ? '+' : ''}{formatMoney(summary.totalPnL)}
            </h3>
          </div>
          <div className="flex min-h-[90px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[120px] md:p-5">
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">Chưa thực hiện</p>
            <h3 className={`mt-1 truncate text-base font-bold tracking-tight md:text-2xl ${summary.totalUnrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {summary.totalUnrealizedPnL >= 0 ? '+' : ''}{formatMoney(summary.totalUnrealizedPnL)}
            </h3>
          </div>
          <div className="flex min-h-[90px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[120px] md:p-5">
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">Đã thực hiện</p>
            <h3 className={`mt-1 truncate text-base font-bold tracking-tight md:text-2xl ${summary.totalRealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {summary.totalRealizedPnL >= 0 ? '+' : ''}{formatMoney(summary.totalRealizedPnL)}
            </h3>
          </div>
          <div className="flex min-h-[90px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[120px] md:p-5">
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">Tổng lợi nhuận</p>
            <h3 className={`mt-1 truncate text-base font-bold tracking-tight md:text-2xl ${summary.totalReturnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatPct(summary.totalReturnPct)}
            </h3>
          </div>
        </div>
      </div>

      {/* Cash Flow Report */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Báo cáo dòng tiền</h3>
        <div className="space-y-2">
          <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700/50">
            <span className="text-sm text-slate-500">Tiền vào</span>
            <span className="text-sm font-medium text-emerald-500">{formatMoney(cashInflow)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700/50">
            <span className="text-sm text-slate-500">Tiền ra</span>
            <span className="text-sm font-medium text-rose-500">{formatMoney(cashOutflow)}</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dòng tiền ròng</span>
            <span className={`text-sm font-bold ${netCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatMoney(netCashFlow)}</span>
          </div>
        </div>
      </Card>

      {/* Income Report */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Thu nhập</h3>
        {incomes.length === 0 ? (
          <EmptyState message="Chưa có thu nhập nào" />
        ) : (
          <Table
            columns={[
              { key: 'type', label: 'Loại' },
              { key: 'date', label: 'Ngày' },
              { key: 'amount', label: 'Số tiền', align: 'right' },
            ]}
            rows={incomes}
            renderRow={(inc) => ({
              type: <Badge variant="success">{inc.income_type}</Badge>,
              date: inc.income_date,
              amount: formatMoney(inc.amount),
            })}
          />
        )}
      </Card>

      {/* Expense Report */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Chi phí</h3>
        {expenses.length === 0 ? (
          <EmptyState message="Chưa có chi phí nào" />
        ) : (
          <Table
            columns={[
              { key: 'type', label: 'Loại' },
              { key: 'date', label: 'Ngày' },
              { key: 'amount', label: 'Số tiền', align: 'right' },
            ]}
            rows={expenses}
            renderRow={(exp) => ({
              type: <Badge variant="error">{exp.expense_type}</Badge>,
              date: exp.expense_date,
              amount: formatMoney(exp.amount),
            })}
          />
        )}
      </Card>

      {/* Allocation Report */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Báo cáo phân bổ</h3>
        <Table
          columns={[
            { key: 'category', label: 'Nhóm' },
            { key: 'current', label: 'Hiện tại', align: 'right' },
            { key: 'target', label: 'Mục tiêu', align: 'right' },
            { key: 'diff', label: 'Chênh lệch', align: 'right' },
          ]}
          rows={Object.entries(summary.allocation)}
          renderRow={([key, pct]) => {
            const target = data.targetAllocation[key as keyof typeof data.targetAllocation] ?? 0;
            const diff = pct - target;
            return {
              category: key,
              current: `${pct.toFixed(1)}%`,
              target: `${target}%`,
              diff: <span className={Math.abs(diff) > 5 ? 'text-amber-500' : 'text-emerald-500'}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}%</span>,
            };
          }}
        />
      </Card>
    </div>
  );
}
