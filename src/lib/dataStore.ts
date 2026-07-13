import {
  mockAccounts, mockAssets, mockCashBalances, mockHoldings,
  mockTransactions, mockIncomes, mockExpenses, USD_TO_VND,
} from '../engine/mockData';
import {
  computeHoldings, computePortfolioSummary, netDepositFromTransactions,
} from '../engine/calc';
import type { PortfolioSummary, ComputedHolding } from '../engine/calc';
import { computeTPlusSummary } from '../engine/tplus';
import type { TPlusSummary } from '../engine/tplus';
import type {
  Account, Asset, CashBalance, Transaction,
  IncomeRecord, ExpenseRecord, TargetAllocation,
} from '../engine/types';
import { mockTargetAllocation } from '../engine/mockData';

/**
 * Data store for the trial version.
 * Uses mock data instead of realtime Supabase queries.
 * When realtime is enabled, these functions will be replaced with
 * live Supabase subscriptions.
 */

export interface PortfolioData {
  accounts: Account[];
  assets: Asset[];
  cashBalances: CashBalance[];
  holdings: ComputedHolding[];
  transactions: Transaction[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  summary: PortfolioSummary;
  targetAllocation: TargetAllocation;
  tplusSummary: TPlusSummary;
}

export function loadMockData(): PortfolioData {
  const accounts = mockAccounts;
  const assets = mockAssets;
  const cashBalances = mockCashBalances;
  const rawHoldings = mockHoldings;
  const transactions = mockTransactions;
  const incomes = mockIncomes;
  const expenses = mockExpenses;

  // First pass: compute total portfolio value to calculate weights
  const totalCash = cashBalances.reduce((s, c) => {
    if (c.currency === 'USDT') return s + c.available_cash * USD_TO_VND;
    return s + c.available_cash;
  }, 0);

  // Convert crypto holdings to VND for unified portfolio view
  const preliminaryHoldings = rawHoldings.map(h => {
    const asset = assets.find(a => a.id === h.asset_id);
    const isCrypto = asset?.currency === 'USDT';
    const price = isCrypto ? h.current_price * USD_TO_VND : h.current_price;
    const cost = isCrypto ? h.average_cost * USD_TO_VND : h.average_cost;
    return { ...h, current_price: price, average_cost: cost };
  });

  const totalHoldingValue = preliminaryHoldings
    .filter(h => h.quantity > 0)
    .reduce((s, h) => s + h.quantity * h.current_price, 0);

  const totalPortfolio = totalCash + totalHoldingValue;

  const computedHoldings = computeHoldings(
    preliminaryHoldings,
    assets,
    accounts,
    transactions,
    totalPortfolio,
  );

  // Convert crypto cash to VND for summary
  const convertedCashBalances = cashBalances.map(c => ({
    ...c,
    available_cash: c.currency === 'USDT' ? c.available_cash * USD_TO_VND : c.available_cash,
  }));

  const netDeposit = netDepositFromTransactions(transactions);
  const summary = computePortfolioSummary(
    convertedCashBalances,
    computedHoldings,
    incomes,
    expenses,
    netDeposit,
  );

  const tplusSummary = computeTPlusSummary(
    transactions,
    assets,
    accounts,
    computedHoldings.map(h => ({
      asset_id: h.asset_id,
      quantity: h.quantity,
      average_cost: h.average_cost,
      current_price: h.current_price,
    })),
  );

  return {
    accounts,
    assets,
    cashBalances,
    holdings: computedHoldings,
    transactions,
    incomes,
    expenses,
    summary,
    targetAllocation: mockTargetAllocation,
    tplusSummary,
  };
}

export function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
