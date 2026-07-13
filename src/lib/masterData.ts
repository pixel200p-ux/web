import { supabase } from './supabase';

export interface StockSymbol {
  id: string;
  symbol: string;
  name: string | null;
  category: string | null;
  sort_order: number;
}

export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string | null;
  category: string | null;
}

export interface BankEntry {
  id: string;
  bank_code: string;
  bank_name: string | null;
}

export interface DepositTerm {
  id: string;
  label: string;
  months_value: number;
  is_custom: boolean;
}

export interface TradingFee {
  id: string;
  label: string;
  rate_pct: number;
  is_default: boolean;
}

const DEFAULT_STOCKS = [
  { symbol: 'AAA', name: 'An Phat Bioplastics', category: 'Industrial' },
  { symbol: 'ACB', name: 'Asia Commercial Bank', category: 'Banking' },
  { symbol: 'FPT', name: 'FPT Corporation', category: 'Technology' },
  { symbol: 'MBB', name: 'MB Bank', category: 'Banking' },
  { symbol: 'VCI', name: 'Vietcap', category: 'Securities' },
  { symbol: 'VNM', name: 'Vinamilk', category: 'Consumer' },
  { symbol: 'POW', name: 'PV Power', category: 'Energy' },
];

const DEFAULT_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', category: 'Major' },
  { symbol: 'ETH', name: 'Ethereum', category: 'Major' },
  { symbol: 'SOL', name: 'Solana', category: 'L1' },
  { symbol: 'BNB', name: 'BNB', category: 'Exchange' },
  { symbol: 'XRP', name: 'Ripple', category: 'Payment' },
  { symbol: 'ADA', name: 'Cardano', category: 'L1' },
  { symbol: 'DOGE', name: 'Dogecoin', category: 'Meme' },
];

const DEFAULT_BANKS = [
  { bank_code: 'VCB', bank_name: 'Vietcombank' },
  { bank_code: 'BIDV', bank_name: 'Bank for Investment & Development' },
  { bank_code: 'CTG', bank_name: 'VietinBank' },
  { bank_code: 'AGR', bank_name: 'Agribank' },
  { bank_code: 'TCB', bank_name: 'Techcombank' },
  { bank_code: 'MB', bank_name: 'MB Bank' },
  { bank_code: 'ACB', bank_name: 'Asia Commercial Bank' },
  { bank_code: 'VPB', bank_name: 'VPBank' },
];

const DEFAULT_DEPOSIT_TERMS = [
  { label: '1 Month', months_value: 1, is_custom: false },
  { label: '3 Months', months_value: 3, is_custom: false },
  { label: '6 Months', months_value: 6, is_custom: false },
  { label: '12 Months', months_value: 12, is_custom: false },
  { label: '24 Months', months_value: 24, is_custom: false },
  { label: '36 Months', months_value: 36, is_custom: false },
];

const DEFAULT_TRADING_FEES = [
  { label: '0%', rate_pct: 0, is_default: true },
  { label: '0.10%', rate_pct: 0.10, is_default: true },
  { label: '0.25%', rate_pct: 0.25, is_default: true },
];

async function seedIfEmpty() {
  const { data: stocks } = await supabase.from('master_stock_symbols').select('id').limit(1);
  if (!stocks || stocks.length === 0) {
    await supabase.from('master_stock_symbols').insert(
      DEFAULT_STOCKS.map((s, i) => ({ ...s, sort_order: i })),
    );
  }
  const { data: coins } = await supabase.from('master_crypto_coins').select('id').limit(1);
  if (!coins || coins.length === 0) {
    await supabase.from('master_crypto_coins').insert(DEFAULT_CRYPTOS);
  }
  const { data: banks } = await supabase.from('master_banks').select('id').limit(1);
  if (!banks || banks.length === 0) {
    await supabase.from('master_banks').insert(DEFAULT_BANKS);
  }
  const { data: terms } = await supabase.from('master_deposit_terms').select('id').limit(1);
  if (!terms || terms.length === 0) {
    await supabase.from('master_deposit_terms').insert(DEFAULT_DEPOSIT_TERMS);
  }
  const { data: fees } = await supabase.from('master_trading_fees').select('id').limit(1);
  if (!fees || fees.length === 0) {
    await supabase.from('master_trading_fees').insert(DEFAULT_TRADING_FEES);
  }
}

export async function loadMasterData() {
  await seedIfEmpty();
  const [stocks, coins, banks, terms, fees] = await Promise.all([
    supabase.from('master_stock_symbols').select('*').order('symbol', { ascending: true }),
    supabase.from('master_crypto_coins').select('*').order('symbol', { ascending: true }),
    supabase.from('master_banks').select('*').order('bank_code', { ascending: true }),
    supabase.from('master_deposit_terms').select('*').order('months_value', { ascending: true }),
    supabase.from('master_trading_fees').select('*').order('rate_pct', { ascending: true }),
  ]);
  return {
    stocks: (stocks.data || []) as StockSymbol[],
    cryptos: (coins.data || []) as CryptoCoin[],
    banks: (banks.data || []) as BankEntry[],
    depositTerms: (terms.data || []) as DepositTerm[],
    tradingFees: (fees.data || []) as TradingFee[],
  };
}

export type MasterData = Awaited<ReturnType<typeof loadMasterData>>;

export const masterDataApi = {
  async addStock(symbol: string, name?: string, category?: string) {
    const { data, error } = await supabase
      .from('master_stock_symbols')
      .insert({ symbol: symbol.toUpperCase(), name, category, sort_order: 0 })
      .select()
      .single();
    if (error) throw error;
    return data as StockSymbol;
  },
  async renameStock(id: string, symbol: string, name?: string) {
    const { data, error } = await supabase
      .from('master_stock_symbols')
      .update({ symbol: symbol.toUpperCase(), name })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as StockSymbol;
  },
  async deleteStock(id: string) {
    const { error } = await supabase.from('master_stock_symbols').delete().eq('id', id);
    if (error) throw error;
  },
  async resetStocks() {
    await supabase.from('master_stock_symbols').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('master_stock_symbols').insert(
      DEFAULT_STOCKS.map((s, i) => ({ ...s, sort_order: i })),
    );
  },

  async addCrypto(symbol: string, name?: string, category?: string) {
    const { data, error } = await supabase
      .from('master_crypto_coins')
      .insert({ symbol: symbol.toUpperCase(), name, category })
      .select()
      .single();
    if (error) throw error;
    return data as CryptoCoin;
  },
  async deleteCrypto(id: string) {
    const { error } = await supabase.from('master_crypto_coins').delete().eq('id', id);
    if (error) throw error;
  },
  async resetCryptos() {
    await supabase.from('master_crypto_coins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('master_crypto_coins').insert(DEFAULT_CRYPTOS);
  },

  async addBank(bank_code: string, bank_name?: string) {
    const { data, error } = await supabase
      .from('master_banks')
      .insert({ bank_code: bank_code.toUpperCase(), bank_name })
      .select()
      .single();
    if (error) throw error;
    return data as BankEntry;
  },
  async deleteBank(id: string) {
    const { error } = await supabase.from('master_banks').delete().eq('id', id);
    if (error) throw error;
  },
  async resetBanks() {
    await supabase.from('master_banks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('master_banks').insert(DEFAULT_BANKS);
  },

  async addDepositTerm(label: string, months_value: number) {
    const { data, error } = await supabase
      .from('master_deposit_terms')
      .insert({ label, months_value, is_custom: true })
      .select()
      .single();
    if (error) throw error;
    return data as DepositTerm;
  },
  async deleteDepositTerm(id: string) {
    const { error } = await supabase.from('master_deposit_terms').delete().eq('id', id);
    if (error) throw error;
  },
  async resetDepositTerms() {
    await supabase.from('master_deposit_terms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('master_deposit_terms').insert(DEFAULT_DEPOSIT_TERMS);
  },

  async addTradingFee(label: string, rate_pct: number) {
    const { data, error } = await supabase
      .from('master_trading_fees')
      .insert({ label, rate_pct, is_default: false })
      .select()
      .single();
    if (error) throw error;
    return data as TradingFee;
  },
  async updateTradingFee(id: string, label: string, rate_pct: number) {
    const { data, error } = await supabase
      .from('master_trading_fees')
      .update({ label, rate_pct })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TradingFee;
  },
  async deleteTradingFee(id: string) {
    const { error } = await supabase.from('master_trading_fees').delete().eq('id', id);
    if (error) throw error;
  },
  async resetTradingFees() {
    await supabase.from('master_trading_fees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('master_trading_fees').insert(DEFAULT_TRADING_FEES);
  },
};
