export type AssetType = 'STOCK' | 'CRYPTO' | 'ETF' | 'FUND' | 'BANK_DEPOSIT';
export type AccountType = 'UNALLOCATED' | 'STOCK' | 'CRYPTO' | 'ETF' | 'DCDS' | 'BANK';
export type TransactionType =
  | 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW'
  | 'DIVIDEND' | 'TRANSFER' | 'SWAP' | 'INTEREST' | 'FEE' | 'TAX';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type IncomeType = 'DIVIDEND' | 'INTEREST' | 'DISTRIBUTION' | 'YIELD' | 'OTHER';
export type ExpenseType = 'TRADING_FEE' | 'TAX' | 'MANAGEMENT_FEE' | 'OTHER';
export type HoldingStatus = 'OPEN' | 'PARTIAL' | 'CLOSED' | 'PENDING';

export interface Account {
  id: string;
  user_id: string;
  account_name: string;
  account_type: AccountType;
  broker?: string;
  currency: string;
  status: string;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id?: string;
  account_id: string;
  asset_type: AssetType;
  symbol: string;
  name?: string;
  category?: string;
  currency: string;
  status: string;
  current_price?: number | null;
  price_source?: string | null;
  price_updated_at?: string | null;
  created_at: string;
}

export interface CashBalance {
  id: string;
  account_id: string;
  currency: string;
  available_cash: number;
  pending_cash: number;
  updated_at: string;
}

export interface Holding {
  id: string;
  asset_id: string;
  quantity: number;
  average_cost: number;
  current_price: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  asset_id: string | null;
  transaction_type: TransactionType;
  quantity?: number | null;
  price?: number | null;
  amount: number;
  fee: number;
  tax: number;
  other_charge?: number;
  trade_tplus?: boolean;
  from_account_id?: string | null;
  to_account_id?: string | null;
  deleted_at?: string | null;
  transaction_date: string;
  settlement_date?: string | null;
  status: TransactionStatus;
  notes?: string;
  created_at: string;
}

export interface IncomeRecord {
  id: string;
  asset_id: string;
  income_type: IncomeType;
  amount: number;
  income_date: string;
  transaction_id?: string;
}

export interface ExpenseRecord {
  id: string;
  asset_id: string;
  expense_type: ExpenseType;
  amount: number;
  expense_date: string;
  transaction_id?: string;
}

export interface PriceHistory {
  id: string;
  asset_id: string;
  price: number;
  source?: string;
  recorded_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  module?: string;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  created_at: string;
}

export interface UserSetting {
  id: string;
  user_id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

export interface HoldingWithAsset extends Holding {
  asset?: Asset;
  account?: Account;
}

export interface TransactionWithRelations extends Transaction {
  asset?: Asset;
  account?: Account;
}

export interface TargetAllocation {
  STOCK: number;
  ETF: number;
  CRYPTO: number;
  DCDS: number;
  BANK: number;
  CASH: number;
}
