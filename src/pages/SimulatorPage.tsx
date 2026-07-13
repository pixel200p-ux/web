import { useState } from 'react';
import { Card, StatCard, Button, Input, Badge } from '../components/ui';
import { formatPct } from '../lib/dataStore';
import { useSettings } from '../lib/settings';
import type { PortfolioData } from '../lib/dataStore';
import { futureAssetValue, portfolioStressResult } from '../engine/calc';

export function SimulatorPage({ data }: { data: PortfolioData }) {
  const { formatMoney } = useSettings();
  const [monthlyDca, setMonthlyDca] = useState('9000000');
  const [years, setYears] = useState('10');
  const [annualReturn, setAnnualReturn] = useState('8');
  const [scenario, setScenario] = useState<'bull' | 'normal' | 'bear'>('normal');
  const [result, setResult] = useState<number | null>(null);
  const [stressResult, setStressResult] = useState<number | null>(null);

  const currentAsset = data.summary.totalAsset;

  const runSimulation = () => {
    const dca = parseFloat(monthlyDca) || 0;
    const yrs = parseFloat(years) || 0;
    let rate = parseFloat(annualReturn) / 100 || 0;

    if (scenario === 'bull') rate = rate * 1.5;
    if (scenario === 'bear') rate = rate * -0.5;

    const fv = futureAssetValue(currentAsset, rate, yrs, dca);
    setResult(fv);

    // Stress test
    const stress = portfolioStressResult([
      { weight: (data.summary.allocation.STOCK || 0) / 100, shockPct: -0.2 },
      { weight: (data.summary.allocation.CRYPTO || 0) / 100, shockPct: -0.5 },
      { weight: (data.summary.allocation.ETF || 0) / 100, shockPct: -0.15 },
      { weight: (data.summary.allocation.FUND || 0) / 100, shockPct: -0.1 },
      { weight: (data.summary.allocation.CASH || 0) / 100, shockPct: 0 },
    ]);
    setStressResult(stress * currentAsset);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mô phỏng</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Mô phỏng chiến lược đầu tư</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* DCA Simulator */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Mô phỏng DCA</h3>
          <div className="space-y-4">
            <Input label="Tài sản hiện tại" type="number" value={currentAsset.toFixed(0)} onChange={() => {}} />
            <Input label="DCA hàng tháng" type="number" value={monthlyDca} onChange={setMonthlyDca} />
            <Input label="Thời gian (năm)" type="number" value={years} onChange={setYears} />
            <Input label="Lợi nhuận kỳ vọng (%/năm)" type="number" value={annualReturn} onChange={setAnnualReturn} />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Kịch bản</label>
              <div className="flex gap-2">
                {(['bull', 'normal', 'bear'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setScenario(s)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                      scenario === s
                        ? s === 'bull' ? 'bg-emerald-500 text-white'
                          : s === 'bear' ? 'bg-rose-500 text-white'
                          : 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {s === 'bull' ? 'Thị trường tăng' : s === 'bear' ? 'Thị trường giảm' : 'Bình thường'}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={runSimulation} className="w-full">Chạy mô phỏng</Button>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {result !== null && (
            <>
              <StatCard
                title="Giá trị tương lai dự kiến"
                value={formatMoney(result)}
                subtitle={formatPct(((result - currentAsset) / currentAsset) * 100)}
                trend="up"
              />
              <StatCard
                title="Tổng vốn đóng góp"
                value={formatMoney(currentAsset + (parseFloat(monthlyDca) || 0) * 12 * (parseFloat(years) || 0))}
              />
              <StatCard
                title="Lợi nhuận mô phỏng"
                value={formatMoney(result - currentAsset - (parseFloat(monthlyDca) || 0) * 12 * (parseFloat(years) || 0))}
                trend="up"
              />
            </>
          )}

          {stressResult !== null && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Kiểm tra sức chịu đựng</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Tác động thị trường giảm</span>
                  <span className="text-sm font-medium text-rose-500">{formatMoney(stressResult)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Giá trị sau stress</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatMoney(currentAsset + stressResult)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Tỷ lệ giảm</span>
                  <Badge variant="error">{formatPct((stressResult / currentAsset) * 100)}</Badge>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
