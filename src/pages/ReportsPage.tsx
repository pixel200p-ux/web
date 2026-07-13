import { Card, StatCard, Table, Badge, EmptyState } from '../components/ui';
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tổng Lãi/Lỗ" value={formatMoney(summary.totalPnL)} trend={summary.totalPnL >= 0 ? 'up' : 'down'} />
          <StatCard title="Chưa thực hiện" value={formatMoney(summary.totalUnrealizedPnL)} trend={summary.totalUnrealizedPnL >= 0 ? 'up' : 'down'} />
          <StatCard title="Đã thực hiện" value={formatMoney(summary.totalRealizedPnL)} trend={summary.totalRealizedPnL >= 0 ? 'up' : 'down'} />
          <StatCard title="Tổng lợi nhuận" value={formatPct(summary.totalReturnPct)} trend={summary.totalReturnPct >= 0 ? 'up' : 'down'} />
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
