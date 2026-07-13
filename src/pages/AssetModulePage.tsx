import { useState, useEffect, useCallback } from 'react';
import { Card, StatCard, Table, Badge, Button, Modal, Input, Select, EmptyState } from '../components/ui';
import { showToast } from '../components/Toast';
import { formatNumber } from '../lib/dataStore';
import { useSettings } from '../lib/settings';
import { loadMasterData, masterDataApi, type MasterData } from '../lib/masterData';
import type { PortfolioData } from '../lib/dataStore';
import type { AssetType, TransactionType, Transaction } from '../engine/types';
import { USD_TO_VND } from '../engine/mockData';

const QTY_PLACEHOLDERS: Record<AssetType, string> = {
  STOCK: '0 cp',
  ETF: '0 CCQ',
  FUND: '0 CCQ',
  CRYPTO: '0 coin',
  BANK_DEPOSIT: '',
};

export function AssetModulePage({
  data,
  assetType,
  title,
  subtitle,
}: {
  data: PortfolioData;
  assetType: AssetType;
  title: string;
  subtitle: string;
  currencyLabel?: string;
}) {
  const { formatMoney, moneyPlaceholder } = useSettings();
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txType, setTxType] = useState<TransactionType>('BUY');
  const [txAsset, setTxAsset] = useState('');
  const [txAccount, setTxAccount] = useState('');
  const [txQty, setTxQty] = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDepositAmount, setTxDepositAmount] = useState('');
  const [txFeeRate, setTxFeeRate] = useState('');
  const [txDepositTerm, setTxDepositTerm] = useState('');
  const [showAddStock, setShowAddStock] = useState(false);
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockName, setNewStockName] = useState('');
  const [showAddCoin, setShowAddCoin] = useState(false);
  const [newCoinSymbol, setNewCoinSymbol] = useState('');
  const [newCoinName, setNewCoinName] = useState('');
  const [showAddTerm, setShowAddTerm] = useState(false);
  const [newTermLabel, setNewTermLabel] = useState('');
  const [newTermMonths, setNewTermMonths] = useState('');
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [stockAccountFilter, setStockAccountFilter] = useState('ALL');

  const isCrypto = assetType === 'CRYPTO';
  const isBank = assetType === 'BANK_DEPOSIT';
  const isStock = assetType === 'STOCK';
  const isETF = assetType === 'ETF';
  const isDCDS = assetType === 'FUND';

  const refreshMasterData = useCallback(async () => {
    try {
      const md = await loadMasterData();
      setMasterData(md);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refreshMasterData();
  }, [refreshMasterData]);

  const categoryAccounts = data.accounts.filter(a => {
    if (assetType === 'STOCK') return a.account_type === 'STOCK';
    if (assetType === 'CRYPTO') return a.account_type === 'CRYPTO';
    if (assetType === 'ETF') return a.account_type === 'ETF';
    if (assetType === 'FUND') return a.account_type === 'DCDS';
    if (assetType === 'BANK_DEPOSIT') return a.account_type === 'BANK';
    return false;
  });

  // Stock account filter
  const filteredAccounts = isStock && stockAccountFilter !== 'ALL'
    ? categoryAccounts.filter(a => a.id === stockAccountFilter)
    : categoryAccounts;

  const categoryHoldings = data.holdings.filter(h => {
    if (h.asset_type !== assetType) return false;
    if (isStock && stockAccountFilter !== 'ALL') {
      return h.account_id === stockAccountFilter;
    }
    return true;
  });

  const categoryCash = filteredAccounts.reduce((sum, acc) => {
    const cash = data.cashBalances.find(c => c.account_id === acc.id);
    if (!cash) return sum;
    if (cash.currency === 'USDT') return sum + cash.available_cash * USD_TO_VND;
    return sum + cash.available_cash;
  }, 0);

  const categoryMarketValue = categoryHoldings.reduce((s, h) => s + h.market_value, 0);
  const categoryTotalAsset = categoryCash + categoryMarketValue;
  const categoryUnrealized = categoryHoldings.reduce((s, h) => s + h.unrealized_pnl, 0);
  const categoryRealized = categoryHoldings.reduce((s, h) => s + h.realized_pnl, 0);

  const categoryTxs = data.transactions.filter(tx =>
    filteredAccounts.some(a => a.id === tx.account_id),
  );

  // Transaction type options — remove DIVIDEND for Crypto and Bank
  const txTypeOptions = [
    { value: 'BUY', label: 'Mua (BUY)' },
    { value: 'SELL', label: 'Bán (SELL)' },
    { value: 'DEPOSIT', label: 'Nạp tiền (DEPOSIT)' },
    { value: 'WITHDRAW', label: 'Rút tiền (WITHDRAW)' },
    ...((isCrypto || isBank) ? [] : [{ value: 'DIVIDEND', label: 'Cổ tức (DIVIDEND)' }]),
  ];

  // Auto-calculate crypto quantity
  const cryptoAmount = parseFloat(txAmount) || 0;
  const cryptoPrice = parseFloat(txPrice) || 0;
  const cryptoQuantity = cryptoPrice > 0 ? cryptoAmount / cryptoPrice : 0;

  // Auto-calculate DCDS quantity
  const dcdsPurchaseAmount = parseFloat(txAmount) || 0;
  const dcdsNavPrice = parseFloat(txPrice) || 0;
  const dcdsQuantity = dcdsNavPrice > 0 ? dcdsPurchaseAmount / dcdsNavPrice : 0;

  // Stock account options
  const stockAccountOptions = categoryAccounts.map(a => ({ value: a.id, label: a.account_name }));

  // Stock symbol options from master data + holdings
  const stockOptions = masterData
    ? masterData.stocks.map(s => ({ value: s.symbol, label: s.symbol }))
    : categoryHoldings.map(h => ({ value: h.symbol, label: h.symbol }));

  // Crypto coin options from master data
  const cryptoOptions = masterData
    ? masterData.cryptos.map(c => ({ value: c.symbol, label: c.symbol }))
    : categoryHoldings.map(h => ({ value: h.symbol, label: h.symbol }));

  // Bank options
  const bankOptions = masterData
    ? masterData.banks.map(b => ({ value: b.bank_code, label: b.bank_code }))
    : [];

  // Deposit term options
  const depositTermOptions = masterData
    ? [
        ...masterData.depositTerms.map(t => ({ value: t.label, label: t.label })),
        { value: '__add_new__', label: '+ Thêm kỳ hạn...' },
      ]
    : [];

  // Trading fee options
  const tradingFeeOptions = masterData
    ? masterData.tradingFees.map(f => ({ value: String(f.rate_pct), label: f.label }))
    : [
        { value: '0', label: '0%' },
        { value: '0.10', label: '0.10%' },
        { value: '0.25', label: '0.25%' },
      ];

  const openCreateModal = () => {
    setEditingTx(null);
    setTxType('BUY');
    setTxAsset(''); setTxAccount(''); setTxQty(''); setTxPrice('');
    setTxAmount(''); setTxDepositAmount(''); setTxFeeRate(''); setTxDepositTerm('');
    setShowTxModal(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.transaction_type);
    const asset = data.assets.find(a => a.id === tx.asset_id);
    setTxAsset(asset?.symbol || '');
    setTxAccount(tx.account_id);
    setTxQty(tx.quantity ? String(tx.quantity) : '');
    setTxPrice(tx.price ? String(tx.price) : '');
    setTxAmount(String(tx.amount));
    setTxDepositAmount(String(tx.amount));
    setTxFeeRate('');
    setTxDepositTerm('');
    setShowTxModal(true);
  };

  const handleSaveTx = () => {
    setShowTxModal(false);
    showToast(editingTx ? 'Giao dịch đã cập nhật (bản thử nghiệm)' : 'Giao dịch đã tạo (bản thử nghiệm)', 'success');
    setEditingTx(null);
    setTxQty(''); setTxPrice(''); setTxAmount(''); setTxDepositAmount(''); setTxFeeRate(''); setTxDepositTerm('');
  };

  const handleAddStock = async () => {
    if (!newStockSymbol.trim()) return;
    try {
      await masterDataApi.addStock(newStockSymbol.trim(), newStockName.trim() || undefined);
      showToast('Đã thêm mã Stock', 'success');
      setNewStockSymbol(''); setNewStockName('');
      setShowAddStock(false);
      refreshMasterData();
    } catch {
      showToast('Lỗi khi thêm mã', 'error');
    }
  };

  const handleAddCoin = async () => {
    if (!newCoinSymbol.trim()) return;
    try {
      await masterDataApi.addCrypto(newCoinSymbol.trim(), newCoinName.trim() || undefined);
      showToast('Đã thêm coin', 'success');
      setNewCoinSymbol(''); setNewCoinName('');
      setShowAddCoin(false);
      refreshMasterData();
    } catch {
      showToast('Lỗi khi thêm coin', 'error');
    }
  };

  const handleAddTerm = async () => {
    const months = parseInt(newTermMonths);
    if (!newTermLabel.trim() || !months) return;
    try {
      await masterDataApi.addDepositTerm(newTermLabel.trim(), months);
      showToast('Đã thêm kỳ hạn', 'success');
      setNewTermLabel(''); setNewTermMonths('');
      setShowAddTerm(false);
      refreshMasterData();
    } catch {
      showToast('Lỗi khi thêm kỳ hạn', 'error');
    }
  };

  const handleDepositTermChange = (v: string) => {
    if (v === '__add_new__') {
      setShowAddTerm(true);
    } else {
      setTxDepositTerm(v);
    }
  };

  const handleStockAssetChange = (v: string) => {
    if (v === '__add_new_stock__') {
      setShowAddStock(true);
    } else {
      setTxAsset(v);
    }
  };

  const showAssetField = txType !== 'DEPOSIT' && txType !== 'WITHDRAW';
  const showAccountSelector = isStock && showAssetField;
  const showQtyField = showAssetField && !isBank && !isCrypto && !isDCDS;
  const showPriceField = showAssetField && txType !== 'DIVIDEND' && !isBank;
  const showAmountField = txType === 'DEPOSIT' || txType === 'WITHDRAW' || txType === 'DIVIDEND' || isCrypto;
  const showFeeField = txType !== 'DEPOSIT' && txType !== 'WITHDRAW';
  const showDepositTermField = isBank && showAssetField;
  const showDepositAmountField = isBank && (txType === 'DEPOSIT' || txType === 'BUY');

  // Bank holdings: sort by remaining days ascending (nearest maturity first)
  const sortedHoldings = isBank
    ? [...categoryHoldings].sort((a, b) => {
        const aDays = a.remaining_days ?? 999999;
        const bDays = b.remaining_days ?? 999999;
        return aDays - bDays;
      })
    : categoryHoldings;

  // Holdings columns depend on asset type
  const holdingsColumns = isCrypto
    ? [
        { key: 'symbol', label: 'Mã' },
        { key: 'qty', label: 'Số lượng', align: 'right' as const },
        { key: 'avgCost', label: 'Giá vốn', align: 'right' as const },
        { key: 'price', label: 'Giá hiện tại', align: 'right' as const },
        { key: 'value', label: 'Giá trị', align: 'right' as const },
        { key: 'pnl', label: 'Lãi/Lỗ', align: 'right' as const },
        { key: 'weight', label: 'Tỷ trọng', align: 'right' as const },
      ]
    : isBank
    ? [
        { key: 'symbol', label: 'Nơi gửi' },
        { key: 'qty', label: 'Số tiền gửi', align: 'right' as const },
        { key: 'value', label: 'Giá trị', align: 'right' as const },
        { key: 'remaining', label: 'Còn lại', align: 'right' as const },
        { key: 'pnl', label: 'Lãi/Lỗ', align: 'right' as const },
      ]
    : [
        { key: 'symbol', label: 'Mã' },
        ...(isStock ? [{ key: 'account', label: 'Tài khoản' }] : []),
        { key: 'qty', label: 'Số lượng', align: 'right' as const },
        { key: 'avgCost', label: 'Giá vốn', align: 'right' as const },
        { key: 'price', label: 'Giá hiện tại', align: 'right' as const },
        { key: 'value', label: 'Giá trị', align: 'right' as const },
        { key: 'pnl', label: 'Lãi/Lỗ', align: 'right' as const },
        { key: 'weight', label: 'Tỷ trọng', align: 'right' as const },
      ];

  // Transaction columns with edit button
  const txColumns = [
    { key: 'date', label: 'Ngày' },
    { key: 'type', label: 'Loại' },
    { key: 'asset', label: 'Tài sản' },
    { key: 'qty', label: 'SL', align: 'right' as const },
    { key: 'amount', label: 'Giá trị', align: 'right' as const },
    { key: 'status', label: 'Trạng thái', align: 'center' as const },
    { key: 'actions', label: '', align: 'right' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <Button onClick={openCreateModal}>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Giao dịch
          </span>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng tài sản" value={formatMoney(categoryTotalAsset)} />
        <StatCard title="Cash" value={formatMoney(categoryCash)} />
        <StatCard title="Giá trị thị trường" value={formatMoney(categoryMarketValue)} />
        <StatCard title="Lãi/Lỗ" value={formatMoney(categoryUnrealized + categoryRealized)} trend={(categoryUnrealized + categoryRealized) >= 0 ? 'up' : 'down'} />
      </div>

      {/* Accounts */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Tài khoản</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryAccounts.map(acc => {
            const cash = data.cashBalances.find(c => c.account_id === acc.id);
            const accHoldings = data.holdings.filter(h => {
              const asset = data.assets.find(a => a.id === h.asset_id);
              return asset?.account_id === acc.id && h.asset_type === assetType;
            });
            const accValue = accHoldings.reduce((s, h) => s + h.market_value, 0);
            return (
              <div key={acc.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{acc.account_name}</span>
                  <Badge>{acc.broker}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">Cash: <span className="whitespace-nowrap">{formatMoney(cash ? (cash.currency === 'USDT' ? cash.available_cash * USD_TO_VND : cash.available_cash) : 0)}</span></p>
                <p className="text-sm text-slate-500">Giá trị: <span className="whitespace-nowrap">{formatMoney(accValue)}</span></p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Holdings */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Danh mục sở hữu</h3>
          {isStock && (
            <div className="w-40">
              <Select
                label=""
                value={stockAccountFilter}
                onChange={setStockAccountFilter}
                options={[
                  { value: 'ALL', label: 'Tất cả' },
                  ...stockAccountOptions,
                ]}
              />
            </div>
          )}
        </div>
        {sortedHoldings.length === 0 ? (
          <EmptyState message="Chưa có tài sản nào" />
        ) : (
          <Table
            columns={holdingsColumns}
            rows={sortedHoldings}
            renderRow={(h) => {
              const base: Record<string, React.ReactNode> = {
                symbol: (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{h.symbol}</span>
                    {h.name && <p className="text-xs text-slate-400">{h.name}</p>}
                  </div>
                ),
                qty: isBank
                  ? <span className="whitespace-nowrap">{formatMoney(h.average_cost * h.quantity)}</span>
                  : formatNumber(h.quantity, isCrypto ? 4 : 0),
                avgCost: <span className="whitespace-nowrap">{formatMoney(h.average_cost, { decimals: isCrypto ? 2 : 0 })}</span>,
                price: <span className="whitespace-nowrap">{formatMoney(h.current_price, { decimals: isCrypto ? 2 : 0 })}</span>,
                value: <span className="whitespace-nowrap">{formatMoney(h.market_value)}</span>,
                pnl: <span className={`whitespace-nowrap ${h.unrealized_pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatMoney(h.unrealized_pnl)}</span>,
                weight: `${h.weight.toFixed(1)}%`,
              };
              if (isStock) {
                base.account = h.account_name;
              }
              if (isBank) {
                base.remaining = h.remaining_days !== null
                  ? <span className={h.remaining_days === 0 ? 'text-rose-500 font-medium' : 'text-slate-600 dark:text-slate-300'}>{h.remaining_days} ngày</span>
                  : '-';
              }
              return base;
            }}
          />
        )}
      </Card>

      {/* T+ Manager for stocks */}
      {assetType === 'STOCK' && (
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">T+ Manager</h3>
          {(() => {
            const pendingTxs = categoryTxs.filter(t => t.status === 'PENDING' && t.settlement_date);
            if (pendingTxs.length === 0) return <EmptyState message="Không có giao dịch chờ thanh toán" />;
            return (
              <Table
                columns={[
                  { key: 'asset', label: 'Tài sản' },
                  { key: 'amount', label: 'Giá trị', align: 'right' },
                  { key: 'settlement', label: 'Ngày thanh toán' },
                  { key: 'status', label: 'Trạng thái', align: 'center' },
                ]}
                rows={pendingTxs}
                renderRow={(tx) => {
                  const asset = data.assets.find(a => a.id === tx.asset_id);
                  return {
                    asset: asset?.symbol || 'N/A',
                    amount: <span className="whitespace-nowrap">{formatMoney(tx.amount)}</span>,
                    settlement: tx.settlement_date || '',
                    status: <Badge variant="warning">Chờ thanh toán</Badge>,
                  };
                }}
              />
            );
          })()}
        </Card>
      )}

      {/* Transaction History with Edit */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Lịch sử giao dịch</h3>
        {categoryTxs.length === 0 ? (
          <EmptyState message="Chưa có giao dịch nào" />
        ) : (
          <Table
            columns={txColumns}
            rows={[...categoryTxs].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))}
            renderRow={(tx) => {
              const asset = data.assets.find(a => a.id === tx.asset_id);
              return {
                date: tx.transaction_date,
                type: <Badge variant={tx.transaction_type === 'BUY' ? 'info' : tx.transaction_type === 'SELL' ? 'warning' : tx.transaction_type === 'DEPOSIT' ? 'success' : 'default'}>{tx.transaction_type}</Badge>,
                asset: asset?.symbol || 'Cash',
                qty: tx.quantity ? tx.quantity.toLocaleString() : '-',
                amount: <span className="whitespace-nowrap">{formatMoney(tx.amount)}</span>,
                status: <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'}>{tx.status === 'COMPLETED' ? 'Hoàn tất' : 'Chờ'}</Badge>,
                actions: (
                  <button onClick={() => openEditModal(tx)} className="text-xs text-blue-500 hover:underline">
                    Sửa
                  </button>
                ),
              };
            }}
          />
        )}
      </Card>

      {/* Transaction Modal */}
      <Modal open={showTxModal} onClose={() => setShowTxModal(false)} title={editingTx ? 'Sửa giao dịch' : 'Tạo giao dịch'}>
        <div className="space-y-4">
          <Select
            label="Loại giao dịch"
            value={txType}
            onChange={(v) => setTxType(v as TransactionType)}
            options={txTypeOptions}
          />

          {/* Stock Account selector */}
          {showAccountSelector && (
            <Select
              label="Tài khoản"
              value={txAccount}
              onChange={setTxAccount}
              options={stockAccountOptions}
            />
          )}

          {/* Asset field — module-specific */}
          {showAssetField && isDCDS && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Tài sản</label>
              <div className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                DCDS-GF
              </div>
            </div>
          )}
          {showAssetField && isETF && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Tài sản</label>
              <div className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                E1VFVN30
              </div>
            </div>
          )}
          {showAssetField && isStock && (
            <Select
              label="Tài sản"
              value={txAsset}
              onChange={handleStockAssetChange}
              options={[
                ...stockOptions,
                { value: '__add_new_stock__', label: '+ Thêm mã Stock...' },
              ]}
            />
          )}
          {showAssetField && isCrypto && (
            <Select
              label="Tài sản"
              value={txAsset}
              onChange={(v) => v === '__add_new_coin__' ? setShowAddCoin(true) : setTxAsset(v)}
              options={[
                ...cryptoOptions,
                { value: '__add_new_coin__', label: '+ Thêm coin...' },
              ]}
            />
          )}
          {showAssetField && isBank && (
            <Select
              label="Bank"
              value={txAsset}
              onChange={setTxAsset}
              options={bankOptions}
            />
          )}

          {/* Deposit Term — Bank only */}
          {showDepositTermField && (
            <Select
              label="Kỳ hạn gửi"
              value={txDepositTerm}
              onChange={handleDepositTermChange}
              options={depositTermOptions}
            />
          )}

          {/* Deposit Amount — Bank only */}
          {showDepositAmountField && (
            <Input
              label="Số tiền gửi"
              type="number"
              value={txDepositAmount}
              onChange={setTxDepositAmount}
              placeholder={moneyPlaceholder}
            />
          )}

          {/* Quantity — Stock/ETF only (not DCDS, not crypto, not bank) */}
          {showQtyField && (
            <Input
              label="Số lượng"
              type="number"
              value={txQty}
              onChange={setTxQty}
              step="1"
              placeholder={QTY_PLACEHOLDERS[assetType]}
            />
          )}

          {/* DCDS layout: Purchase Amount + NAV Price → auto-calc CCQ Quantity (read-only) */}
          {isDCDS && showAssetField && txType === 'BUY' && (
            <>
              <Input
                label="Số tiền mua"
                type="number"
                value={txAmount}
                onChange={setTxAmount}
                placeholder={moneyPlaceholder}
              />
              <Input
                label="Giá hiện tại của CCQ"
                type="number"
                value={txPrice}
                onChange={setTxPrice}
                step="100"
                placeholder={moneyPlaceholder}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Số lượng CCQ mua được</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                    {dcdsQuantity > 0 ? formatNumber(dcdsQuantity, 2) : '0'}
                  </div>
                  <span className="text-sm text-slate-400">CCQ</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">= Số tiền mua / Giá hiện tại của CCQ</p>
              </div>
            </>
          )}

          {/* DCDS SELL: user enters quantity + price */}
          {isDCDS && showAssetField && txType === 'SELL' && (
            <>
              <Input
                label="Số lượng CCQ"
                type="number"
                value={txQty}
                onChange={setTxQty}
                step="1"
                placeholder="0 CCQ"
              />
              <Input
                label="Giá bán"
                type="number"
                value={txPrice}
                onChange={setTxPrice}
                step="100"
                placeholder={moneyPlaceholder}
              />
            </>
          )}

          {/* Crypto layout: Amount + Price → auto-calc Quantity (read-only) */}
          {isCrypto && showAssetField && (
            <>
              <Input
                label="Transaction Amount"
                type="number"
                value={txAmount}
                onChange={setTxAmount}
                placeholder={moneyPlaceholder}
              />
              <Input
                label="Coin Price"
                type="number"
                value={txPrice}
                onChange={setTxPrice}
                step="0.01"
                placeholder={moneyPlaceholder}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Coin Quantity</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200">
                    {cryptoQuantity > 0 ? cryptoQuantity.toFixed(6) : '0'}
                  </div>
                  <span className="text-sm text-slate-400">coin</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">= Transaction Amount / Coin Price</p>
              </div>
            </>
          )}

          {/* Price — Stock/ETF only (not crypto, not bank, not DCDS) */}
          {showPriceField && !isCrypto && !isDCDS && (
            <Input
              label="Giá"
              type="number"
              value={txPrice}
              onChange={setTxPrice}
              step="100"
              placeholder={moneyPlaceholder}
            />
          )}

          {/* Amount — Deposit/Withdraw/Dividend (non-crypto) */}
          {showAmountField && !isCrypto && !isDCDS && (
            <Input
              label="Số tiền"
              type="number"
              value={txAmount}
              onChange={setTxAmount}
              placeholder={moneyPlaceholder}
            />
          )}

          {/* Trading Fee — dropdown only, calculation hidden */}
          {showFeeField && (
            <Select
              label="Phí giao dịch"
              value={txFeeRate}
              onChange={setTxFeeRate}
              options={tradingFeeOptions}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowTxModal(false)}>Hủy</Button>
            <Button onClick={handleSaveTx}>{editingTx ? 'Cập nhật' : 'Lưu'}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Stock Dialog */}
      <Modal open={showAddStock} onClose={() => setShowAddStock(false)} title="Thêm mã Stock">
        <div className="space-y-4">
          <Input label="Mã" type="text" value={newStockSymbol} onChange={setNewStockSymbol} placeholder="vd: FPT" />
          <Input label="Tên công ty" type="text" value={newStockName} onChange={setNewStockName} placeholder="vd: FPT Corporation" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddStock(false)}>Hủy</Button>
            <Button onClick={handleAddStock}>Lưu</Button>
          </div>
        </div>
      </Modal>

      {/* Add Coin Dialog */}
      <Modal open={showAddCoin} onClose={() => setShowAddCoin(false)} title="Thêm coin">
        <div className="space-y-4">
          <Input label="Mã" type="text" value={newCoinSymbol} onChange={setNewCoinSymbol} placeholder="vd: BTC" />
          <Input label="Tên coin" type="text" value={newCoinName} onChange={setNewCoinName} placeholder="vd: Bitcoin" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddCoin(false)}>Hủy</Button>
            <Button onClick={handleAddCoin}>Lưu</Button>
          </div>
        </div>
      </Modal>

      {/* Add Deposit Term Dialog */}
      <Modal open={showAddTerm} onClose={() => setShowAddTerm(false)} title="Thêm kỳ hạn gửi">
        <div className="space-y-4">
          <Input label="Nhãn" type="text" value={newTermLabel} onChange={setNewTermLabel} placeholder="vd: 9 Months" />
          <Input label="Số tháng" type="number" value={newTermMonths} onChange={setNewTermMonths} placeholder="vd: 9" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddTerm(false)}>Hủy</Button>
            <Button onClick={handleAddTerm}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
