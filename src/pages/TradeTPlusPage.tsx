import { useState } from 'react';
import { Card, StatCard, Badge, EmptyState, Button, Modal, Input, Select } from '../components/ui';
import { showToast } from '../components/Toast';
import { useSettings } from '../lib/settings';
import type { PortfolioData } from '../lib/dataStore';
import type { TPlusCycle, TPlusAssetAnalysis } from '../engine/tplus';

type SortKey = 'remaining_loss' | 'cost_reduction' | 'pnl' | 'market_value' | 'alphabetical';
type QuickFilter = 'ALL' | 'PROFITABLE' | 'LOSING' | 'NEAR_BREAK_EVEN' | 'OPEN_TPLUS' | 'COMPLETED_TPLUS';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'remaining_loss', label: 'Lỗ còn lại (lớn nhất)' },
  { value: 'cost_reduction', label: 'Hạ giá vốn' },
  { value: 'pnl', label: 'Lãi/Lỗ' },
  { value: 'market_value', label: 'Giá trị thị trường' },
  { value: 'alphabetical', label: 'Theo alphabet' },
];

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PROFITABLE', label: 'Đang có lãi' },
  { value: 'NEAR_BREAK_EVEN', label: 'Gần hòa vốn' },
  { value: 'LOSING', label: 'Đang lỗ' },
  { value: 'OPEN_TPLUS', label: 'T+ đang mở' },
  { value: 'COMPLETED_TPLUS', label: 'T+ đã hoàn tất' },
];

function sortAnalyses(analyses: TPlusAssetAnalysis[], sortKey: SortKey): TPlusAssetAnalysis[] {
  const sorted = [...analyses];
  switch (sortKey) {
    case 'remaining_loss':
      return sorted.sort((a, b) => Math.abs(a.remaining_unrealized_loss) > Math.abs(b.remaining_unrealized_loss) ? -1 : 1);
    case 'cost_reduction':
      return sorted.sort((a, b) => b.total_cost_reduction - a.total_cost_reduction);
    case 'pnl':
      return sorted.sort((a, b) => b.remaining_unrealized_loss - a.remaining_unrealized_loss);
    case 'market_value':
      return sorted.sort((a, b) => b.market_value - a.market_value);
    case 'alphabetical':
      return sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
}

function applyQuickFilter(analyses: TPlusAssetAnalysis[], filter: QuickFilter): TPlusAssetAnalysis[] {
  switch (filter) {
    case 'PROFITABLE':
      return analyses.filter(a => a.visual_status === 'profitable');
    case 'LOSING':
      return analyses.filter(a => a.visual_status === 'losing');
    case 'NEAR_BREAK_EVEN':
      return analyses.filter(a => a.visual_status === 'near_break_even');
    case 'OPEN_TPLUS':
      return analyses.filter(a => a.open_cycles > 0);
    case 'COMPLETED_TPLUS':
      return analyses.filter(a => a.completed_cycles > 0);
    default:
      return analyses;
  }
}

function StatusBadge({ status }: { status: TPlusAssetAnalysis['visual_status'] }) {
  if (status === 'profitable') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">🟢 Đang có lãi</span>;
  }
  if (status === 'near_break_even') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">🟡 Gần hòa vốn</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">🔴 Đang lỗ</span>;
}

function BreakEvenBar({ analysis }: { analysis: TPlusAssetAnalysis }) {
  const { original_avg_cost: o, current_avg_cost: c, current_price: p } = analysis;
  const maxVal = Math.max(o, c, p, 1);
  const scale = (v: number) => (v / maxVal) * 100;

  const reducedWidth = scale(o - c);
  const profitableWidth = p > c ? scale(p - c) : 0;
  const lossWidth = p < c ? scale(c - p) : 0;

  return (
    <div className="space-y-2">
      <div className="relative h-6 w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
        <div className="absolute inset-y-0 left-0 bg-slate-400 dark:bg-slate-500" style={{ width: `${scale(c)}%` }} />
        {reducedWidth > 0 && (
          <div className="absolute inset-y-0 bg-blue-500 transition-all" style={{ left: `${scale(c)}%`, width: `${reducedWidth}%` }} />
        )}
        {profitableWidth > 0 && (
          <div className="absolute inset-y-0 bg-emerald-500 transition-all" style={{ left: `${scale(o)}%`, width: `${profitableWidth}%` }} />
        )}
        {lossWidth > 0 && (
          <div className="absolute inset-y-0 bg-rose-500 transition-all" style={{ left: `${scale(p)}%`, width: `${lossWidth}%` }} />
        )}
        <div className="absolute inset-y-0 w-0.5 bg-slate-800 dark:bg-white" style={{ left: `${scale(c)}%` }} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-slate-400 dark:bg-slate-500" />Vốn hiện tại</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-blue-500" />Đã hạ vốn</span>
        {profitableWidth > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-emerald-500" />Có lãi</span>}
        {lossWidth > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-rose-500" />Còn lỗ</span>}
      </div>
      {p >= c ? (
        <p className="text-sm font-medium text-emerald-500">✅ {p > c ? 'Đang có lãi' : 'Đã hòa vốn'}</p>
      ) : (
        <p className="text-sm font-medium text-rose-500">Còn lỗ: {Math.abs(analysis.remaining_unrealized_loss).toLocaleString('vi-VN')} ₫</p>
      )}
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-medium text-slate-700 dark:text-slate-200 ${className || ''}`}>{value}</p>
    </div>
  );
}

function CycleHistorySection({ cycles, formatMoney, decimals }: { cycles: TPlusCycle[]; formatMoney: (v: number, opts?: { decimals?: number }) => string; decimals: number }) {
  const completed = cycles.filter(c => c.status === 'COMPLETED').sort((a, b) => (b.sell_date || '').localeCompare(a.sell_date || ''));
  const open = cycles.filter(c => c.status === 'OPEN');

  const renderCycle = (c: TPlusCycle) => (
    <div key={c.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-600">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={c.status === 'COMPLETED' ? 'success' : 'warning'}>{c.status === 'COMPLETED' ? 'Hoàn tất' : 'Đang mở'}</Badge>
          <span className="text-xs text-slate-400">{c.buy_date}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Metric label="Ngày mua" value={c.buy_date} />
        <Metric label="Ngày bán" value={c.sell_date || '-'} />
        <Metric label="SL mua" value={c.buy_quantity.toLocaleString()} />
        <Metric label="SL bán" value={c.sell_quantity.toLocaleString()} />
        <Metric label="Giá mua" value={formatMoney(c.buy_price, { decimals })} />
        <Metric label="Giá bán" value={c.sell_price ? formatMoney(c.sell_price, { decimals }) : '-'} />
        <Metric label="Lợi gộp" value={c.gross_profit ? formatMoney(c.gross_profit) : '-'} className={c.gross_profit >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
        <Metric label="Lợi ròng" value={formatMoney(c.net_profit)} className={c.net_profit >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
        <Metric label="Phí" value={c.fee ? formatMoney(c.fee) : '-'} />
        <Metric label="Thuế" value={c.tax ? formatMoney(c.tax) : '-'} />
        <Metric label="Vốn trước" value={formatMoney(c.avg_cost_before, { decimals })} />
        <Metric label="Vốn sau" value={formatMoney(c.avg_cost_after, { decimals })} />
        <Metric label="Hạ vốn" value={formatMoney(c.cost_reduced, { decimals })} className="text-emerald-500" />
        <Metric label="SL còn lại" value={c.remaining_quantity.toLocaleString()} />
        <Metric label="P/L còn lại" value={formatMoney(c.remaining_unrealized_pnl)} className={c.remaining_unrealized_pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {completed.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Đã hoàn tất ({completed.length})</p>
          <div className="space-y-2">{completed.map(renderCycle)}</div>
        </div>
      )}
      {open.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Đang mở ({open.length})</p>
          <div className="space-y-2">{open.map(renderCycle)}</div>
        </div>
      )}
      {completed.length === 0 && open.length === 0 && (
        <p className="text-sm text-slate-400">Chưa có chu kỳ T+</p>
      )}
    </div>
  );
}

function AssetCard({
  analysis,
  formatMoney,
  onBuy,
  onSell,
}: {
  analysis: TPlusAssetAnalysis;
  formatMoney: (v: number, opts?: { decimals?: number; showSymbol?: boolean }) => string;
  onBuy: (a: TPlusAssetAnalysis) => void;
  onSell: (a: TPlusAssetAnalysis) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [showOpenBuys, setShowOpenBuys] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isCrypto = analysis.asset_type === 'CRYPTO';
  const decimals = isCrypto ? 2 : 0;

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2">
            <svg className={`h-4 w-4 text-slate-400 transition-transform ${collapsed ? 'rotate-0' : 'rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{analysis.symbol}</span>
          </button>
          <Badge>{analysis.broker}</Badge>
        </div>
        <StatusBadge status={analysis.visual_status} />
      </div>

      {!collapsed && (
        <>
          {/* Core metrics grid */}
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Metric label="Số lượng" value={analysis.remaining_quantity.toLocaleString()} />
            <Metric label="Giá vốn gốc" value={formatMoney(analysis.original_avg_cost, { decimals })} />
            <Metric label="Giá vốn hiện tại" value={formatMoney(analysis.current_avg_cost, { decimals })} />
            <Metric label="Giá thị trường" value={formatMoney(analysis.current_price, { decimals })} />
            <Metric label="Giá hòa vốn" value={formatMoney(analysis.break_even_price, { decimals })} />
            <Metric label="P/L chưa thực hiện" value={formatMoney(analysis.remaining_unrealized_loss)} className={analysis.remaining_unrealized_loss >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
            <Metric label="Còn lỗ" value={formatMoney(analysis.remaining_unrealized_loss < 0 ? Math.abs(analysis.remaining_unrealized_loss) : 0)} className={analysis.remaining_unrealized_loss < 0 ? 'text-rose-500' : ''} />
            <Metric label="Tổng hạ vốn" value={`${formatMoney(analysis.total_cost_reduction, { decimals })} (${analysis.total_cost_reduction_pct.toFixed(2)}%)`} className="text-emerald-500" />
            <Metric label="Lợi nhuận T+" value={formatMoney(analysis.total_tplus_profit)} className={analysis.total_tplus_profit >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
            <Metric label="Bán hết hôm nay" value={formatMoney(analysis.profit_if_selling_today)} className={analysis.profit_if_selling_today >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
            <Metric label="Giá bán gợi ý" value={formatMoney(analysis.suggested_sell_price, { decimals })} className="text-blue-500" />
          </div>

          {/* Break-even progress bar */}
          <div className="mt-4">
            <BreakEvenBar analysis={analysis} />
          </div>

          {/* Open T+ Buys */}
          {analysis.open_buys.length > 0 && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <button
                onClick={() => setShowOpenBuys(!showOpenBuys)}
                className="flex w-full items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                <span>Lệnh mua T+ đang mở ({analysis.open_buys.length})</span>
                <svg className={`h-4 w-4 transition-transform ${showOpenBuys ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showOpenBuys && (
                <div className="mt-3 space-y-3">
                  {analysis.open_buys.map(ob => (
                    <div key={ob.tx_id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-600">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge variant="info">{ob.t_status}</Badge>
                        <span className="text-xs text-slate-400">{ob.buy_date}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                        <Metric label="Giá mua" value={formatMoney(ob.buy_price, { decimals })} />
                        <Metric label="SL mua" value={ob.buy_quantity.toLocaleString()} />
                        <Metric label="Giá hiện tại" value={formatMoney(ob.current_price, { decimals })} />
                        <Metric label="Giá bán gợi ý" value={formatMoney(ob.suggested_sell_price, { decimals })} className="text-blue-500" />
                        <Metric label="LN kỳ vọng" value={formatMoney(ob.expected_profit)} className="text-emerald-500" />
                        <Metric label="KLV (%)" value={`${ob.expected_return_pct.toFixed(1)}%`} className="text-emerald-500" />
                        <Metric label="Vốn sử dụng" value={formatMoney(ob.capital_used)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* T+ History */}
          <div className="mt-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex w-full items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              <span>T+ History ({analysis.cycles.length})</span>
              <svg className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showHistory && (
              <div className="mt-3">
                <CycleHistorySection cycles={analysis.cycles} formatMoney={formatMoney} decimals={decimals} />
              </div>
            )}
          </div>

          {/* Quick Trade Actions */}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onBuy(analysis)} className="flex-1">
              <span className="flex items-center justify-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Mua
              </span>
            </Button>
            <Button variant="danger" size="sm" onClick={() => onSell(analysis)} className="flex-1">
              <span className="flex items-center justify-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m0 0l6 6m-6-6l6-6" /></svg>
                Bán
              </span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <span className="flex items-center justify-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                T+ History
              </span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function TradeTPlusPage({ data }: { data: PortfolioData }) {
  const { formatMoney, moneyPlaceholder } = useSettings();
  const { tplusSummary } = data;
  const [sortKey, setSortKey] = useState<SortKey>('remaining_loss');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');

  // Quick trade modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeAsset, setTradeAsset] = useState<TPlusAssetAnalysis | null>(null);
  const [tradeQty, setTradeQty] = useState('');
  const [tradePrice, setTradePrice] = useState('');

  const allAnalyses = tplusSummary.analyses;
  const filteredAnalyses = applyQuickFilter(allAnalyses, quickFilter);
  const sortedAnalyses = sortAnalyses(filteredAnalyses, sortKey);

  // Group by broker for display
  const groups: { label: string; items: TPlusAssetAnalysis[] }[] = [];
  const vpsItems = sortedAnalyses.filter(a => a.broker === 'VPS');
  const ssiItems = sortedAnalyses.filter(a => a.broker === 'SSI');
  const cryptoItems = sortedAnalyses.filter(a => a.asset_type === 'CRYPTO');
  if (vpsItems.length > 0) groups.push({ label: 'VPS', items: vpsItems });
  if (ssiItems.length > 0) groups.push({ label: 'SSI', items: ssiItems });
  if (cryptoItems.length > 0) groups.push({ label: 'Crypto', items: cryptoItems });

  const openBuy = (a: TPlusAssetAnalysis) => {
    setTradeType('BUY');
    setTradeAsset(a);
    setTradeQty('');
    setTradePrice('');
    setShowTradeModal(true);
  };

  const openSell = (a: TPlusAssetAnalysis) => {
    setTradeType('SELL');
    setTradeAsset(a);
    setTradeQty('');
    setTradePrice(String(a.suggested_sell_price.toFixed(2)));
    setShowTradeModal(true);
  };

  const handleSaveTrade = () => {
    setShowTradeModal(false);
    showToast(`${tradeType === 'BUY' ? 'Mua' : 'Bán'} ${tradeAsset?.symbol} (bản thử nghiệm)`, 'success');
    setTradeAsset(null);
    setTradeQty('');
    setTradePrice('');
  };

  const isCryptoTrade = tradeAsset?.asset_type === 'CRYPTO';
  const tradeDecimals = isCryptoTrade ? 2 : 0;
  const tradeAmount = (parseFloat(tradeQty) || 0) * (parseFloat(tradePrice) || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Trade T+</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý phục hồi hòa vốn & luân chuyển vốn T+</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="Tổng lợi nhuận T+"
          value={formatMoney(tplusSummary.total_tplus_profit)}
          trend={tplusSummary.total_tplus_profit >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Tổng hạ giá vốn"
          value={`${tplusSummary.total_cost_reduction.toFixed(0)} ₫/cp`}
          subtitle={`${tplusSummary.completed_cycles} chu kỳ hoàn tất`}
        />
        <StatCard
          title="Chu kỳ đang mở"
          value={String(tplusSummary.open_cycles)}
          subtitle={`${tplusSummary.completed_cycles} đã hoàn tất`}
        />
        <StatCard
          title="Tỷ lệ thắng"
          value={`${tplusSummary.win_rate.toFixed(1)}%`}
          trend={tplusSummary.win_rate >= 50 ? 'up' : 'down'}
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setQuickFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              quickFilter === f.value
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3">
        <div className="w-56">
          <Select label="" value={sortKey} onChange={(v) => setSortKey(v as SortKey)} options={SORT_OPTIONS} />
        </div>
      </div>

      {/* Asset Cards by Group */}
      {groups.map(group => (
        <div key={group.label}>
          <h2 className="mb-3 text-lg font-semibold text-slate-700 dark:text-slate-300">{group.label}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map(a => (
              <AssetCard key={a.asset_id} analysis={a} formatMoney={formatMoney} onBuy={openBuy} onSell={openSell} />
            ))}
          </div>
        </div>
      ))}

      {sortedAnalyses.length === 0 && (
        <Card><EmptyState message="Chưa có dữ liệu T+" /></Card>
      )}

      {/* T+ Performance Stats */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Hiệu suất T+</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Tổng chu kỳ hoàn tất</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{tplusSummary.completed_cycles}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Lợi nhuận trung bình</p>
            <p className={`text-lg font-bold ${tplusSummary.avg_profit_per_cycle >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatMoney(tplusSummary.avg_profit_per_cycle)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Lợi nhuận lớn nhất</p>
            <p className="text-lg font-bold text-emerald-500">{formatMoney(tplusSummary.largest_profit)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-xs text-slate-400">Lỗ lớn nhất</p>
            <p className="text-lg font-bold text-rose-500">{formatMoney(tplusSummary.largest_loss)}</p>
          </div>
        </div>
      </Card>

      {/* Quick Trade Modal */}
      <Modal
        open={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        title={`${tradeType === 'BUY' ? 'Mua' : 'Bán'} ${tradeAsset?.symbol || ''}`}
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Tài sản</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{tradeAsset?.symbol}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-slate-500">Broker</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{tradeAsset?.broker}</span>
            </div>
            {tradeType === 'SELL' && (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-slate-500">Giá bán gợi ý</span>
                <span className="font-medium text-blue-500">{formatMoney(tradeAsset?.suggested_sell_price || 0, { decimals: tradeDecimals })}</span>
              </div>
            )}
          </div>

          <Input
            label={isCryptoTrade ? 'Số lượng coin' : 'Số lượng'}
            type="number"
            value={tradeQty}
            onChange={setTradeQty}
            step={isCryptoTrade ? '0.0001' : '1'}
            placeholder={isCryptoTrade ? '0.00' : '0'}
          />

          <Input
            label="Giá"
            type="number"
            value={tradePrice}
            onChange={setTradePrice}
            step={isCryptoTrade ? '0.01' : '100'}
            placeholder={moneyPlaceholder}
          />

          {tradeQty && tradePrice && (
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tổng giá trị</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{formatMoney(tradeAmount)}</span>
              </div>
              {tradeType === 'SELL' && tradeAsset && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-slate-500">Lợi nhuận ước tính</span>
                  <span className={`font-medium ${(parseFloat(tradePrice) - tradeAsset.current_avg_cost) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatMoney((parseFloat(tradePrice) - tradeAsset.current_avg_cost) * (parseFloat(tradeQty) || 0))}
                  </span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400">
            {tradeType === 'SELL'
              ? 'Giá bán gợi ý đã điền sẵn. Bạn có thể chỉnh sửa trước khi tạo lệnh bán.'
              : 'Giá vốn danh mục chỉ cập nhật sau khi giao dịch thực tế hoàn tất.'}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowTradeModal(false)}>Hủy</Button>
            <Button onClick={handleSaveTrade}>{tradeType === 'BUY' ? 'Mua' : 'Bán'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
