/*
# Portfolio Manager - Core Database Schema

## Overview
Creates the complete database schema for the Portfolio Manager system following the
transaction-driven architecture: transactions are the source of truth, holdings and
cash balances are derived state, performance is calculated by the engine.

## New Tables

1. **accounts** - Broker/wallet/bank accounts (VPS, SSI, Binance, etc.)
   - user_id (owner), account_name, account_type (STOCK/CRYPTO/ETF/DCDS/BANK), broker, currency

2. **assets** - Individual assets within accounts (MBB, BTC, E1VFVN30, etc.)
   - account_id, asset_type, symbol, name, category, currency

3. **cash_balances** - Cash per account
   - account_id, currency, available_cash, pending_cash

4. **holdings** - Current ownership state per asset
   - asset_id, quantity, average_cost, current_price

5. **transactions** - Source of truth: all BUY/SELL/DEPOSIT/WITHDRAW/DIVIDEND/TRANSFER/SWAP
   - account_id, asset_id, transaction_type, quantity, price, amount, fee, tax, transaction_date, status, settlement_date

6. **income_records** - Dividends, interest, distributions
   - asset_id, income_type, amount, date, transaction_id

7. **expense_records** - Fees, taxes, management fees
   - asset_id, expense_type, amount, date, transaction_id

8. **price_history** - Market price snapshots
   - asset_id, price, source, timestamp

9. **audit_logs** - All system changes
   - user_id, action, module, before_data, after_data, timestamp

10. **settings** - User configuration (target allocation, theme, currency)
    - user_id, key, value

## Security
- RLS enabled on ALL tables
- Owner-scoped policies (auth.uid() = user_id) for all CRUD
- user_id columns default to auth.uid() so inserts work without explicit user_id
*/ 

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('STOCK','CRYPTO','ETF','DCDS','BANK')),
  broker text,
  currency text NOT NULL DEFAULT 'VND',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_accounts" ON accounts;
CREATE POLICY "select_own_accounts" ON accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_accounts" ON accounts;
CREATE POLICY "insert_own_accounts" ON accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_accounts" ON accounts;
CREATE POLICY "update_own_accounts" ON accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_accounts" ON accounts;
CREATE POLICY "delete_own_accounts" ON accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('STOCK','CRYPTO','ETF','FUND','BANK_DEPOSIT')),
  symbol text NOT NULL,
  name text,
  category text,
  currency text NOT NULL DEFAULT 'VND',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assets" ON assets;
CREATE POLICY "select_own_assets" ON assets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = assets.account_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_assets" ON assets;
CREATE POLICY "insert_own_assets" ON assets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = assets.account_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_assets" ON assets;
CREATE POLICY "update_own_assets" ON assets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = assets.account_id AND accounts.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = assets.account_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_assets" ON assets;
CREATE POLICY "delete_own_assets" ON assets FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = assets.account_id AND accounts.user_id = auth.uid())
  );

-- Cash balances table
CREATE TABLE IF NOT EXISTS cash_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'VND',
  available_cash numeric(20,2) NOT NULL DEFAULT 0,
  pending_cash numeric(20,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cash" ON cash_balances;
CREATE POLICY "select_own_cash" ON cash_balances FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = cash_balances.account_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_cash" ON cash_balances;
CREATE POLICY "insert_own_cash" ON cash_balances FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = cash_balances.account_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_cash" ON cash_balances;
CREATE POLICY "update_own_cash" ON cash_balances FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = cash_balances.account_id AND accounts.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = cash_balances.account_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_cash" ON cash_balances;
CREATE POLICY "delete_own_cash" ON cash_balances FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = cash_balances.account_id AND accounts.user_id = auth.uid())
  );

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity numeric(20,8) NOT NULL DEFAULT 0,
  average_cost numeric(20,4) NOT NULL DEFAULT 0,
  current_price numeric(20,4) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_holdings" ON holdings;
CREATE POLICY "select_own_holdings" ON holdings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = holdings.asset_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_holdings" ON holdings;
CREATE POLICY "insert_own_holdings" ON holdings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = holdings.asset_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_holdings" ON holdings;
CREATE POLICY "update_own_holdings" ON holdings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = holdings.asset_id AND accounts.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = holdings.asset_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_holdings" ON holdings;
CREATE POLICY "delete_own_holdings" ON holdings FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = holdings.asset_id AND accounts.user_id = auth.uid())
  );

-- Transactions table (source of truth)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('BUY','SELL','DEPOSIT','WITHDRAW','DIVIDEND','TRANSFER','SWAP','INTEREST','FEE','TAX')),
  quantity numeric(20,8),
  price numeric(20,4),
  amount numeric(20,2) NOT NULL DEFAULT 0,
  fee numeric(20,2) DEFAULT 0,
  tax numeric(20,2) DEFAULT 0,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  settlement_date date,
  status text NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING','COMPLETED','CANCELLED')),
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = transactions.account_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = transactions.account_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = transactions.account_id AND accounts.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = transactions.account_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = transactions.account_id AND accounts.user_id = auth.uid())
  );

-- Income records
CREATE TABLE IF NOT EXISTS income_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  income_type text NOT NULL CHECK (income_type IN ('DIVIDEND','INTEREST','DISTRIBUTION','YIELD','OTHER')),
  amount numeric(20,2) NOT NULL,
  income_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_income" ON income_records;
CREATE POLICY "select_own_income" ON income_records FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = income_records.asset_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_income" ON income_records;
CREATE POLICY "insert_own_income" ON income_records FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = income_records.asset_id AND accounts.user_id = auth.uid())
  );

-- Expense records
CREATE TABLE IF NOT EXISTS expense_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  expense_type text NOT NULL CHECK (expense_type IN ('TRADING_FEE','TAX','MANAGEMENT_FEE','OTHER')),
  amount numeric(20,2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_expenses" ON expense_records;
CREATE POLICY "select_own_expenses" ON expense_records FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = expense_records.asset_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_expenses" ON expense_records;
CREATE POLICY "insert_own_expenses" ON expense_records FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = expense_records.asset_id AND accounts.user_id = auth.uid())
  );

-- Price history
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  price numeric(20,4) NOT NULL,
  source text,
  recorded_at timestamptz DEFAULT now()
);
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_prices" ON price_history;
CREATE POLICY "select_own_prices" ON price_history FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = price_history.asset_id AND accounts.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_prices" ON price_history;
CREATE POLICY "insert_own_prices" ON price_history FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM assets JOIN accounts ON accounts.id = assets.account_id
           WHERE assets.id = price_history.asset_id AND accounts.user_id = auth.uid())
  );

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  module text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_audit" ON audit_logs;
CREATE POLICY "select_own_audit" ON audit_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_audit" ON audit_logs;
CREATE POLICY "insert_own_audit" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
CREATE POLICY "select_own_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
CREATE POLICY "insert_own_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_settings" ON user_settings;
CREATE POLICY "update_own_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_settings" ON user_settings;
CREATE POLICY "delete_own_settings" ON user_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_asset ON transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_account ON assets(account_id);
CREATE INDEX IF NOT EXISTS idx_holdings_asset ON holdings(asset_id);
CREATE INDEX IF NOT EXISTS idx_price_history_asset ON price_history(asset_id);
