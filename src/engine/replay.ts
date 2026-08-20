import type { Account, Asset, CashBalance, Transaction } from './types';
import type { ComputedHolding, PortfolioSummary } from './calc';
import { assetAllocation, marketValue, unrealizedPnL } from './calc';

export interface ImportedPosition { id: string; asset_id: string; quantity: number; original_cost: number; deleted_at?: string | null; }
export interface ReplayResult { cashBalances: CashBalance[]; holdings: ComputedHolding[]; summary: PortfolioSummary; originalCapital: number; }

/** Pure ledger replay. It intentionally accepts no UI state and ignores soft-deleted rows. */
export function replayPortfolio(accounts: Account[], assets: Asset[], transactions: Transaction[], imported: ImportedPosition[] = []): ReplayResult {
  const active = transactions.filter(t => !t.deleted_at && t.status === 'COMPLETED').slice().sort((a, b) => `${a.transaction_date}${a.created_at}`.localeCompare(`${b.transaction_date}${b.created_at}`));
  const cash = new Map(accounts.map(a => [a.id, 0]));
  const positions = new Map<string, { quantity: number; cost: number; realized: number }>();
  for (const p of imported.filter(p => !p.deleted_at)) positions.set(p.asset_id, { quantity: p.quantity, cost: p.original_cost, realized: 0 });
  let originalCapital = 0;
  for (const tx of active) {
    const charge = (tx.fee || 0) + (tx.tax || 0) + (tx.other_charge || 0);
    if (tx.transaction_type === 'DEPOSIT' && tx.account_id) { cash.set(tx.account_id, (cash.get(tx.account_id) || 0) + tx.amount); originalCapital += tx.amount; continue; }
    if (tx.transaction_type === 'WITHDRAW' && tx.account_id) { cash.set(tx.account_id, (cash.get(tx.account_id) || 0) - tx.amount); originalCapital -= tx.amount; continue; }
    if (tx.transaction_type === 'TRANSFER') { const amount = tx.amount; if (tx.from_account_id) cash.set(tx.from_account_id, (cash.get(tx.from_account_id) || 0) - amount); if (tx.to_account_id) cash.set(tx.to_account_id, (cash.get(tx.to_account_id) || 0) + amount); continue; }
    if (!tx.asset_id || !tx.account_id) continue;
    const position = positions.get(tx.asset_id) || { quantity: 0, cost: 0, realized: 0 };
    const quantity = tx.quantity || 0; const price = tx.price || 0;
    if (tx.transaction_type === 'BUY') {
      cash.set(tx.account_id, (cash.get(tx.account_id) || 0) - tx.amount - charge);
      if (!tx.trade_tplus) { const next = position.quantity + quantity; position.cost = next ? ((position.quantity * position.cost) + (quantity * price) + charge) / next : 0; }
      position.quantity += quantity;
    } else if (tx.transaction_type === 'SELL') {
      cash.set(tx.account_id, (cash.get(tx.account_id) || 0) + tx.amount - charge);
      const sellQty = Math.min(quantity, position.quantity); position.realized += (price * sellQty - charge) - (position.cost * sellQty); position.quantity -= sellQty;
    } else if (tx.transaction_type === 'DIVIDEND' || tx.transaction_type === 'INTEREST') cash.set(tx.account_id, (cash.get(tx.account_id) || 0) + tx.amount - charge);
    positions.set(tx.asset_id, position);
  }
  const totalCash = Array.from(cash.values()).reduce((sum, value) => sum + value, 0);
  const raw = Array.from(positions.entries()).filter(([, p]) => p.quantity > 0).map(([assetId, p]) => {
    const asset = assets.find(a => a.id === assetId); const account = accounts.find(a => a.id === asset?.account_id); const price = asset?.current_price || p.cost; const value = marketValue(p.quantity, price);
    return { asset, account, p, price, value };
  });
  const totalAsset = totalCash + raw.reduce((s, h) => s + h.value, 0);
  const holdings: ComputedHolding[] = raw.map(({ asset, account, p, price, value }) => ({ asset_id: asset!.id, symbol: asset!.symbol, name: asset!.name || asset!.symbol, asset_type: asset!.asset_type, account_id: asset!.account_id, account_name: account?.account_name || '', quantity: p.quantity, settled_quantity: p.quantity, pending_quantity: 0, average_cost: p.cost, original_avg_cost: p.cost, current_price: price, market_value: value, holding_cost: p.quantity * p.cost, unrealized_pnl: unrealizedPnL(p.quantity, price, p.cost), unrealized_return_pct: p.cost ? ((price - p.cost) / p.cost) * 100 : 0, realized_pnl: p.realized, status: 'OPEN', weight: assetAllocation(value, totalAsset), maturity_date: null, remaining_days: null }));
  const totalHoldingValue = holdings.reduce((s, h) => s + h.market_value, 0); const totalUnrealizedPnL = holdings.reduce((s, h) => s + h.unrealized_pnl, 0); const totalRealizedPnL = holdings.reduce((s, h) => s + h.realized_pnl, 0);
  const categoryBreakdown: Record<string, number> = { CASH: totalCash }; for (const h of holdings) categoryBreakdown[h.asset_type] = (categoryBreakdown[h.asset_type] || 0) + h.market_value;
  const allocation = Object.fromEntries(Object.entries(categoryBreakdown).map(([key, value]) => [key, assetAllocation(value, totalAsset)]));
  const summary: PortfolioSummary = { totalAsset, totalCash, totalHoldingValue, totalUnrealizedPnL, totalRealizedPnL, totalPnL: totalUnrealizedPnL + totalRealizedPnL, totalReturnPct: originalCapital ? ((totalUnrealizedPnL + totalRealizedPnL) / originalCapital) * 100 : 0, totalIncome: 0, totalExpense: 0, netPnL: totalUnrealizedPnL + totalRealizedPnL, categoryBreakdown, allocation };
  return { cashBalances: accounts.map(a => ({ id: `derived-${a.id}`, account_id: a.id, currency: a.currency, available_cash: cash.get(a.id) || 0, pending_cash: 0, updated_at: new Date().toISOString() })), holdings, summary, originalCapital };
}
