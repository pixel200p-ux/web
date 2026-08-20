import { useMemo, useState } from 'react';
import { Card, Table, Badge, EmptyState } from '../components/ui';
import { formatPct } from '../lib/dataStore';
import { useSettings } from '../lib/settings';
import type { PortfolioData } from '../lib/dataStore';
import { Calendar } from 'lucide-react';

export function ReportsPage({ data }: { data: PortfolioData }) {
  const { summary, incomes, expenses, transactions } = data;
  const { formatMoney } = useSettings();

  // ─── Date Filter ────────────────────────────────────────────
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const isDateInRange = (date: string) => {
    // Không nhập ngày nào → từ đầu đến nay
    if (!fromDate && !toDate) return true;

    // Chỉ nhập ngày bắt đầu → từ ngày đó đến nay
    if (fromDate && !toDate) {
      return date >= fromDate;
    }

    // Chỉ nhập ngày kết thúc → từ đầu đến ngày đó
    if (!fromDate && toDate) {
      return date <= toDate;
    }

    // Nhập cả hai → từ ngày bắt đầu đến ngày kết thúc
    return date >= fromDate && date <= toDate;
  };

  // ─── Filter Transactions ────────────────────────────────────
  const filteredTransactions = useMemo(
    () => transactions.filter(t => isDateInRange(t.transaction_date)),
    [transactions, fromDate, toDate]
  );

  // ─── Filter Income / Expense ────────────────────────────────
  const filteredIncomes = useMemo(
    () => incomes.filter(i => isDateInRange(i.income_date)),
    [incomes, fromDate, toDate]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter(e => isDateInRange(e.expense_date)),
    [expenses, fromDate, toDate]
  );

  // ─── Cash Flow ──────────────────────────────────────────────
  const cashInflow = filteredTransactions
    .filter(t =>
      ['DEPOSIT', 'SELL', 'DIVIDEND', 'INTEREST'].includes(
        t.transaction_type
      )
    )
    .reduce((s, t) => s + t.amount, 0);

  const cashOutflow = filteredTransactions
    .filter(t =>
      ['BUY', 'WITHDRAW', 'FEE', 'TAX'].includes(
        t.transaction_type
      )
    )
    .reduce(
      (s, t) =>
        s + t.amount + (t.fee || 0) + (t.tax || 0),
      0
    );

  const netCashFlow = cashInflow - cashOutflow;

  // ─── Realized P/L ───────────────────────────────────────────
  // Chỉ tính lãi/lỗ khi có lệnh SELL hoàn tất.
  // Giá thị trường hiện tại KHÔNG tạo ra Realized P/L.
  const realizedTransactions = filteredTransactions.filter(
    t =>
      t.transaction_type === 'SELL' &&
      t.status === 'COMPLETED'
  );

  const realizedPnL = useMemo(() => {
    return realizedTransactions.reduce((total, tx) => {
      const holding = data.holdings.find(
        h => h.asset_id === tx.asset_id
      );

      if (!holding) return total;

      const quantity = tx.quantity || 0;
      const price = tx.price || 0;

      const netSell =
        quantity * price -
        (tx.fee || 0) -
        (tx.tax || 0);

      const recoveredCost =
        quantity * holding.average_cost;

      return total + (netSell - recoveredCost);
    }, 0);
  }, [realizedTransactions, data.holdings]);

  // ─── Display P/L ────────────────────────────────────────────
  const unrealizedPnL = summary.totalUnrealizedPnL;
  const periodTotalPnL = realizedPnL;

  // ─── Period Return ──────────────────────────────────────────
  const periodNetDeposit = filteredTransactions.reduce(
    (sum, tx) => {
      if (tx.transaction_type === 'DEPOSIT') {
        return sum + tx.amount;
      }

      if (tx.transaction_type === 'WITHDRAW') {
        return sum - tx.amount;
      }

      return sum;
    },
    0
  );

  const periodReturnPct =
    periodNetDeposit !== 0
      ? (periodTotalPnL / periodNetDeposit) * 100
      : 0;

  // ─── Reset ──────────────────────────────────────────────────
  const resetDateFilter = () => {
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Báo cáo
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Phân tích hiệu suất danh mục
          </p>
        </div>

        {/* Khoảng thời gian */}
<div
  className="
    w-[350px]
    shrink-0
    rounded-2xl
    border border-slate-200
    bg-white
    p-3
    shadow-sm
    dark:border-slate-700
    dark:bg-slate-800/50
  "
>
  <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
    Khoảng thời gian
  </label>

  <div className="flex items-center gap-2">

    {/* Ô TRÁI - TỪ NGÀY */}
    <div className="relative flex-1">

      {!fromDate && (
        <button
          type="button"
          onClick={() => {
            const input = document.getElementById(
              'report-from-date'
            ) as HTMLInputElement | null;

            input?.showPicker?.();
            input?.focus();
          }}
          className="
            h-10
            w-full
            rounded-lg
            border border-slate-300
            bg-slate-100
            px-3
            pr-10
            text-left
            text-sm
            text-slate-500
            outline-none
            hover:bg-slate-200
            dark:border-slate-600
            dark:bg-slate-700
            dark:text-slate-300
          "
        >
          Từ đầu

          <Calendar
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </button>
      )}

      <input
        id="report-from-date"
        type="date"
        value={fromDate}
        onChange={e => setFromDate(e.target.value)}
        className={`
          h-10
          w-full
          rounded-lg
          border border-slate-300
          bg-slate-100
          px-3
          text-sm
          text-slate-700
          outline-none
          focus:border-indigo-500
          dark:border-slate-600
          dark:bg-slate-700
          dark:text-slate-200
          ${!fromDate ? 'absolute inset-0 cursor-pointer opacity-0' : ''}
        `}
      />

    </div>

    {/* Ô PHẢI - ĐẾN NGÀY */}
    <div className="relative flex-1">

      {!toDate && (
        <button
          type="button"
          onClick={() => {
            const input = document.getElementById(
              'report-to-date'
            ) as HTMLInputElement | null;

            input?.showPicker?.();
            input?.focus();
          }}
          className="
            h-10
            w-full
            rounded-lg
            border border-slate-300
            bg-slate-100
            px-3
            pr-10
            text-left
            text-sm
            text-slate-500
            outline-none
            hover:bg-slate-200
            dark:border-slate-600
            dark:bg-slate-700
            dark:text-slate-300
          "
        >
          Đến nay

          <Calendar
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </button>
      )}

      <input
        id="report-to-date"
        type="date"
        value={toDate}
        onChange={e => setToDate(e.target.value)}
        className={`
          h-10
          w-full
          rounded-lg
          border border-slate-300
          bg-slate-100
          px-3
          text-sm
          text-slate-700
          outline-none
          focus:border-indigo-500
          dark:border-slate-600
          dark:bg-slate-700
          dark:text-slate-200
          ${!toDate ? 'absolute inset-0 cursor-pointer opacity-0' : ''}
        `}
      />

    </div>

    {/* NÚT XÓA */}
    <button
      type="button"
      onClick={resetDateFilter}
      title="Xóa khoảng thời gian"
      className="
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-lg
        border border-slate-300
        bg-slate-100
        text-lg
        text-slate-500
        transition
        hover:bg-slate-200
        hover:text-rose-500
        dark:border-slate-600
        dark:bg-slate-700
        dark:text-slate-400
        dark:hover:bg-slate-600
        dark:hover:text-rose-400
      "
    >
      ×
    </button>

  </div>
</div>
      </div>

      {/* Profit Report */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-700 dark:text-slate-300">
          Báo cáo lợi nhuận
        </h2>

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">

          {/* Total P/L */}
          <div className="flex min-h-[75px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[100px] md:p-5">
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">
              Tổng Lãi/Lỗ
            </p>

            <h3 className={`mt-1 truncate text-base font-bold tracking-tight md:text-2xl ${
              periodTotalPnL >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}>
              {periodTotalPnL >= 0 ? '+' : ''}
              {formatMoney(periodTotalPnL)}
            </h3>
          </div>

          {/* Unrealized */}
          <div className="flex min-h-[75px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[100px] md:p-5">
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">
              Chưa thực hiện
            </p>

            <h3 className={`mt-1 truncate text-base font-bold tracking-tight md:text-2xl ${
              unrealizedPnL >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}>
              {unrealizedPnL >= 0 ? '+' : ''}
              {formatMoney(unrealizedPnL)}
            </h3>
          </div>

          {/* Realized */}
          <div className="flex min-h-[75px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[100px] md:p-5">
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">
              Đã thực hiện
            </p>

            <h3 className={`mt-1 truncate text-base font-bold tracking-tight md:text-2xl ${
              realizedPnL >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}>
              {realizedPnL >= 0 ? '+' : ''}
              {formatMoney(realizedPnL)}
            </h3>
          </div>

          {/* Return */}
          <div className="flex min-h-[75px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:min-h-[100px] md:p-5">
            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 md:text-sm">
              Tổng lợi nhuận
            </p>

            <h3 className={`mt-1 truncate text-base font-bold tracking-tight md:text-2xl ${
              periodReturnPct >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}>
              {formatPct(periodReturnPct)}
            </h3>
          </div>

        </div>
      </div>

      {/* Cash Flow */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Báo cáo dòng tiền
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700/50">
            <span className="text-sm text-slate-500">
              Tiền vào
            </span>
            <span className="text-sm font-medium text-emerald-500">
              {formatMoney(cashInflow)}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-700/50">
            <span className="text-sm text-slate-500">
              Tiền ra
            </span>
            <span className="text-sm font-medium text-rose-500">
              {formatMoney(cashOutflow)}
            </span>
          </div>

          <div className="flex justify-between pb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Dòng tiền ròng
            </span>

            <span className={`text-sm font-bold ${
              netCashFlow >= 0
                ? 'text-emerald-500'
                : 'text-rose-500'
            }`}>
              {formatMoney(netCashFlow)}
            </span>
          </div>
        </div>
      </Card>

      {/* Income Report */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Thu nhập
        </h3>

        {filteredIncomes.length === 0 ? (
          <EmptyState message="Chưa có thu nhập nào trong khoảng thời gian này" />
        ) : (
          <Table
            columns={[
              { key: 'type', label: 'Loại' },
              { key: 'date', label: 'Ngày' },
              { key: 'amount', label: 'Số tiền', align: 'right' },
            ]}
            rows={filteredIncomes}
            renderRow={(inc) => ({
              type: (
                <Badge variant="success">
                  {inc.income_type}
                </Badge>
              ),
              date: inc.income_date,
              amount: formatMoney(inc.amount),
            })}
          />
        )}
      </Card>

      {/* Expense Report */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Chi phí
        </h3>

        {filteredExpenses.length === 0 ? (
          <EmptyState message="Chưa có chi phí nào trong khoảng thời gian này" />
        ) : (
          <Table
            columns={[
              { key: 'type', label: 'Loại' },
              { key: 'date', label: 'Ngày' },
              { key: 'amount', label: 'Số tiền', align: 'right' },
            ]}
            rows={filteredExpenses}
            renderRow={(exp) => ({
              type: (
                <Badge variant="error">
                  {exp.expense_type}
                </Badge>
              ),
              date: exp.expense_date,
              amount: formatMoney(exp.amount),
            })}
          />
        )}
      </Card>

      {/* Allocation Report */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Báo cáo phân bổ
        </h3>

        <Table
          columns={[
            { key: 'category', label: 'Nhóm' },
            { key: 'current', label: 'Hiện tại', align: 'right' },
            { key: 'target', label: 'Mục tiêu', align: 'right' },
            { key: 'diff', label: 'Chênh lệch', align: 'right' },
          ]}
          rows={Object.entries(summary.allocation)}
          renderRow={([key, pct]) => {
            const target =
              data.targetAllocation[
                key as keyof typeof data.targetAllocation
              ] ?? 0;

            const diff = pct - target;

            return {
              category: key,
              current: `${pct.toFixed(1)}%`,
              target: `${target}%`,
              diff: (
                <span
                  className={
                    Math.abs(diff) > 5
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }
                >
                  {diff > 0 ? '+' : ''}
                  {diff.toFixed(1)}%
                </span>
              ),
            };
          }}
        />
      </Card>

    </div>
  );
}