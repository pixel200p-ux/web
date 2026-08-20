import { recalculate } from '../engine/portfolioEngine';
import type { PortfolioData } from './dataStore';

export async function loadPortfolio(): Promise<PortfolioData> {
  try {
    const data = await recalculate();
    // Validate that we have minimum required data
    if (!data || !data.accounts) {
      console.error('⚠️ Portfolio data incomplete, returning empty state:', data);
      // Return empty portfolio structure instead of crashing
      return {
        accounts: [],
        assets: [],
        cashBalances: [],
        holdings: [],
        transactions: [],
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
          allocation: {},
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
    return data;
  } catch (err: any) {
    console.error('❌ Fatal error loading portfolio:', err);
    // Return empty portfolio on error rather than crashing the UI
    return {
      accounts: [],
      assets: [],
      cashBalances: [],
      holdings: [],
      transactions: [],
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
        allocation: {},
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
}

