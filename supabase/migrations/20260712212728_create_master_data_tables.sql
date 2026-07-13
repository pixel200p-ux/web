/*
# Create Master Data tables

1. New Tables
- `master_stock_symbols` — user-defined stock symbols (symbol, name, category, sort_order)
- `master_crypto_coins` — user-defined crypto coin symbols (symbol, name, category)
- `master_banks` — user-defined bank names (bank_code, bank_name)
- `master_deposit_terms` — user-defined deposit terms (label, months_value, is_custom)
- `master_trading_fees` — user-defined trading fee rates (label, rate_pct, is_default)

2. Security
- All tables are owner-scoped (user_id NOT NULL DEFAULT auth.uid())
- RLS enabled on every table
- 4 CRUD policies per table, scoped TO authenticated with auth.uid() = user_id

3. Important Notes
- All tables use gen_random_uuid() for primary keys
- created_at defaults to now()
- is_default/is_custom flags allow distinguishing system defaults from user additions
- sort_order on stock symbols allows alphabetical ordering
*/

-- Stock Symbols
CREATE TABLE IF NOT EXISTS master_stock_symbols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  name text,
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE master_stock_symbols ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_stock_symbols" ON master_stock_symbols;
CREATE POLICY "select_own_stock_symbols" ON master_stock_symbols FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_stock_symbols" ON master_stock_symbols;
CREATE POLICY "insert_own_stock_symbols" ON master_stock_symbols FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_stock_symbols" ON master_stock_symbols;
CREATE POLICY "update_own_stock_symbols" ON master_stock_symbols FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_stock_symbols" ON master_stock_symbols;
CREATE POLICY "delete_own_stock_symbols" ON master_stock_symbols FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Crypto Coins
CREATE TABLE IF NOT EXISTS master_crypto_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  name text,
  category text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE master_crypto_coins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_crypto_coins" ON master_crypto_coins;
CREATE POLICY "select_own_crypto_coins" ON master_crypto_coins FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_crypto_coins" ON master_crypto_coins;
CREATE POLICY "insert_own_crypto_coins" ON master_crypto_coins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_crypto_coins" ON master_crypto_coins;
CREATE POLICY "update_own_crypto_coins" ON master_crypto_coins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_crypto_coins" ON master_crypto_coins;
CREATE POLICY "delete_own_crypto_coins" ON master_crypto_coins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Banks
CREATE TABLE IF NOT EXISTS master_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_code text NOT NULL,
  bank_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE master_banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_banks" ON master_banks;
CREATE POLICY "select_own_banks" ON master_banks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_banks" ON master_banks;
CREATE POLICY "insert_own_banks" ON master_banks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_banks" ON master_banks;
CREATE POLICY "update_own_banks" ON master_banks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_banks" ON master_banks;
CREATE POLICY "delete_own_banks" ON master_banks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Deposit Terms
CREATE TABLE IF NOT EXISTS master_deposit_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  months_value integer NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE master_deposit_terms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_deposit_terms" ON master_deposit_terms;
CREATE POLICY "select_own_deposit_terms" ON master_deposit_terms FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_deposit_terms" ON master_deposit_terms;
CREATE POLICY "insert_own_deposit_terms" ON master_deposit_terms FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_deposit_terms" ON master_deposit_terms;
CREATE POLICY "update_own_deposit_terms" ON master_deposit_terms FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_deposit_terms" ON master_deposit_terms;
CREATE POLICY "delete_own_deposit_terms" ON master_deposit_terms FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trading Fees
CREATE TABLE IF NOT EXISTS master_trading_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  rate_pct numeric NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE master_trading_fees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_trading_fees" ON master_trading_fees;
CREATE POLICY "select_own_trading_fees" ON master_trading_fees FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_trading_fees" ON master_trading_fees;
CREATE POLICY "insert_own_trading_fees" ON master_trading_fees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_trading_fees" ON master_trading_fees;
CREATE POLICY "update_own_trading_fees" ON master_trading_fees FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_trading_fees" ON master_trading_fees;
CREATE POLICY "delete_own_trading_fees" ON master_trading_fees FOR DELETE TO authenticated USING (auth.uid() = user_id);
