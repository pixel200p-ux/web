import { supabase } from '../lib/supabase';
import { replayPortfolio, type ImportedPosition } from './replay';
import { computeTPlusSummary } from './tplus';
import type { Account, Asset, Transaction } from './types';
import type { PortfolioData } from '../lib/dataStore';

const emptyTargets = { STOCK: 0, ETF: 0, CRYPTO: 0, DCDS: 0, BANK: 0, CASH: 0 };

const mapAccount = (row: Record<string, unknown>): Account => ({
  id: String(row.id),
  user_id: String(row.user_id),
  account_name: String(row.account_name),
  account_type: row.account_type as Account['account_type'],
  broker: row.broker as string | undefined,
  currency: String(row.currency),
  status: String(row.status),
  created_at: String(row.created_at),
});

const mapAsset = (row: Record<string, unknown>): Asset => ({
  id: String(row.id),
  user_id: String(row.user_id),
  account_id: String(row.account_id),
  asset_type: row.asset_type as Asset['asset_type'],
  symbol: String(row.symbol),
  name: row.name as string | undefined,
  currency: String(row.currency),
  status: String(row.status),
  created_at: String(row.created_at),
  current_price: row.current_price === null ? null : Number(row.current_price),
  price_source: row.price_source as string | null,
  price_updated_at: row.price_updated_at as string | null,
});

const mapTx = (row: Record<string, unknown>): Transaction => ({
  id: String(row.id),
  account_id: String(row.account_id || ''),
  asset_id: row.asset_id as string | null,
  transaction_type: row.transaction_type as Transaction['transaction_type'],
  quantity: row.quantity === null ? null : Number(row.quantity),
  price: row.price === null ? null : Number(row.price),
  amount: Number(row.amount),
  fee: Number(row.fee || 0),
  tax: Number(row.tax || 0),
  other_charge: Number(row.other_charge || 0),
  trade_tplus: Boolean(row.trade_tplus),
  from_account_id: row.from_account_id as string | null,
  to_account_id: row.to_account_id as string | null,
  transaction_date: String(row.transaction_date),
  status: row.status as Transaction['status'],
  notes: row.notes as string | undefined,
  deleted_at: row.deleted_at as string | null,
  created_at: String(row.created_at),
});

/**
 * Replay Engine Trung Tâm:
 * Đọc toàn bộ chuỗi transaction ledger chưa bị xóa, sắp xếp chronologically,
 * và tính toán lại 100% số dư Cash, Holdings, Giá vốn T+, Lãi Bank, P&L.
 */
export async function recalculate(): Promise<PortfolioData> {
  const [accountsRes, assetsRes, txsRes, importedRes] = await Promise.all([
    supabase.from('portfolio_accounts').select('*').order('created_at'),
    supabase.from('portfolio_assets').select('*').order('symbol'),
    supabase.from('portfolio_transactions').select('*').is('deleted_at', null).order('transaction_date'),
    supabase.from('imported_positions').select('*').is('deleted_at', null),
  ]);

  // ✅ BƯỚC MỚI: Xử lý lỗi và dữ liệu rỗng cho new user
  if (accountsRes.error) {
    console.error('❌ Supabase error fetching accounts:', accountsRes.error);
    throw accountsRes.error;
  }
  if (assetsRes.error) {
    console.error('❌ Supabase error fetching assets:', assetsRes.error);
    throw assetsRes.error;
  }
  if (txsRes.error) {
    console.error('❌ Supabase error fetching transactions:', txsRes.error);
    throw txsRes.error;
  }

  // ✅ Sử dụng dữ liệu rỗng an toàn thay vì undefined/null
  const accounts: Account[] = (accountsRes.data || []).map(mapAccount);
  const assets: Asset[] = (assetsRes.data || []).map(mapAsset);
  const transactions: Transaction[] = (txsRes.data || []).map(mapTx);
  const imported: ImportedPosition[] = (importedRes.data || []) as ImportedPosition[];

  //  ✅ BƯỚC MỚI: Kiểm tra dữ liệu rỗng cho new user
  if (accounts.length === 0 && assets.length === 0 && transactions.length === 0) {
    console.log('📦 New user detected - returning empty portfolio structure');
    // Trở về early return với cấu trúc rỗng an toàn
    return {
      accounts,
      assets,
      transactions,
      cashBalances: accounts.map(a => ({
        id: `derived-${a.id}`,
        account_id: a.id,
        currency: a.currency,
        available_cash: 0,
        pending_cash: 0,
        updated_at: new Date().toISOString(),
      })),
      holdings: [],
      incomes: [],
      expenses: [],
      summary: {
        totalAsset: 0,
        totalCash: 0,
        totalHoldingValue: 0,
        totalUnrealizedPnL: 0,
        totalRealizedPnL: 0,
        totalPnL: 0,
        totalReturnPct: 0,
        totalIncome: 0,
        totalExpense: 0,
        netPnL: 0,
        categoryBreakdown: {},
        allocation: { STOCK: 0, ETF: 0, CRYPTO: 0, DCDS: 0, BANK: 0, CASH: 0 },
      },
      targetAllocation: { STOCK: 0, ETF: 0, CRYPTO: 0, DCDS: 0, BANK: 0, CASH: 0 },
      tplusSummary: {
        total_tplus_profit: 0,
        total_cost_reduction: 0,
        total_cost_reduction_value: 0,
        completed_cycles: 0,
        open_cycles: 0,
        total_reinvested_profit: 0,
        total_remaining_unrealized_loss: 0,
        win_rate: 0,
        avg_profit_per_cycle: 0,
        largest_profit: 0,
        largest_loss: 0,
        analyses: [],
      },
    };
  }

  // 1. Chạy Deterministic Replay
  const replay = replayPortfolio(accounts, assets, transactions, imported);

  // 2. Chạy T+ Engine
  const holdingsForTplus = replay.holdings.map(h => ({
    asset_id: h.asset_id,
    quantity: h.quantity,
    average_cost: h.average_cost,
    current_price: h.current_price,
  }));
  const tplusSummary = computeTPlusSummary(transactions, assets, accounts, holdingsForTplus);

  return {
    accounts,
    assets,
    transactions,
    cashBalances: replay.cashBalances,
    holdings: replay.holdings,
    incomes: [],
    expenses: [],
    summary: replay.summary,
    targetAllocation: emptyTargets,
    tplusSummary,
  };
}
