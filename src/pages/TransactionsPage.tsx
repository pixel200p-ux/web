import { useState } from 'react';
import { Card, Table, Badge, Select, EmptyState, Button, Modal, Input } from '../components/ui';
import { showToast } from '../components/Toast';
import { useSettings } from '../lib/settings';
import type { PortfolioData } from '../lib/dataStore';
import type { TransactionType, Transaction } from '../engine/types';

export function TransactionsPage({ data }: { data: PortfolioData }) {
  const { formatMoney, moneyPlaceholder } = useSettings();
  const [filterType, setFilterType] = useState('ALL');
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editType, setEditType] = useState<TransactionType>('BUY');
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editAmount, setEditAmount] = useState('');

  let txs = data.transactions;
  if (filterType !== 'ALL') txs = txs.filter(t => t.transaction_type === filterType);
  if (filterAccount !== 'ALL') txs = txs.filter(t => t.account_id === filterAccount);
  txs = [...txs].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditType(tx.transaction_type);
    setEditQty(tx.quantity ? String(tx.quantity) : '');
    setEditPrice(tx.price ? String(tx.price) : '');
    setEditAmount(String(tx.amount));
  };

  const handleSaveEdit = () => {
    setEditingTx(null);
    showToast('Giao dịch đã cập nhật (bản thử nghiệm)', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Giao dịch</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Lịch sử toàn bộ giao dịch</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="w-40">
            <Select
              label="Loại"
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'BUY', label: 'Buy' },
                { value: 'SELL', label: 'Sell' },
                { value: 'DEPOSIT', label: 'Nạp' },
                { value: 'WITHDRAW', label: 'Rút' },
                { value: 'DIVIDEND', label: 'Cổ tức' },
              ]}
            />
          </div>
          <div className="w-48">
            <Select
              label="Tài khoản"
              value={filterAccount}
              onChange={setFilterAccount}
              options={[
                { value: 'ALL', label: 'Tất cả' },
                ...data.accounts.map(a => ({ value: a.id, label: a.account_name })),
              ]}
            />
          </div>
        </div>

        {txs.length === 0 ? (
          <EmptyState message="Không có giao dịch nào" />
        ) : (
          <Table
            columns={[
              { key: 'date', label: 'Ngày' },
              { key: 'type', label: 'Loại' },
              { key: 'account', label: 'Tài khoản' },
              { key: 'asset', label: 'Tài sản' },
              { key: 'qty', label: 'SL', align: 'right' },
              { key: 'price', label: 'Giá', align: 'right' },
              { key: 'amount', label: 'Giá trị', align: 'right' },
              { key: 'fee', label: 'Phí', align: 'right' },
              { key: 'status', label: 'Trạng thái', align: 'center' },
              { key: 'actions', label: '', align: 'right' },
            ]}
            rows={txs}
            renderRow={(tx) => {
              const asset = data.assets.find(a => a.id === tx.asset_id);
              const account = data.accounts.find(a => a.id === tx.account_id);
              return {
                date: tx.transaction_date,
                type: <Badge variant={tx.transaction_type === 'BUY' ? 'info' : tx.transaction_type === 'SELL' ? 'warning' : tx.transaction_type === 'DEPOSIT' ? 'success' : 'default'}>{tx.transaction_type}</Badge>,
                account: account?.account_name || '',
                asset: asset?.symbol || 'Cash',
                qty: tx.quantity ? tx.quantity.toLocaleString() : '-',
                price: tx.price ? <span className="whitespace-nowrap">{formatMoney(tx.price, { decimals: 2 })}</span> : '-',
                amount: <span className="whitespace-nowrap">{formatMoney(tx.amount)}</span>,
                fee: tx.fee ? <span className="whitespace-nowrap">{formatMoney(tx.fee, { decimals: 2 })}</span> : '-',
                status: <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'}>{tx.status === 'COMPLETED' ? 'Hoàn tất' : 'Chờ'}</Badge>,
                actions: <button onClick={() => openEdit(tx)} className="text-xs text-blue-500 hover:underline">Sửa</button>,
              };
            }}
          />
        )}
      </Card>

      {/* Edit Transaction Modal */}
      <Modal open={!!editingTx} onClose={() => setEditingTx(null)} title="Sửa giao dịch">
        <div className="space-y-4">
          <Select
            label="Loại giao dịch"
            value={editType}
            onChange={(v) => setEditType(v as TransactionType)}
            options={[
              { value: 'BUY', label: 'Buy' },
              { value: 'SELL', label: 'Sell' },
              { value: 'DEPOSIT', label: 'Nạp' },
              { value: 'WITHDRAW', label: 'Rút' },
              { value: 'DIVIDEND', label: 'Cổ tức' },
            ]}
          />
          <Input label="Số lượng" type="number" value={editQty} onChange={setEditQty} placeholder="0" />
          <Input label="Giá" type="number" value={editPrice} onChange={setEditPrice} placeholder={moneyPlaceholder} />
          <Input label="Số tiền" type="number" value={editAmount} onChange={setEditAmount} placeholder={moneyPlaceholder} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingTx(null)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Cập nhật</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
