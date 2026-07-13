import type { Transaction, Account, Asset } from './types';

// ─── Types ───────────────────────────────────────────────────

export interface TPlusCycle {
  id: string;
  asset_id: string;
  symbol: string;
  account_id: string;
  broker: string;
  buy_tx_id: string;
  sell_tx_id: string | null;
  buy_date: string;
  sell_date: string | null;
  buy_quantity: number;
  sell_quantity: number;
  buy_price: number;
  sell_price: number | null;
  buy_value: number;
  sell_value: number;
  gross_profit: number;
  fee: number;
  tax: number;
  net_profit: number;
  avg_cost_before: number;
  avg_cost_after: number;
  cost_reduced: number;
  cost_reduced_pct: number;
  remaining_quantity: number;
  remaining_unrealized_pnl: number;
  status: 'OPEN' | 'COMPLETED';
}

export interface OpenTPlusBuy {
  tx_id: string;
  asset_id: string;
  symbol: string;
  account_id: string;
  broker: string;
  buy_date: string;
  buy_quantity: number;
  buy_price: number;
  current_price: number;
  suggested_sell_price: number;
  expected_profit: number;
  expected_return_pct: number;
  capital_used: number;
  t_status: string;
}

export interface TPlusAssetAnalysis {
  asset_id: string;
  symbol: string;
  account_id: string;
  broker: string;
  asset_type: string;
  original_avg_cost: number;
  current_avg_cost: number;
  current_price: number;
  remaining_quantity: number;
  market_value: number;
  total_cost_reduction: number;
  total_cost_reduction_pct: number;
  total_tplus_profit: number;
  reinvested_tplus_profit: number;
  remaining_unrealized_loss: number;
  break_even_price: number;
  break_even_recovery_pct: number;
  profit_if_selling_today: number;
  suggested_sell_price: number;
  estimated_profit_at_suggested: number;
  visual_status: 'profitable' | 'near_break_even' | 'losing';
  completed_cycles: number;
  open_cycles: number;
  open_buys: OpenTPlusBuy[];
  cycles: TPlusCycle[];
}

export interface TPlusSummary {
  total_tplus_profit: number;
  total_cost_reduction: number;
  total_cost_reduction_value: number;
  completed_cycles: number;
  open_cycles: number;
  total_reinvested_profit: number;
  total_remaining_unrealized_loss: number;
  win_rate: number;
  avg_profit_per_cycle: number;
  largest_profit: number;
  largest_loss: number;
  analyses: TPlusAssetAnalysis[];
}

// ─── T+ Status ───────────────────────────────────────────────

export function tplusDayStatus(
  txDate: string,
  settlementDate: string | null,
  now: Date = new Date(),
): string {
  if (!settlementDate) return 'Completed';
  const buy = new Date(txDate);
  const settlement = new Date(settlementDate);
  if (now >= settlement) return 'Completed';

  const elapsed = Math.floor((now.getTime() - buy.getTime()) / (1000 * 60 * 60 * 24));
  if (elapsed <= 0) return 'T0';
  if (elapsed === 1) return 'T1';
  if (elapsed === 2) return 'T2';
  if (elapsed === 3) return 'T3';
  return `T${elapsed}`;
}

// ─── Core Engine ──────────────────────────────────────────────

const TPLUS_ASSET_TYPES = new Set(['STOCK', 'CRYPTO']);

export function computeTPlusCycles(
  transactions: Transaction[],
  assets: Asset[],
  accounts: Account[],
  holdings: { asset_id: string; quantity: number; average_cost: number; current_price: number }[],
): TPlusCycle[] {
  const assetMap = new Map(assets.map(a => [a.id, a]));
  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const holdingMap = new Map(holdings.map(h => [h.asset_id, h]));

  // Group BUY and SELL transactions by asset+account, sorted by date.
  // T+ matching is strictly isolated by account: VPS buys only match VPS sells,
  // SSI buys only match SSI sells, Crypto buys only match Crypto sells.
  const byAssetAccount = new Map<string, { buys: Transaction[]; sells: Transaction[]; account_id: string }>();

  for (const tx of transactions) {
    if (!tx.asset_id || !tx.account_id) continue;
    const asset = assetMap.get(tx.asset_id);
    if (!asset || !TPLUS_ASSET_TYPES.has(asset.asset_type)) continue;

    // Key by asset_id + account_id to enforce account isolation
    const key = `${tx.asset_id}::${tx.account_id}`;
    if (!byAssetAccount.has(key)) {
      byAssetAccount.set(key, { buys: [], sells: [], account_id: tx.account_id });
    }
    const group = byAssetAccount.get(key)!;
    if (tx.transaction_type === 'BUY') group.buys.push(tx);
    if (tx.transaction_type === 'SELL') group.sells.push(tx);
  }

  const cycles: TPlusCycle[] = [];

  for (const [key, { buys, sells, account_id: acctId }] of byAssetAccount) {
    const assetId = key.split('::')[0];
    const asset = assetMap.get(assetId)!;
    const account = accountMap.get(acctId);
    const holding = holdingMap.get(assetId);

    // Sort buys and sells by date
    buys.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
    sells.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));

    // Track running average cost
    let runningQty = 0;
    let runningCost = 0;
    let firstBuy = true;

    // Track which sells have been consumed
    const sellQueue = [...sells];
    let sellIdx = 0;

    for (const buyTx of buys) {
      const buyQty = buyTx.quantity || 0;
      const buyPrice = buyTx.price || 0;

      const avgCostBefore = runningQty > 0 ? runningCost / runningQty : 0;

      // Update running cost after this buy
      runningQty += buyQty;
      runningCost += buyQty * buyPrice;
      const avgCostAfter = runningQty > 0 ? runningCost / runningQty : 0;

      if (firstBuy && buyQty > 0) {
        firstBuy = false;
      }

      // Try to match this buy with sells (smart matching: most recent sell that fits)
      let remainingBuyQty = buyQty;

      while (remainingBuyQty > 0 && sellIdx < sellQueue.length) {
        const sellTx = sellQueue[sellIdx];
        const sellQty = sellTx.quantity || 0;
        const sellPrice = sellTx.price || 0;

        if (sellQty <= 0) {
          sellIdx++;
          continue;
        }

        const matchedQty = Math.min(remainingBuyQty, sellQty);
        const buyValue = matchedQty * buyPrice;
        const sellValue = matchedQty * sellPrice;
        const grossProfit = sellValue - buyValue;
        const fee = (sellTx.fee || 0) * (matchedQty / sellQty);
        const tax = (sellTx.tax || 0) * (matchedQty / sellQty);
        const netProfit = grossProfit - fee - tax;

        const costReduced = avgCostBefore > 0 ? avgCostBefore - avgCostAfter : 0;
        const costReducedPct = avgCostBefore > 0 ? (costReduced / avgCostBefore) * 100 : 0;

        // Remaining holding after this cycle
        const remainingAfter = runningQty - matchedQty;
        const currentPrice = holding?.current_price || avgCostAfter;
        const remainingUnrealized = remainingAfter > 0
          ? remainingAfter * (currentPrice - avgCostAfter)
          : 0;

        cycles.push({
          id: `${buyTx.id}-${sellTx.id}`,
          asset_id: assetId,
          symbol: asset.symbol,
          account_id: acctId,
          broker: account?.account_name || '',
          buy_tx_id: buyTx.id,
          sell_tx_id: sellTx.id,
          buy_date: buyTx.transaction_date,
          sell_date: sellTx.transaction_date,
          buy_quantity: buyQty,
          sell_quantity: matchedQty,
          buy_price: buyPrice,
          sell_price: sellPrice,
          buy_value: buyValue,
          sell_value: sellValue,
          gross_profit: grossProfit,
          fee,
          tax,
          net_profit: netProfit,
          avg_cost_before: avgCostBefore,
          avg_cost_after: avgCostAfter,
          cost_reduced: costReduced,
          cost_reduced_pct: costReducedPct,
          remaining_quantity: remainingAfter,
          remaining_unrealized_pnl: remainingUnrealized,
          status: 'COMPLETED',
        });

        remainingBuyQty -= matchedQty;

        // Partially consumed sell — reduce its quantity
        sellQueue[sellIdx] = { ...sellTx, quantity: sellQty - matchedQty };
        if (sellQueue[sellIdx].quantity! <= 0) {
          sellIdx++;
        }
      }

      // If there's remaining buy quantity with no matching sell, it's an open cycle
      if (remainingBuyQty > 0) {
        const currentPrice = holding?.current_price || avgCostAfter;
        const remainingAfter = runningQty;
        const remainingUnrealized = remainingAfter > 0
          ? remainingAfter * (currentPrice - avgCostAfter)
          : 0;

        cycles.push({
          id: `${buyTx.id}-open`,
          asset_id: assetId,
          symbol: asset.symbol,
          account_id: acctId,
          broker: account?.account_name || '',
          buy_tx_id: buyTx.id,
          sell_tx_id: null,
          buy_date: buyTx.transaction_date,
          sell_date: null,
          buy_quantity: remainingBuyQty,
          sell_quantity: 0,
          buy_price: buyPrice,
          sell_price: null,
          buy_value: remainingBuyQty * buyPrice,
          sell_value: 0,
          gross_profit: 0,
          fee: 0,
          tax: 0,
          net_profit: 0,
          avg_cost_before: avgCostBefore,
          avg_cost_after: avgCostAfter,
          cost_reduced: avgCostBefore > 0 ? avgCostBefore - avgCostAfter : 0,
          cost_reduced_pct: avgCostBefore > 0 ? ((avgCostBefore - avgCostAfter) / avgCostBefore) * 100 : 0,
          remaining_quantity: remainingAfter,
          remaining_unrealized_pnl: remainingUnrealized,
          status: 'OPEN',
        });
      }
    }
  }

  return cycles;
}

// ─── Asset-level Analysis ─────────────────────────────────────

export function computeTPlusAnalysis(
  transactions: Transaction[],
  assets: Asset[],
  accounts: Account[],
  holdings: { asset_id: string; quantity: number; average_cost: number; current_price: number }[],
): TPlusAssetAnalysis[] {
  const cycles = computeTPlusCycles(transactions, assets, accounts, holdings);
  const assetMap = new Map(assets.map(a => [a.id, a]));
  const accountMap = new Map(accounts.map(a => [a.id, a]));
  const holdingMap = new Map(holdings.map(h => [h.asset_id, h]));

  // Group cycles by asset+account (account-isolated)
  const byAssetAcct = new Map<string, TPlusCycle[]>();
  for (const c of cycles) {
    const key = `${c.asset_id}::${c.account_id}`;
    if (!byAssetAcct.has(key)) byAssetAcct.set(key, []);
    byAssetAcct.get(key)!.push(c);
  }

  const analyses: TPlusAssetAnalysis[] = [];

  for (const [key, assetCycles] of byAssetAcct) {
    const [assetId, acctId] = key.split('::');
    const asset = assetMap.get(assetId)!;
    const account = accountMap.get(acctId);
    const holding = holdingMap.get(assetId);
    if (!holding) continue;

    // Compute original average cost from the first BUY transaction
    const buyTxs = transactions
      .filter(t => t.asset_id === assetId && t.transaction_type === 'BUY')
      .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));

    // Original average cost = weighted average of all initial buys before any sell
    const firstBuyTx = buyTxs[0];
    const originalAvgCost = firstBuyTx?.price || holding.average_cost;

    const currentAvgCost = holding.average_cost;
    const currentPrice = holding.current_price;
    const remainingQty = holding.quantity;

    const totalCostReduction = Math.max(0, originalAvgCost - currentAvgCost);
    const totalCostReductionPct = originalAvgCost > 0 ? (totalCostReduction / originalAvgCost) * 100 : 0;

    const completedCycles = assetCycles.filter(c => c.status === 'COMPLETED');
    const openCycles = assetCycles.filter(c => c.status === 'OPEN');

    const totalTPlusProfit = completedCycles.reduce((s, c) => s + c.net_profit, 0);

    const reinvestedTPlusProfit = totalTPlusProfit;

    const remainingUnrealizedLoss = remainingQty * (currentPrice - currentAvgCost);

    const breakEvenPrice = currentAvgCost;
    const breakEvenRecoveryPct = originalAvgCost > 0
      ? Math.max(0, ((originalAvgCost - currentAvgCost) / originalAvgCost) * 100)
      : 0;

    const estimatedFee = remainingQty * currentPrice * 0.0015;
    const profitIfSelling = remainingQty * (currentPrice - currentAvgCost) - estimatedFee;

    // Suggested sell price: Stock = buy_price * 1.03, Crypto = buy_price * 1.05
    const targetMultiplier = asset.asset_type === 'CRYPTO' ? 1.05 : 1.03;

    // Compute open T+ buys (BUY transactions with no matching SELL)
    const openBuys: OpenTPlusBuy[] = [];
    for (const c of openCycles) {
      const buyTx = transactions.find(t => t.id === c.buy_tx_id);
      if (!buyTx) continue;
      const buyPrice = c.buy_price;
      const suggestedSell = buyPrice * targetMultiplier;
      const expectedProfit = c.buy_quantity * (suggestedSell - buyPrice);
      const expectedReturnPct = ((suggestedSell - buyPrice) / buyPrice) * 100;
      openBuys.push({
        tx_id: buyTx.id,
        asset_id: assetId,
        symbol: asset.symbol,
        account_id: asset.account_id,
        broker: account?.account_name || '',
        buy_date: c.buy_date,
        buy_quantity: c.buy_quantity,
        buy_price: buyPrice,
        current_price: currentPrice,
        suggested_sell_price: suggestedSell,
        expected_profit: expectedProfit,
        expected_return_pct: expectedReturnPct,
        capital_used: c.buy_value,
        t_status: tplusDayStatus(buyTx.transaction_date, buyTx.settlement_date || null),
      });
    }

    // Suggested sell price for the asset card: use most recent open buy
    const latestOpenBuy = openBuys[0];
    const cardSuggestedSell = latestOpenBuy
      ? latestOpenBuy.suggested_sell_price
      : currentAvgCost * targetMultiplier;
    const cardEstimatedProfit = latestOpenBuy
      ? latestOpenBuy.expected_profit
      : remainingQty * (cardSuggestedSell - currentAvgCost);

    // Visual status: profitable / near_break_even / losing
    const priceVsCostPct = currentAvgCost > 0
      ? ((currentPrice - currentAvgCost) / currentAvgCost) * 100
      : 0;
    const visualStatus: 'profitable' | 'near_break_even' | 'losing' =
      priceVsCostPct > 2 ? 'profitable'
      : priceVsCostPct >= -2 ? 'near_break_even'
      : 'losing';

    analyses.push({
      asset_id: assetId,
      symbol: asset.symbol,
      account_id: asset.account_id,
      broker: account?.account_name || '',
      asset_type: asset.asset_type,
      original_avg_cost: originalAvgCost,
      current_avg_cost: currentAvgCost,
      current_price: currentPrice,
      remaining_quantity: remainingQty,
      market_value: remainingQty * currentPrice,
      total_cost_reduction: totalCostReduction,
      total_cost_reduction_pct: totalCostReductionPct,
      total_tplus_profit: totalTPlusProfit,
      reinvested_tplus_profit: reinvestedTPlusProfit,
      remaining_unrealized_loss: remainingUnrealizedLoss,
      break_even_price: breakEvenPrice,
      break_even_recovery_pct: breakEvenRecoveryPct,
      profit_if_selling_today: profitIfSelling,
      suggested_sell_price: cardSuggestedSell,
      estimated_profit_at_suggested: cardEstimatedProfit,
      visual_status: visualStatus,
      completed_cycles: completedCycles.length,
      open_cycles: openCycles.length,
      open_buys: openBuys,
      cycles: assetCycles,
    });
  }

  return analyses;
}

// ─── Summary ──────────────────────────────────────────────────

export function computeTPlusSummary(
  transactions: Transaction[],
  assets: Asset[],
  accounts: Account[],
  holdings: { asset_id: string; quantity: number; average_cost: number; current_price: number }[],
): TPlusSummary {
  const analyses = computeTPlusAnalysis(transactions, assets, accounts, holdings);
  const allCycles = analyses.flatMap(a => a.cycles);
  const completedCycles = allCycles.filter(c => c.status === 'COMPLETED');
  const openCycles = allCycles.filter(c => c.status === 'OPEN');

  const totalTPlusProfit = completedCycles.reduce((s, c) => s + c.net_profit, 0);
  const totalCostReduction = analyses.reduce((s, a) => s + a.total_cost_reduction, 0);
  const totalCostReductionValue = analyses.reduce((s, a) => s + a.total_cost_reduction * a.remaining_quantity, 0);
  const totalReinvested = analyses.reduce((s, a) => s + a.reinvested_tplus_profit, 0);
  const totalRemainingLoss = analyses.reduce((s, a) => s + a.remaining_unrealized_loss, 0);

  const profits = completedCycles.map(c => c.net_profit);
  const wins = profits.filter(p => p > 0);
  const winRate = completedCycles.length > 0 ? (wins.length / completedCycles.length) * 100 : 0;
  const avgProfit = completedCycles.length > 0 ? totalTPlusProfit / completedCycles.length : 0;
  const largestProfit = profits.length > 0 ? Math.max(...profits) : 0;
  const largestLoss = profits.length > 0 ? Math.min(...profits) : 0;

  return {
    total_tplus_profit: totalTPlusProfit,
    total_cost_reduction: totalCostReduction,
    total_cost_reduction_value: totalCostReductionValue,
    completed_cycles: completedCycles.length,
    open_cycles: openCycles.length,
    total_reinvested_profit: totalReinvested,
    total_remaining_unrealized_loss: totalRemainingLoss,
    win_rate: winRate,
    avg_profit_per_cycle: avgProfit,
    largest_profit: largestProfit,
    largest_loss: largestLoss,
    analyses,
  };
}
