import type {
  Transaction, Holding, CashBalance, Account, Asset,
  IncomeRecord, ExpenseRecord,
} from './types';

/**
 * Calculation Engine — shared core that all UI modules use.
 * No UI code calls financial formulas directly; everything goes through here.
 *
 * Architecture: Transaction → Engine → State → Dashboard
 */

// ─── Cash Engine ──────────────────────────────────────────────

export function cashBalance(
  prevCash: number,
  transactions: Transaction[],
  accountId: string,
): number {
  let balance = prevCash;
  for (const tx of transactions) {
    if (tx.account_id !== accountId) continue;
    switch (tx.transaction_type) {
      case 'DEPOSIT':
      case 'SELL':
      case 'DIVIDEND':
      case 'INTEREST':
        balance += tx.amount - (tx.fee || 0) - (tx.tax || 0);
        break;
      case 'WITHDRAW':
      case 'BUY':
      case 'FEE':
      case 'TAX':
        balance -= tx.amount + (tx.fee || 0) + (tx.tax || 0);
        break;
      case 'TRANSFER':
        // handled by caller based on direction
        break;
    }
  }
  return balance;
}

export function availableCash(cash: CashBalance): number {
  return cash.available_cash;
}

export function pendingCash(cash: CashBalance): number {
  return cash.pending_cash;
}

export function buyingPower(cash: CashBalance): number {
  return cash.available_cash;
}

export function cashAllocation(
  cashValue: number,
  totalPortfolioAsset: number,
): number {
  if (totalPortfolioAsset === 0) return 0;
  return (cashValue / totalPortfolioAsset) * 100;
}

// ─── Transaction Engine ───────────────────────────────────────

export function transactionValue(
  quantity: number | undefined,
  price: number | undefined,
): number {
  if (!quantity || !price) return 0;
  return quantity * price;
}

export function transactionCost(fee: number, tax: number): number {
  return (fee || 0) + (tax || 0);
}

export function totalBuyAmount(
  quantity: number,
  price: number,
  fee: number,
  tax: number,
): number {
  return transactionValue(quantity, price) + transactionCost(fee, tax);
}

export function netSellAmount(
  quantity: number,
  price: number,
  fee: number,
  tax: number,
): number {
  return transactionValue(quantity, price) - transactionCost(fee, tax);
}

// ─── Holding Engine ───────────────────────────────────────────

export function endingQuantity(
  beginQty: number,
  buyQty: number,
  sellQty: number,
  transferIn = 0,
  transferOut = 0,
): number {
  return beginQty + buyQty - sellQty + transferIn - transferOut;
}

export function averageCostAfterBuy(
  prevQty: number,
  prevCost: number,
  buyQty: number,
  buyPrice: number,
): number {
  const newQty = prevQty + buyQty;
  if (newQty === 0) return 0;
  return (prevQty * prevCost + buyQty * buyPrice) / newQty;
}

export function holdingCost(quantity: number, avgCost: number): number {
  return quantity * avgCost;
}

export function marketValue(quantity: number, currentPrice: number): number {
  return quantity * currentPrice;
}

export function unrealizedPnL(
  quantity: number,
  currentPrice: number,
  avgCost: number,
): number {
  return quantity * (currentPrice - avgCost);
}

export function unrealizedReturnPct(
  quantity: number,
  currentPrice: number,
  avgCost: number,
): number {
  const cost = holdingCost(quantity, avgCost);
  if (cost === 0) return 0;
  return (unrealizedPnL(quantity, currentPrice, avgCost) / cost) * 100;
}

export function holdingStatus(
  currentQty: number,
  originalQty: number,
): 'OPEN' | 'PARTIAL' | 'CLOSED' {
  if (currentQty <= 0) return 'CLOSED';
  if (currentQty < originalQty) return 'PARTIAL';
  return 'OPEN';
}

// ─── Cost Engine ──────────────────────────────────────────────

export function appCostAfterBuy(
  prevQty: number,
  prevAppCost: number,
  buyQty: number,
  buyPrice: number,
): number {
  return averageCostAfterBuy(prevQty, prevAppCost, buyQty, buyPrice);
}

export function appCostAfterSell(prevAppCost: number): number {
  return prevAppCost;
}

export function realCost(
  prevRealCost: number,
  buyCashOutflow: number,
  sellQty: number,
  prevQty: number,
): number {
  if (prevQty === 0) return buyCashOutflow;
  const recoveredCost = (sellQty * prevRealCost) / prevQty;
  return prevRealCost + buyCashOutflow - recoveredCost;
}

export function costRecovery(
  prevRealCost: number,
  remainingRealCost: number,
): number {
  return prevRealCost - remainingRealCost;
}

export function remainingCost(
  currentQty: number,
  currentRealCost: number,
): number {
  if (currentQty === 0) return 0;
  return currentRealCost;
}

export function costPerUnit(realCost: number, quantity: number): number {
  if (quantity === 0) return 0;
  return realCost / quantity;
}

// ─── P/L Engine ───────────────────────────────────────────────

export function realizedPnL(
  netSell: number,
  recoveredCost: number,
): number {
  return netSell - recoveredCost;
}

export function totalPnL(realized: number, unrealized: number): number {
  return realized + unrealized;
}

export function dailyPnL(
  currentPortfolioValue: number,
  prevPortfolioValue: number,
): number {
  return currentPortfolioValue - prevPortfolioValue;
}

export function periodPnL(
  endValue: number,
  beginValue: number,
  netCashAdded: number,
): number {
  return endValue - beginValue - netCashAdded;
}

export function totalReturnPct(
  totalProfitLoss: number,
  netDeposit: number,
): number {
  if (netDeposit === 0) return 0;
  return (totalProfitLoss / netDeposit) * 100;
}

// ─── Asset Valuation Engine ───────────────────────────────────

export function assetValue(
  cashBalance: number,
  holdingMarketValue: number,
): number {
  return cashBalance + holdingMarketValue;
}

export function categoryAssetValue(assetValues: number[]): number {
  return assetValues.reduce((sum, v) => sum + v, 0);
}

export function accountAssetValue(assetValues: number[]): number {
  return assetValues.reduce((sum, v) => sum + v, 0);
}

export function portfolioAssetValue(categoryValues: number[]): number {
  return categoryValues.reduce((sum, v) => sum + v, 0);
}

export function convertedAssetValue(
  assetValue: number,
  exchangeRate: number,
): number {
  return assetValue * exchangeRate;
}

// ─── Performance Engine ───────────────────────────────────────

export function assetGrowth(
  endValue: number,
  beginValue: number,
): number {
  return endValue - beginValue;
}

export function returnPct(
  profitLoss: number,
  capitalBase: number,
): number {
  if (capitalBase === 0) return 0;
  return (profitLoss / capitalBase) * 100;
}

export function periodReturnPct(
  endValue: number,
  beginValue: number,
): number {
  if (beginValue === 0) return 0;
  return ((endValue - beginValue) / beginValue) * 100;
}

export function portfolioAlpha(
  portfolioReturn: number,
  benchmarkReturn: number,
): number {
  return portfolioReturn - benchmarkReturn;
}

// ─── Allocation Engine ────────────────────────────────────────

export function assetAllocation(
  assetValue: number,
  totalPortfolio: number,
): number {
  if (totalPortfolio === 0) return 0;
  return (assetValue / totalPortfolio) * 100;
}

export function targetDeviation(
  currentAllocation: number,
  targetAllocation: number,
): number {
  return currentAllocation - targetAllocation;
}

export function deviationValue(
  portfolioValue: number,
  targetPct: number,
  currentValue: number,
): number {
  const targetValue = portfolioValue * (targetPct / 100);
  return targetValue - currentValue;
}

export function rebalanceAmount(
  targetValue: number,
  currentValue: number,
): number {
  return targetValue - currentValue;
}

export function rebalanceThreshold(
  deviation: number,
  threshold: number,
): boolean {
  return Math.abs(deviation) >= threshold;
}

export function dcaPriorityScore(
  targetAllocation: number,
  currentAllocation: number,
): number {
  return targetAllocation - currentAllocation;
}

// ─── Income Engine ─────────────────────────────────────────────

export function dividendIncome(
  dividendPerShare: number,
  holdingQty: number,
): number {
  return dividendPerShare * holdingQty;
}

export function netDividend(
  grossDividend: number,
  tax: number,
  fee: number,
): number {
  return grossDividend - tax - fee;
}

export function interestIncome(
  principal: number,
  rate: number,
  time: number,
): number {
  return principal * rate * time;
}

export function dailyInterest(
  balance: number,
  annualRate: number,
): number {
  return (balance * annualRate) / 365;
}

export function distributionIncome(
  distPerUnit: number,
  holdingUnits: number,
): number {
  return distPerUnit * holdingUnits;
}

export function passiveIncome(incomes: number[]): number {
  return incomes.reduce((sum, v) => sum + v, 0);
}

export function incomeYield(
  annualIncome: number,
  assetValue: number,
): number {
  if (assetValue === 0) return 0;
  return (annualIncome / assetValue) * 100;
}

// ─── Expense Engine ────────────────────────────────────────────

export function tradingFee(
  transactionValue: number,
  feeRate: number,
): number {
  return transactionValue * feeRate;
}

export function transactionTax(
  taxBase: number,
  taxRate: number,
): number {
  return taxBase * taxRate;
}

export function managementFee(
  assetValue: number,
  annualRate: number,
  holdingTimeYears: number,
): number {
  return assetValue * annualRate * holdingTimeYears;
}

export function totalExpense(expenses: number[]): number {
  return expenses.reduce((sum, v) => sum + v, 0);
}

export function expenseRatio(
  annualExpense: number,
  avgAssetValue: number,
): number {
  if (avgAssetValue === 0) return 0;
  return (annualExpense / avgAssetValue) * 100;
}

export function netPnL(grossPnL: number, totalExpense: number): number {
  return grossPnL - totalExpense;
}

// ─── T+ Engine ────────────────────────────────────────────────

export function pendingSettlement(
  sellTransactionsValue: number,
  settledAmount: number,
): number {
  return sellTransactionsValue - settledAmount;
}

export function availableSettlementCash(
  settledSellAmount: number,
  existingCash: number,
): number {
  return settledSellAmount + existingCash;
}

export function settlementDate(
  transactionDate: Date,
  settlementPeriod: number,
): Date {
  const d = new Date(transactionDate);
  d.setDate(d.getDate() + settlementPeriod);
  return d;
}

export function tplusStatus(
  current: Date,
  settlement: Date,
): 'PENDING' | 'COMPLETED' {
  return current < settlement ? 'PENDING' : 'COMPLETED';
}

export function tplusBuyingPower(
  availableCash: number,
  availableSettlement: number,
  reservedCash: number,
): number {
  return availableCash + availableSettlement - reservedCash;
}

// ─── Portfolio Engine ─────────────────────────────────────────

export function netWorth(totalAsset: number, totalLiability: number): number {
  return totalAsset - totalLiability;
}

export function portfolioGrowth(
  currentValue: number,
  prevValue: number,
): number {
  return currentValue - prevValue;
}

export function portfolioGrowthPct(
  currentValue: number,
  prevValue: number,
): number {
  if (prevValue === 0) return 0;
  return ((currentValue - prevValue) / prevValue) * 100;
}

export function portfolioHealthScore(
  allocationScore: number,
  cashScore: number,
  diversificationScore: number,
  performanceScore: number,
): number {
  return (
    allocationScore * 0.3 +
    cashScore * 0.2 +
    diversificationScore * 0.2 +
    performanceScore * 0.3
  );
}

// ─── Simulator Engine ─────────────────────────────────────────

export function dcaFutureValue(
  monthlyDca: number,
  monthlyRate: number,
  months: number,
): number {
  if (monthlyRate === 0) return monthlyDca * months;
  return monthlyDca * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

export function futureAssetValue(
  currentAsset: number,
  annualRate: number,
  years: number,
  monthlyContribution = 0,
): number {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  const growth = currentAsset * Math.pow(1 + annualRate, years);
  const dca = dcaFutureValue(monthlyContribution, monthlyRate, months);
  return growth + dca;
}

export function stressTestImpact(
  assetWeight: number,
  priceChangePct: number,
): number {
  return assetWeight * priceChangePct;
}

export function portfolioStressResult(
  assets: { weight: number; shockPct: number }[],
): number {
  return assets.reduce((sum, a) => sum + stressTestImpact(a.weight, a.shockPct), 0);
}

// ─── Aggregation Helpers ──────────────────────────────────────

export interface ComputedHolding {
  asset_id: string;
  symbol: string;
  name: string;
  asset_type: string;
  account_id: string;
  account_name: string;
  quantity: number;
  settled_quantity: number;
  pending_quantity: number;
  average_cost: number;
  original_avg_cost: number;
  current_price: number;
  market_value: number;
  holding_cost: number;
  unrealized_pnl: number;
  unrealized_return_pct: number;
  realized_pnl: number;
  status: 'OPEN' | 'PARTIAL' | 'CLOSED';
  weight: number;
  maturity_date: string | null;
  remaining_days: number | null;
}

export function computeHoldings(
  holdings: Holding[],
  assets: Asset[],
  accounts: Account[],
  transactions: Transaction[],
  totalPortfolioValue: number,
): ComputedHolding[] {
  const assetMap = new Map(assets.map(a => [a.id, a]));
  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const now = new Date();

  return holdings
    .filter(h => h.quantity > 0)
    .map(h => {
      const asset = assetMap.get(h.asset_id);
      const account = asset ? accountMap.get(asset.account_id) : undefined;
      const mv = marketValue(h.quantity, h.current_price);
      const hc = holdingCost(h.quantity, h.average_cost);
      const upnl = unrealizedPnL(h.quantity, h.current_price, h.average_cost);

      // Original average cost: weighted average of all BUY transactions before any SELL
      const assetBuyTxsForOriginal = transactions
        .filter(t => t.asset_id === h.asset_id && t.transaction_type === 'BUY')
        .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
      const firstSellTx = transactions
        .filter(t => t.asset_id === h.asset_id && t.transaction_type === 'SELL')
        .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date))[0];

      let originalQty = 0;
      let originalCostSum = 0;
      for (const tx of assetBuyTxsForOriginal) {
        if (firstSellTx && tx.transaction_date > firstSellTx.transaction_date) break;
        const q = tx.quantity || 0;
        const p = tx.price || 0;
        originalQty += q;
        originalCostSum += q * p;
      }
      const originalAvgCost = originalQty > 0 ? originalCostSum / originalQty : h.average_cost;

      // T+ settlement: compute settled vs pending quantity from buy transactions
      const assetBuyTxs = transactions
        .filter(t => t.asset_id === h.asset_id && t.transaction_type === 'BUY')
        .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));

      let settledQty = 0;
      let pendingQty = 0;
      for (const tx of assetBuyTxs) {
        const txQty = tx.quantity || 0;
        if (tx.status === 'COMPLETED') {
          settledQty += txQty;
        } else if (tx.status === 'PENDING' && tx.settlement_date) {
          const settlement = new Date(tx.settlement_date);
          if (now >= settlement) {
            settledQty += txQty;
          } else {
            pendingQty += txQty;
          }
        }
      }

      // For bank deposits, maturity date from settlement_date
      let maturityDate: string | null = null;
      let remainingDays: number | null = null;
      if (asset?.asset_type === 'BANK_DEPOSIT') {
        const bankTx = transactions.find(
          t => t.asset_id === h.asset_id && t.settlement_date,
        );
        if (bankTx?.settlement_date) {
          maturityDate = bankTx.settlement_date;
          const maturity = new Date(maturityDate);
          const diff = Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          remainingDays = Math.max(0, diff);
        }
      }

      // realized P/L from sell transactions for this asset — only settled sells
      const assetTxs = transactions.filter(
        t => t.asset_id === h.asset_id && t.transaction_type === 'SELL' && t.status === 'COMPLETED',
      );
      let realized = 0;
      for (const tx of assetTxs) {
        const sellSettlement = tx.settlement_date ? new Date(tx.settlement_date) : null;
        if (sellSettlement && now < sellSettlement) continue; // sell not yet settled
        const netSell = netSellAmount(tx.quantity || 0, tx.price || 0, tx.fee, tx.tax);
        const recovered = (tx.quantity || 0) * h.average_cost;
        realized += realizedPnL(netSell, recovered);
      }

      return {
        asset_id: h.asset_id,
        symbol: asset?.symbol || 'UNKNOWN',
        name: asset?.name || asset?.symbol || '',
        asset_type: asset?.asset_type || 'STOCK',
        account_id: asset?.account_id || '',
        account_name: account?.account_name || '',
        quantity: h.quantity,
        settled_quantity: settledQty,
        pending_quantity: pendingQty,
        average_cost: h.average_cost,
        original_avg_cost: originalAvgCost,
        current_price: h.current_price,
        market_value: mv,
        holding_cost: hc,
        unrealized_pnl: upnl,
        unrealized_return_pct: unrealizedReturnPct(h.quantity, h.current_price, h.average_cost),
        realized_pnl: realized,
        status: holdingStatus(h.quantity, h.quantity),
        weight: assetAllocation(mv, totalPortfolioValue),
        maturity_date: maturityDate,
        remaining_days: remainingDays,
      };
    });
}

export interface PortfolioSummary {
  totalAsset: number;
  totalCash: number;
  totalHoldingValue: number;
  totalUnrealizedPnL: number;
  totalRealizedPnL: number;
  totalPnL: number;
  totalReturnPct: number;
  totalIncome: number;
  totalExpense: number;
  netPnL: number;
  categoryBreakdown: Record<string, number>;
  allocation: Record<string, number>;
}

export function computePortfolioSummary(
  cashBalances: CashBalance[],
  computedHoldings: ComputedHolding[],
  incomes: IncomeRecord[],
  expenses: ExpenseRecord[],
  netDeposit: number,
): PortfolioSummary {
  const totalCash = cashBalances.reduce((sum, c) => sum + c.available_cash, 0);
  const totalHoldingValue = computedHoldings.reduce((sum, h) => sum + h.market_value, 0);
  const totalAsset = totalCash + totalHoldingValue;
  const totalUnrealizedPnL = computedHoldings.reduce((sum, h) => sum + h.unrealized_pnl, 0);
  const totalRealizedPnL = computedHoldings.reduce((sum, h) => sum + h.realized_pnl, 0);
  const totalPnLVal = totalPnL(totalRealizedPnL, totalUnrealizedPnL);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryBreakdown: Record<string, number> = {};
  for (const h of computedHoldings) {
    categoryBreakdown[h.asset_type] = (categoryBreakdown[h.asset_type] || 0) + h.market_value;
  }
  categoryBreakdown['CASH'] = totalCash;

  const allocation: Record<string, number> = {};
  for (const [cat, val] of Object.entries(categoryBreakdown)) {
    allocation[cat] = assetAllocation(val, totalAsset);
  }

  return {
    totalAsset,
    totalCash,
    totalHoldingValue,
    totalUnrealizedPnL,
    totalRealizedPnL,
    totalPnL: totalPnLVal,
    totalReturnPct: totalReturnPct(totalPnLVal, netDeposit),
    totalIncome,
    totalExpense,
    netPnL: netPnL(totalPnLVal, totalExpense),
    categoryBreakdown,
    allocation,
  };
}

export function netDepositFromTransactions(transactions: Transaction[]): number {
  let deposit = 0;
  let withdraw = 0;
  for (const tx of transactions) {
    if (tx.transaction_type === 'DEPOSIT') deposit += tx.amount;
    if (tx.transaction_type === 'WITHDRAW') withdraw += tx.amount;
  }
  return deposit - withdraw;
}
