import { Card, Table, Badge, EmptyState } from '../components/ui';
import { useSettings } from '../lib/settings';
import type { PortfolioData } from '../lib/dataStore';

export function AuditPage({ data }: { data: PortfolioData }) {
  const { formatMoney } = useSettings();

  const auditEntries = data.transactions.slice().reverse().map((tx) => {
    const asset = data.assets.find(a => a.id === tx.asset_id);
    const account = data.accounts.find(a => a.id === tx.account_id);
    return {
      id: tx.id,
      time: tx.created_at,
      action: `CREATE_${tx.transaction_type}`,
      module: account?.account_type || 'SYSTEM',
      detail: `${tx.transaction_type} ${asset?.symbol || 'Cash'} - ${formatMoney(tx.amount)}`,
      user: 'current_user',
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Nhật ký kiểm toán</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Lịch sử thay đổi hệ thống</p>
      </div>

      <Card>
        {auditEntries.length === 0 ? (
          <EmptyState message="Chưa có log nào" />
        ) : (
          <Table
            columns={[
              { key: 'time', label: 'Thời gian' },
              { key: 'action', label: 'Hành động' },
              { key: 'module', label: 'Module' },
              { key: 'detail', label: 'Chi tiết' },
              { key: 'user', label: 'Người dùng' },
            ]}
            rows={auditEntries}
            renderRow={(entry) => ({
              time: entry.time,
              action: <Badge variant="info">{entry.action}</Badge>,
              module: entry.module,
              detail: entry.detail,
              user: entry.user,
            })}
          />
        )}
      </Card>
    </div>
  );
}
