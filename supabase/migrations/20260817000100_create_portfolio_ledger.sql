-- Additive portfolio ledger. This migration intentionally does not alter the
-- malformed historical migration or drop any existing production object.
create table if not exists portfolio_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_name text not null,
  account_type text not null check (account_type in ('UNALLOCATED','STOCK','CRYPTO','ETF','DCDS','BANK')),
  broker text,
  currency text not null default 'VND',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, account_name)
);
create table if not exists portfolio_assets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references portfolio_accounts(id) on delete restrict,
  asset_type text not null check (asset_type in ('STOCK','CRYPTO','ETF','FUND','BANK_DEPOSIT')),
  symbol text not null, name text, currency text not null default 'VND', status text not null default 'ACTIVE',
  current_price numeric, price_source text, price_updated_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (account_id, symbol)
);
create table if not exists portfolio_transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid references portfolio_accounts(id) on delete restrict, asset_id uuid references portfolio_assets(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('BUY','SELL','DEPOSIT','WITHDRAW','DIVIDEND','TRANSFER','INTEREST','FEE','TAX')),
  transaction_date timestamptz not null, quantity numeric, price numeric, amount numeric not null default 0,
  fee numeric not null default 0, tax numeric not null default 0, other_charge numeric not null default 0,
  trade_tplus boolean not null default false, from_account_id uuid references portfolio_accounts(id) on delete restrict,
  to_account_id uuid references portfolio_accounts(id) on delete restrict, status text not null default 'COMPLETED', notes text,
  deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((transaction_type = 'TRANSFER' and from_account_id is not null and to_account_id is not null and from_account_id <> to_account_id) or transaction_type <> 'TRANSFER')
);
create table if not exists imported_positions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  asset_id uuid not null references portfolio_assets(id) on delete cascade, quantity numeric not null check (quantity > 0), original_cost numeric not null check (original_cost >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists tplus_cycles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  asset_id uuid not null references portfolio_assets(id) on delete restrict, account_id uuid not null references portfolio_accounts(id) on delete restrict,
  buy_transaction_id uuid not null unique references portfolio_transactions(id) on delete restrict, buy_quantity numeric not null check (buy_quantity > 0), buy_price numeric not null,
  status text not null default 'OPEN' check (status in ('OPEN','PARTIAL','COMPLETED')), cost_before numeric not null default 0, cost_after numeric not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists tplus_cycle_allocations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cycle_id uuid not null references tplus_cycles(id) on delete cascade, sell_transaction_id uuid not null references portfolio_transactions(id) on delete restrict,
  allocated_quantity numeric not null check (allocated_quantity > 0), sell_price numeric not null, allocated_buy_fee numeric not null default 0,
  allocated_sell_fee numeric not null default 0, allocated_tax numeric not null default 0, allocated_other_charge numeric not null default 0,
  created_at timestamptz not null default now(), unique (cycle_id, sell_transaction_id)
);
create table if not exists fee_tax_settings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  profile text not null check (profile in ('STOCK_VPS','STOCK_SSI','CRYPTO')), buy_fee_rate numeric not null default 0, sell_fee_rate numeric not null default 0,
  tax_rate numeric not null default 0, other_charge_rate numeric not null default 0, updated_at timestamptz not null default now(), unique (user_id, profile)
);
create table if not exists bank_deposits (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  transaction_id uuid not null unique references portfolio_transactions(id) on delete restrict, asset_id uuid not null references portfolio_assets(id) on delete restrict,
  source_account_id uuid not null references portfolio_accounts(id) on delete restrict, principal numeric not null check (principal > 0), start_date date not null,
  term_months integer not null check (term_months > 0), initial_rate numeric not null check (initial_rate >= 0), renewal_count integer not null default 0,
  status text not null default 'ACTIVE', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists bank_renewal_periods (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bank_deposit_id uuid not null references bank_deposits(id) on delete cascade, period_number integer not null, start_date date not null, maturity_date date not null,
  principal_at_start numeric not null, interest_rate numeric not null, rate_confirmed boolean not null default true, fallback_rate boolean not null default false,
  interest_earned numeric not null default 0, principal_at_maturity numeric not null default 0, status text not null default 'ACTIVE', created_at timestamptz not null default now(),
  unique (bank_deposit_id, period_number)
);
create index if not exists portfolio_transactions_active_date_idx on portfolio_transactions(user_id, transaction_date) where deleted_at is null;
create index if not exists portfolio_assets_account_idx on portfolio_assets(account_id);
create index if not exists tplus_cycles_open_idx on tplus_cycles(account_id, asset_id) where status <> 'COMPLETED';
create index if not exists bank_renewal_maturity_idx on bank_renewal_periods(maturity_date);

alter table portfolio_accounts enable row level security; alter table portfolio_assets enable row level security; alter table portfolio_transactions enable row level security;
alter table imported_positions enable row level security; alter table tplus_cycles enable row level security; alter table tplus_cycle_allocations enable row level security;
alter table fee_tax_settings enable row level security; alter table bank_deposits enable row level security; alter table bank_renewal_periods enable row level security;
do $$ declare t text; begin foreach t in array array['portfolio_accounts','portfolio_assets','portfolio_transactions','imported_positions','tplus_cycles','tplus_cycle_allocations','fee_tax_settings','bank_deposits','bank_renewal_periods'] loop
  execute format('drop policy if exists own_rows on %I', t); execute format('create policy own_rows on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
end loop; end $$;
