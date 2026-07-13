import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Table } from '../components/ui';
import { showToast } from '../components/Toast';
import {
  loadMasterData, masterDataApi,
  type MasterData, type StockSymbol, type CryptoCoin, type BankEntry, type DepositTerm, type TradingFee,
} from '../lib/masterData';

export function MasterDataSection() {
  const [data, setData] = useState<MasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stocks' | 'cryptos' | 'banks' | 'terms' | 'fees'>('stocks');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const md = await loadMasterData();
      setData(md);
    } catch {
      showToast('Không tải được master data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const tabs = [
    { key: 'stocks' as const, label: 'Mã Stock' },
    { key: 'cryptos' as const, label: 'Mã Crypto' },
    { key: 'banks' as const, label: 'Bank' },
    { key: 'terms' as const, label: 'Kỳ hạn Deposit' },
    { key: 'fees' as const, label: 'Phí giao dịch' },
  ];

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Quản lý tài sản</h3>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">Đang tải...</p>
      ) : !data ? (
        <p className="py-4 text-center text-sm text-slate-400">Không có dữ liệu</p>
      ) : (
        <>
          {activeTab === 'stocks' && <StockManager stocks={data.stocks} onChange={refresh} />}
          {activeTab === 'cryptos' && <CryptoManager cryptos={data.cryptos} onChange={refresh} />}
          {activeTab === 'banks' && <BankManager banks={data.banks} onChange={refresh} />}
          {activeTab === 'terms' && <DepositTermManager terms={data.depositTerms} onChange={refresh} />}
          {activeTab === 'fees' && <TradingFeeManager fees={data.tradingFees} onChange={refresh} />}
        </>
      )}
    </Card>
  );
}

function StockManager({ stocks, onChange }: { stocks: StockSymbol[]; onChange: () => void }) {
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSymbol, setEditSymbol] = useState('');
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newSymbol.trim()) return;
    try {
      await masterDataApi.addStock(newSymbol.trim(), newName.trim() || undefined);
      setNewSymbol(''); setNewName('');
      showToast('Đã thêm mã cổ phiếu', 'success');
      onChange();
    } catch {
      showToast('Lỗi khi thêm', 'error');
    }
  };

  const handleRename = async (id: string) => {
    if (!editSymbol.trim()) return;
    try {
      await masterDataApi.renameStock(id, editSymbol.trim(), editName.trim() || undefined);
      setEditingId(null);
      showToast('Đã cập nhật', 'success');
      onChange();
    } catch {
      showToast('Lỗi khi cập nhật', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await masterDataApi.deleteStock(id);
      showToast('Đã xóa', 'success');
      onChange();
    } catch {
      showToast('Lỗi khi xóa', 'error');
    }
  };

  const handleReset = async () => {
    try {
      await masterDataApi.resetStocks();
      showToast('Đã đặt lại danh sách mặc định', 'success');
      onChange();
    } catch {
      showToast('Lỗi khi reset', 'error');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={newSymbol}
          onChange={e => setNewSymbol(e.target.value)}
          placeholder="Symbol (vd: FPT)"
          className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Tên công ty"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd}>Thêm</Button>
          <Button size="sm" variant="secondary" onClick={handleReset}>Đặt lại</Button>
        </div>
      </div>
      <Table
        columns={[
          { key: 'symbol', label: 'Mã' },
          { key: 'name', label: 'Tên' },
          { key: 'actions', label: '', align: 'right' },
        ]}
        rows={stocks}
        renderRow={(s) => editingId === s.id ? {
          symbol: <input value={editSymbol} onChange={e => setEditSymbol(e.target.value)} className="w-24 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />,
          name: <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />,
          actions: (
            <div className="flex justify-end gap-1">
              <button onClick={() => handleRename(s.id)} className="text-xs text-blue-500 hover:underline">Lưu</button>
              <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 hover:underline">Hủy</button>
            </div>
          ),
        } : {
          symbol: <span className="font-medium text-slate-700 dark:text-slate-200">{s.symbol}</span>,
          name: <span className="text-slate-500">{s.name || '-'}</span>,
          actions: (
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditingId(s.id); setEditSymbol(s.symbol); setEditName(s.name || ''); }} className="text-xs text-blue-500 hover:underline">Sửa tên</button>
              <button onClick={() => handleDelete(s.id)} className="text-xs text-rose-500 hover:underline">Xóa</button>
            </div>
          ),
        }}
      />
    </div>
  );
}

function CryptoManager({ cryptos, onChange }: { cryptos: CryptoCoin[]; onChange: () => void }) {
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newSymbol.trim()) return;
    try {
      await masterDataApi.addCrypto(newSymbol.trim(), newName.trim() || undefined);
      setNewSymbol(''); setNewName('');
      showToast('Đã thêm coin', 'success');
      onChange();
    } catch {
      showToast('Lỗi khi thêm', 'error');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={newSymbol}
          onChange={e => setNewSymbol(e.target.value)}
          placeholder="Symbol (vd: BTC)"
          className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Tên coin"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd}>Thêm</Button>
          <Button size="sm" variant="secondary" onClick={async () => { await masterDataApi.resetCryptos(); showToast('Đã reset', 'success'); onChange(); }}>Đặt lại</Button>
        </div>
      </div>
      <Table
        columns={[
          { key: 'symbol', label: 'Mã' },
          { key: 'name', label: 'Tên' },
          { key: 'actions', label: '', align: 'right' },
        ]}
        rows={cryptos}
        renderRow={(c) => ({
          symbol: <span className="font-medium text-slate-700 dark:text-slate-200">{c.symbol}</span>,
          name: <span className="text-slate-500">{c.name || '-'}</span>,
          actions: <button onClick={async () => { await masterDataApi.deleteCrypto(c.id); showToast('Đã xóa', 'success'); onChange(); }} className="text-xs text-rose-500 hover:underline">Xóa</button>,
        })}
      />
    </div>
  );
}

function BankManager({ banks, onChange }: { banks: BankEntry[]; onChange: () => void }) {
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newCode.trim()) return;
    try {
      await masterDataApi.addBank(newCode.trim(), newName.trim() || undefined);
      setNewCode(''); setNewName('');
      showToast('Đã thêm Bank', 'success');
      onChange();
    } catch {
      showToast('Lỗi khi thêm', 'error');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={newCode}
          onChange={e => setNewCode(e.target.value)}
          placeholder="Mã Bank (vd: VCB)"
          className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Tên Bank"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd}>Thêm</Button>
          <Button size="sm" variant="secondary" onClick={async () => { await masterDataApi.resetBanks(); showToast('Đã reset', 'success'); onChange(); }}>Đặt lại</Button>
        </div>
      </div>
      <Table
        columns={[
          { key: 'code', label: 'Mã' },
          { key: 'name', label: 'Tên' },
          { key: 'actions', label: '', align: 'right' },
        ]}
        rows={banks}
        renderRow={(b) => ({
          code: <span className="font-medium text-slate-700 dark:text-slate-200">{b.bank_code}</span>,
          name: <span className="text-slate-500">{b.bank_name || '-'}</span>,
          actions: <button onClick={async () => { await masterDataApi.deleteBank(b.id); showToast('Đã xóa', 'success'); onChange(); }} className="text-xs text-rose-500 hover:underline">Xóa</button>,
        })}
      />
    </div>
  );
}

function DepositTermManager({ terms, onChange }: { terms: DepositTerm[]; onChange: () => void }) {
  const [newLabel, setNewLabel] = useState('');
  const [newMonths, setNewMonths] = useState('');

  const handleAdd = async () => {
    const months = parseInt(newMonths);
    if (!newLabel.trim() || !months) return;
    try {
      await masterDataApi.addDepositTerm(newLabel.trim(), months);
      setNewLabel(''); setNewMonths('');
      showToast('Đã thêm kỳ hạn', 'success');
      onChange();
    } catch {
      showToast('Lỗi khi thêm', 'error');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Nhãn (vd: 9 Months)"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <input
          value={newMonths}
          onChange={e => setNewMonths(e.target.value)}
          placeholder="Số tháng"
          type="number"
          className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd}>Thêm</Button>
          <Button size="sm" variant="secondary" onClick={async () => { await masterDataApi.resetDepositTerms(); showToast('Đã reset', 'success'); onChange(); }}>Đặt lại</Button>
        </div>
      </div>
      <Table
        columns={[
          { key: 'label', label: 'Nhãn' },
          { key: 'months', label: 'Số tháng', align: 'right' },
          { key: 'custom', label: 'Loại', align: 'center' },
          { key: 'actions', label: '', align: 'right' },
        ]}
        rows={terms}
        renderRow={(t) => ({
          label: <span className="font-medium text-slate-700 dark:text-slate-200">{t.label}</span>,
          months: t.months_value,
          custom: <Badge variant={t.is_custom ? 'warning' : 'default'}>{t.is_custom ? 'Tự thêm' : 'Mặc định'}</Badge>,
          actions: <button onClick={async () => { await masterDataApi.deleteDepositTerm(t.id); showToast('Đã xóa', 'success'); onChange(); }} className="text-xs text-rose-500 hover:underline">Xóa</button>,
        })}
      />
    </div>
  );
}

function TradingFeeManager({ fees, onChange }: { fees: TradingFee[]; onChange: () => void }) {
  const [newLabel, setNewLabel] = useState('');
  const [newRate, setNewRate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editRate, setEditRate] = useState('');

  const handleAdd = async () => {
    const rate = parseFloat(newRate);
    if (!newLabel.trim() || isNaN(rate)) return;
    try {
      await masterDataApi.addTradingFee(newLabel.trim(), rate);
      setNewLabel(''); setNewRate('');
      showToast('Đã thêm phí', 'success');
      onChange();
    } catch {
      showToast('Lỗi khi thêm', 'error');
    }
  };

  const handleEdit = async (id: string) => {
    const rate = parseFloat(editRate);
    if (!editLabel.trim() || isNaN(rate)) return;
    try {
      await masterDataApi.updateTradingFee(id, editLabel.trim(), rate);
      setEditingId(null);
      showToast('Đã cập nhật', 'success');
      onChange();
    } catch {
      showToast('Lỗi khi cập nhật', 'error');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Nhãn (vd: 0.15%)"
          className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <input
          value={newRate}
          onChange={e => setNewRate(e.target.value)}
          placeholder="% (vd: 0.15)"
          type="number"
          step="0.01"
          className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd}>Thêm</Button>
          <Button size="sm" variant="secondary" onClick={async () => { await masterDataApi.resetTradingFees(); showToast('Đã reset', 'success'); onChange(); }}>Đặt lại</Button>
        </div>
      </div>
      <Table
        columns={[
          { key: 'label', label: 'Nhãn' },
          { key: 'rate', label: 'Tỷ lệ %', align: 'right' },
          { key: 'type', label: 'Loại', align: 'center' },
          { key: 'actions', label: '', align: 'right' },
        ]}
        rows={fees}
        renderRow={(f) => editingId === f.id ? {
          label: <input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="w-24 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />,
          rate: <input value={editRate} onChange={e => setEditRate(e.target.value)} type="number" step="0.01" className="w-20 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />,
          type: <Badge variant={f.is_default ? 'info' : 'warning'}>{f.is_default ? 'Mặc định' : 'Tự thêm'}</Badge>,
          actions: (
            <div className="flex justify-end gap-2">
              <button onClick={() => handleEdit(f.id)} className="text-xs text-blue-500 hover:underline">Lưu</button>
              <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 hover:underline">Hủy</button>
            </div>
          ),
        } : {
          label: <span className="font-medium text-slate-700 dark:text-slate-200">{f.label}</span>,
          rate: f.rate_pct,
          type: <Badge variant={f.is_default ? 'info' : 'warning'}>{f.is_default ? 'Mặc định' : 'Tự thêm'}</Badge>,
          actions: (
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditingId(f.id); setEditLabel(f.label); setEditRate(String(f.rate_pct)); }} className="text-xs text-blue-500 hover:underline">Sửa</button>
              <button onClick={async () => { await masterDataApi.deleteTradingFee(f.id); showToast('Đã xóa', 'success'); onChange(); }} className="text-xs text-rose-500 hover:underline">Xóa</button>
            </div>
          ),
        }}
      />
    </div>
  );
}
