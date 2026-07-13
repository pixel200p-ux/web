import type {
  Account, Asset, CashBalance, Holding, Transaction,
  IncomeRecord, ExpenseRecord, TargetAllocation,
} from './types';

/**
 * Mock data for the trial version.
 * No realtime data — these are static values for testing the UI.
 * When realtime is enabled, these will be replaced with live Supabase queries.
 */

export const mockTargetAllocation: TargetAllocation = {
  STOCK: 25,
  ETF: 25,
  CRYPTO: 15,
  DCDS: 15,
  BANK: 0,
  CASH: 20,
};

export const mockAccounts: Account[] = [
  { id: 'acc-vps', user_id: '', account_name: 'VPS', account_type: 'STOCK', broker: 'VPS Securities', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'acc-ssi', user_id: '', account_name: 'SSI', account_type: 'STOCK', broker: 'SSI Securities', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'acc-binance', user_id: '', account_name: 'Binance', account_type: 'CRYPTO', broker: 'Binance', currency: 'USDT', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'acc-etf', user_id: '', account_name: 'ETF Account', account_type: 'ETF', broker: 'VPS', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'acc-dcds', user_id: '', account_name: 'DCDS Fund', account_type: 'DCDS', broker: 'DCDS', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'acc-bank', user_id: '', account_name: 'Vietcombank', account_type: 'BANK', broker: 'VCB', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
];

export const mockAssets: Asset[] = [
  // VPS Stocks
  { id: 'ast-mbb', account_id: 'acc-vps', asset_type: 'STOCK', symbol: 'MBB', name: 'MB Bank', category: 'Banking', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'ast-fpt', account_id: 'acc-vps', asset_type: 'STOCK', symbol: 'FPT', name: 'FPT Corp', category: 'Technology', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'ast-vci', account_id: 'acc-vps', asset_type: 'STOCK', symbol: 'VCI', name: 'Vietcap', category: 'Securities', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  // SSI Stocks
  { id: 'ast-pow', account_id: 'acc-ssi', asset_type: 'STOCK', symbol: 'POW', name: 'PV Power', category: 'Energy', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  // Crypto
  { id: 'ast-btc', account_id: 'acc-binance', asset_type: 'CRYPTO', symbol: 'BTC', name: 'Bitcoin', category: 'Major', currency: 'USDT', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'ast-eth', account_id: 'acc-binance', asset_type: 'CRYPTO', symbol: 'ETH', name: 'Ethereum', category: 'Major', currency: 'USDT', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'ast-sol', account_id: 'acc-binance', asset_type: 'CRYPTO', symbol: 'SOL', name: 'Solana', category: 'L1', currency: 'USDT', status: 'ACTIVE', created_at: '2025-01-01' },
  // ETF
  { id: 'ast-e1vfvn30', account_id: 'acc-etf', asset_type: 'ETF', symbol: 'E1VFVN30', name: 'VN30 ETF', category: 'Index', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  { id: 'ast-fuessvfl', account_id: 'acc-etf', asset_type: 'ETF', symbol: 'FUESSVFL', name: 'SSVFL ETF', category: 'Sector', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  // DCDS
  { id: 'ast-dcds1', account_id: 'acc-dcds', asset_type: 'FUND', symbol: 'DCDS-GF', name: 'DCDS Growth Fund', category: 'Open Fund', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
  // Bank
  { id: 'ast-vcb-deposit', account_id: 'acc-bank', asset_type: 'BANK_DEPOSIT', symbol: 'VCB-6M', name: 'VCB 6M Deposit', category: 'Savings', currency: 'VND', status: 'ACTIVE', created_at: '2025-01-01' },
];

export const mockCashBalances: CashBalance[] = [
  { id: 'cash-vps', account_id: 'acc-vps', currency: 'VND', available_cash: 50_000_000, pending_cash: 0, updated_at: '2025-07-10' },
  { id: 'cash-ssi', account_id: 'acc-ssi', currency: 'VND', available_cash: 20_000_000, pending_cash: 0, updated_at: '2025-07-10' },
  { id: 'cash-binance', account_id: 'acc-binance', currency: 'USDT', available_cash: 5_000, pending_cash: 0, updated_at: '2025-07-10' },
  { id: 'cash-etf', account_id: 'acc-etf', currency: 'VND', available_cash: 30_000_000, pending_cash: 0, updated_at: '2025-07-10' },
  { id: 'cash-dcds', account_id: 'acc-dcds', currency: 'VND', available_cash: 10_000_000, pending_cash: 0, updated_at: '2025-07-10' },
  { id: 'cash-bank', account_id: 'acc-bank', currency: 'VND', available_cash: 0, pending_cash: 0, updated_at: '2025-07-10' },
];

export const mockHoldings: Holding[] = [
  { id: 'h-mbb', asset_id: 'ast-mbb', quantity: 2000, average_cost: 22000, current_price: 25000, updated_at: '2025-07-10' },
  { id: 'h-fpt', asset_id: 'ast-fpt', quantity: 500, average_cost: 90000, current_price: 110000, updated_at: '2025-07-10' },
  { id: 'h-vci', asset_id: 'ast-vci', quantity: 1000, average_cost: 30000, current_price: 35000, updated_at: '2025-07-10' },
  { id: 'h-pow', asset_id: 'ast-pow', quantity: 800, average_cost: 12000, current_price: 14000, updated_at: '2025-07-10' },
  { id: 'h-btc', asset_id: 'ast-btc', quantity: 0.5, average_cost: 65000, current_price: 68000, updated_at: '2025-07-10' },
  { id: 'h-eth', asset_id: 'ast-eth', quantity: 3, average_cost: 3200, current_price: 3500, updated_at: '2025-07-10' },
  { id: 'h-sol', asset_id: 'ast-sol', quantity: 50, average_cost: 140, current_price: 160, updated_at: '2025-07-10' },
  { id: 'h-e1vfvn30', asset_id: 'ast-e1vfvn30', quantity: 5000, average_cost: 22, current_price: 24.5, updated_at: '2025-07-10' },
  { id: 'h-fuessvfl', asset_id: 'ast-fuessvfl', quantity: 3000, average_cost: 12, current_price: 13.5, updated_at: '2025-07-10' },
  { id: 'h-dcds1', asset_id: 'ast-dcds1', quantity: 10000, average_cost: 10000, current_price: 10500, updated_at: '2025-07-10' },
  { id: 'h-vcb-deposit', asset_id: 'ast-vcb-deposit', quantity: 1, average_cost: 100_000_000, current_price: 103_000_000, updated_at: '2025-07-10' },
];

export const mockTransactions: Transaction[] = [
  { id: 'tx-1', account_id: 'acc-vps', asset_id: 'ast-mbb', transaction_type: 'BUY', quantity: 1000, price: 20000, amount: 20_000_000, fee: 30_000, tax: 0, transaction_date: '2025-06-15', settlement_date: '2025-06-17', status: 'COMPLETED', created_at: '2025-06-15' },
  { id: 'tx-2', account_id: 'acc-vps', asset_id: 'ast-mbb', transaction_type: 'BUY', quantity: 1000, price: 24000, amount: 24_000_000, fee: 36_000, tax: 0, transaction_date: '2025-07-01', settlement_date: '2025-07-03', status: 'COMPLETED', created_at: '2025-07-01' },
  { id: 'tx-3', account_id: 'acc-vps', asset_id: 'ast-fpt', transaction_type: 'BUY', quantity: 500, price: 90000, amount: 45_000_000, fee: 67_500, tax: 0, transaction_date: '2025-06-20', settlement_date: '2025-06-22', status: 'COMPLETED', created_at: '2025-06-20' },
  { id: 'tx-4', account_id: 'acc-vps', asset_id: 'ast-vci', transaction_type: 'BUY', quantity: 1000, price: 30000, amount: 30_000_000, fee: 45_000, tax: 0, transaction_date: '2025-06-25', settlement_date: '2025-06-27', status: 'COMPLETED', created_at: '2025-06-25' },
  { id: 'tx-5', account_id: 'acc-ssi', asset_id: 'ast-pow', transaction_type: 'BUY', quantity: 800, price: 12000, amount: 9_600_000, fee: 14_400, tax: 0, transaction_date: '2025-07-02', settlement_date: '2025-07-04', status: 'COMPLETED', created_at: '2025-07-02' },
  { id: 'tx-6', account_id: 'acc-vps', asset_id: null, transaction_type: 'DEPOSIT', quantity: null, price: null, amount: 150_000_000, fee: 0, tax: 0, transaction_date: '2025-06-01', settlement_date: null, status: 'COMPLETED', created_at: '2025-06-01' },
  { id: 'tx-7', account_id: 'acc-vps', asset_id: null, transaction_type: 'WITHDRAW', quantity: null, price: null, amount: 10_000_000, fee: 0, tax: 0, transaction_date: '2025-07-05', settlement_date: null, status: 'COMPLETED', created_at: '2025-07-05' },
  { id: 'tx-8', account_id: 'acc-binance', asset_id: 'ast-btc', transaction_type: 'BUY', quantity: 0.5, price: 65000, amount: 32_500, fee: 32.5, tax: 0, transaction_date: '2025-06-10', settlement_date: null, status: 'COMPLETED', created_at: '2025-06-10' },
  { id: 'tx-9', account_id: 'acc-binance', asset_id: 'ast-eth', transaction_type: 'BUY', quantity: 3, price: 3200, amount: 9600, fee: 9.6, tax: 0, transaction_date: '2025-06-12', settlement_date: null, status: 'COMPLETED', created_at: '2025-06-12' },
  { id: 'tx-10', account_id: 'acc-binance', asset_id: 'ast-sol', transaction_type: 'BUY', quantity: 50, price: 140, amount: 7000, fee: 7, tax: 0, transaction_date: '2025-06-14', settlement_date: null, status: 'COMPLETED', created_at: '2025-06-14' },
  { id: 'tx-11', account_id: 'acc-binance', asset_id: null, transaction_type: 'DEPOSIT', quantity: null, price: null, amount: 50_000, fee: 0, tax: 0, transaction_date: '2025-06-05', settlement_date: null, status: 'COMPLETED', created_at: '2025-06-05' },
  { id: 'tx-12', account_id: 'acc-etf', asset_id: 'ast-e1vfvn30', transaction_type: 'BUY', quantity: 5000, price: 22, amount: 110_000, fee: 165, tax: 0, transaction_date: '2025-06-18', settlement_date: '2025-06-20', status: 'COMPLETED', created_at: '2025-06-18' },
  { id: 'tx-13', account_id: 'acc-etf', asset_id: 'ast-fuessvfl', transaction_type: 'BUY', quantity: 3000, price: 12, amount: 36_000, fee: 54, tax: 0, transaction_date: '2025-06-22', settlement_date: '2025-06-24', status: 'COMPLETED', created_at: '2025-06-22' },
  { id: 'tx-14', account_id: 'acc-etf', asset_id: null, transaction_type: 'DEPOSIT', quantity: null, price: null, amount: 200_000_000, fee: 0, tax: 0, transaction_date: '2025-06-01', settlement_date: null, status: 'COMPLETED', created_at: '2025-06-01' },
  { id: 'tx-15', account_id: 'acc-dcds', asset_id: 'ast-dcds1', transaction_type: 'BUY', quantity: 10000, price: 10000, amount: 100_000_000, fee: 0, tax: 0, transaction_date: '2025-06-10', settlement_date: null, status: 'COMPLETED', created_at: '2025-06-10' },
  { id: 'tx-16', account_id: 'acc-dcds', asset_id: null, transaction_type: 'DEPOSIT', quantity: null, price: null, amount: 120_000_000, fee: 0, tax: 0, transaction_date: '2025-06-01', settlement_date: null, status: 'COMPLETED', created_at: '2025-06-01' },
  { id: 'tx-17', account_id: 'acc-bank', asset_id: 'ast-vcb-deposit', transaction_type: 'DEPOSIT', quantity: 1, price: 100_000_000, amount: 100_000_000, fee: 0, tax: 0, transaction_date: '2025-05-15', settlement_date: '2025-11-15', status: 'COMPLETED', created_at: '2025-05-15' },
  { id: 'tx-18', account_id: 'acc-ssi', asset_id: null, transaction_type: 'DEPOSIT', quantity: null, price: null, amount: 30_000_000, fee: 0, tax: 0, transaction_date: '2025-06-01', settlement_date: null, status: 'COMPLETED', created_at: '2025-06-01' },
  { id: 'tx-19', account_id: 'acc-vps', asset_id: 'ast-mbb', transaction_type: 'DIVIDEND', quantity: null, price: null, amount: 1_000_000, fee: 0, tax: 50_000, transaction_date: '2025-07-08', settlement_date: null, status: 'COMPLETED', created_at: '2025-07-08' },
  { id: 'tx-20', account_id: 'acc-vps', asset_id: 'ast-fpt', transaction_type: 'SELL', quantity: 0, price: 0, amount: 0, fee: 0, tax: 0, transaction_date: '2025-07-09', settlement_date: '2025-07-11', status: 'PENDING', created_at: '2025-07-09' },
  // T+ cycle: MBB buy at 25000, sell at 26500 (completed cycle)
  { id: 'tx-21', account_id: 'acc-vps', asset_id: 'ast-mbb', transaction_type: 'BUY', quantity: 200, price: 25000, amount: 5_000_000, fee: 7_500, tax: 0, transaction_date: '2025-07-10', settlement_date: '2025-07-12', status: 'COMPLETED', created_at: '2025-07-10' },
  { id: 'tx-22', account_id: 'acc-vps', asset_id: 'ast-mbb', transaction_type: 'SELL', quantity: 200, price: 26500, amount: 5_300_000, fee: 7_950, tax: 0, transaction_date: '2025-07-11', settlement_date: '2025-07-13', status: 'COMPLETED', created_at: '2025-07-11' },
  // T+ cycle: FPT buy at 100000, sell at 105000 (completed cycle)
  { id: 'tx-23', account_id: 'acc-vps', asset_id: 'ast-fpt', transaction_type: 'BUY', quantity: 100, price: 100000, amount: 10_000_000, fee: 15_000, tax: 0, transaction_date: '2025-07-12', settlement_date: '2025-07-14', status: 'COMPLETED', created_at: '2025-07-12' },
  { id: 'tx-24', account_id: 'acc-vps', asset_id: 'ast-fpt', transaction_type: 'SELL', quantity: 100, price: 105000, amount: 10_500_000, fee: 15_750, tax: 0, transaction_date: '2025-07-13', settlement_date: '2025-07-15', status: 'COMPLETED', created_at: '2025-07-13' },
  // T+ cycle: BTC buy at 67000, sell at 69000 (completed cycle)
  { id: 'tx-25', account_id: 'acc-binance', asset_id: 'ast-btc', transaction_type: 'BUY', quantity: 0.1, price: 67000, amount: 6700, fee: 6.7, tax: 0, transaction_date: '2025-07-08', settlement_date: null, status: 'COMPLETED', created_at: '2025-07-08' },
  { id: 'tx-26', account_id: 'acc-binance', asset_id: 'ast-btc', transaction_type: 'SELL', quantity: 0.1, price: 69000, amount: 6900, fee: 6.9, tax: 0, transaction_date: '2025-07-09', settlement_date: null, status: 'COMPLETED', created_at: '2025-07-09' },
  // Open T+ cycle: SOL buy at 155, waiting to sell
  { id: 'tx-27', account_id: 'acc-binance', asset_id: 'ast-sol', transaction_type: 'BUY', quantity: 20, price: 155, amount: 3100, fee: 3.1, tax: 0, transaction_date: '2025-07-11', settlement_date: null, status: 'COMPLETED', created_at: '2025-07-11' },
];

export const mockIncomes: IncomeRecord[] = [
  { id: 'inc-1', asset_id: 'ast-mbb', income_type: 'DIVIDEND', amount: 1_000_000, income_date: '2025-07-08', transaction_id: 'tx-19' },
  { id: 'inc-2', asset_id: 'ast-vcb-deposit', income_type: 'INTEREST', amount: 3_000_000, income_date: '2025-07-10' },
  { id: 'inc-3', asset_id: 'ast-e1vfvn30', income_type: 'DISTRIBUTION', amount: 500_000, income_date: '2025-07-05' },
];

export const mockExpenses: ExpenseRecord[] = [
  { id: 'exp-1', asset_id: 'ast-mbb', expense_type: 'TRADING_FEE', amount: 30_000, expense_date: '2025-06-15', transaction_id: 'tx-1' },
  { id: 'exp-2', asset_id: 'ast-mbb', expense_type: 'TRADING_FEE', amount: 36_000, expense_date: '2025-07-01', transaction_id: 'tx-2' },
  { id: 'exp-3', asset_id: 'ast-fpt', expense_type: 'TRADING_FEE', amount: 67_500, expense_date: '2025-06-20', transaction_id: 'tx-3' },
  { id: 'exp-4', asset_id: 'ast-vci', expense_type: 'TRADING_FEE', amount: 45_000, expense_date: '2025-06-25', transaction_id: 'tx-4' },
  { id: 'exp-5', asset_id: 'ast-pow', expense_type: 'TRADING_FEE', amount: 14_400, expense_date: '2025-07-02', transaction_id: 'tx-5' },
  { id: 'exp-6', asset_id: 'ast-btc', expense_type: 'TRADING_FEE', amount: 32.5, expense_date: '2025-06-10', transaction_id: 'tx-8' },
  { id: 'exp-7', asset_id: 'ast-mbb', expense_type: 'TAX', amount: 50_000, expense_date: '2025-07-08', transaction_id: 'tx-19' },
];

// USD to VND exchange rate for display
export const USD_TO_VND = 25000;
