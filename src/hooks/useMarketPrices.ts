import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchStockPrice,
  fetchFundPrice,
  fetchCryptoPrice,
  fetchExchangeRate,
  type MarketPriceResult,
} from '../services/marketDataService';
import { showToast } from '../components/Toast';

export interface MarketPriceMap {
  [symbol: string]: number;
}

export function useMarketPrices() {
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  /**
   * Cập nhật tất cả giá thị trường cho danh sách các asset truyền vào
   */
  const refreshAllPrices = useCallback(async (symbols: { symbol: string; type: string; id: string }[]) => {
    setUpdating(true);
    try {
      const results: MarketPriceResult[] = [];

      // 1. Cập nhật tỷ giá USD/VND
      const usdRate = await fetchExchangeRate();
      results.push(usdRate);

      // 2. Duyệt từng tài sản để tra cứu giá tương ứng
      for (const item of symbols) {
        if (!item.symbol) continue;
        let priceResult: MarketPriceResult | null = null;

        if (item.type === 'STOCK') {
          priceResult = await fetchStockPrice(item.symbol);
        } else if (item.type === 'ETF' || item.type === 'FUND') {
          priceResult = await fetchFundPrice(item.symbol);
        } else if (item.type === 'CRYPTO') {
          priceResult = await fetchCryptoPrice(item.symbol);
        }

        if (priceResult && priceResult.price > 0) {
          results.push(priceResult);

          // Cập nhật trực tiếp current_price vào portfolio_assets
          await supabase
            .from('portfolio_assets')
            .update({
              current_price: priceResult.price,
              price_updated_at: priceResult.updated_at,
              price_source: 'LIVE_API',
            })
            .eq('id', item.id);
        }
      }

      // 3. Upsert vào bảng market_prices cache nếu có
      for (const r of results) {
        await supabase
          .from('market_prices')
          .upsert({
            symbol: r.symbol,
            price_vnd: r.price,
            updated_at: r.updated_at,
          }, { onConflict: 'symbol' })
          .catch(() => {
            // silent if table does not exist yet
          });
      }

      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(nowStr);
      showToast(`Đã cập nhật giá thị trường thành công (${nowStr})`, 'success');
      return results;
    } catch (err) {
      console.error('Lỗi khi cập nhật giá thị trường:', err);
      showToast('Cập nhật giá thất bại, vui lòng kiểm tra kết nối', 'error');
      return [];
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updating,
    lastUpdated,
    refreshAllPrices,
  };
}
