export interface MarketPriceResult {
  symbol: string;
  price: number;
  updated_at: string;
}

const TIMEOUT_MS = 10000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Tra cứu giá thị trường cổ phiếu từ TCBS Public API
 */
export async function fetchStockPrice(symbol: string): Promise<MarketPriceResult> {
  const baseUrl = import.meta.env.VITE_TCBS_API_URL || 'https://apipub.tcbs.com.vn/stock-insight/v1/stock/second-tc-price';
  const url = `${baseUrl}?tickers=${symbol.toUpperCase()}`;
  const now = new Date().toISOString();

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    
    // Format TCBS trả về mảng [{ ticker: "HPG", price: 28000, ... }] hoặc object data
    const item = Array.isArray(data) ? data.find((d: Record<string, unknown>) => d.ticker === symbol.toUpperCase()) : data;
    const price = item?.price || item?.c || item?.closePrice || 0;

    return {
      symbol: symbol.toUpperCase(),
      price: Number(price) || 0,
      updated_at: now,
    };
  } catch (err) {
    console.warn(`[marketDataService] Failed to fetch stock price for ${symbol}:`, err);
    return { symbol: symbol.toUpperCase(), price: 0, updated_at: now };
  }
}

/**
 * Tra cứu giá NAV/CCQ quỹ DCDS / ETF từ FMarket Public API
 */
export async function fetchFundPrice(fundCode: string): Promise<MarketPriceResult> {
  const url = import.meta.env.VITE_FMARKET_API_URL || 'https://api.fmarket.vn/res/products/filter';
  const now = new Date().toISOString();

  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        types: ['NEW_FUND'],
        searchField: fundCode.toUpperCase(),
        pageSize: 10,
        page: 1,
      }),
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    const rows = data?.data?.rows || data?.rows || [];
    const fund = rows.find((r: Record<string, unknown>) => String(r.code || r.shortName).toUpperCase() === fundCode.toUpperCase());
    const nav = fund?.nav || fund?.currentNAV || fund?.price || 0;

    return {
      symbol: fundCode.toUpperCase(),
      price: Number(nav) || 0,
      updated_at: now,
    };
  } catch (err) {
    console.warn(`[marketDataService] Failed to fetch fund price for ${fundCode}:`, err);
    return { symbol: fundCode.toUpperCase(), price: 0, updated_at: now };
  }
}

/**
 * Tra cứu giá Crypto từ CoinGecko API
 */
export async function fetchCryptoPrice(coinId: string): Promise<MarketPriceResult> {
  const apiKey = import.meta.env.VITE_COINGECKO_API_KEY;
  const baseUrl = 'https://api.coingecko.com/api/v3/simple/price';
  const headerParam = apiKey ? `&x_cg_demo_api_key=${apiKey}` : '';
  const url = `${baseUrl}?ids=${coinId.toLowerCase()}&vs_currencies=usd,vnd${headerParam}`;
  const now = new Date().toISOString();

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    const priceVnd = data?.[coinId.toLowerCase()]?.vnd || data?.[coinId.toLowerCase()]?.usd || 0;

    return {
      symbol: coinId.toUpperCase(),
      price: Number(priceVnd) || 0,
      updated_at: now,
    };
  } catch (err) {
    console.warn(`[marketDataService] Failed to fetch crypto price for ${coinId}:`, err);
    return { symbol: coinId.toUpperCase(), price: 0, updated_at: now };
  }
}

/**
 * Tra cứu Tỷ giá USD/VND từ ExchangeRate API
 */
export async function fetchExchangeRate(): Promise<MarketPriceResult> {
  const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY || 'latest';
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
  const now = new Date().toISOString();

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    const rate = data?.conversion_rates?.VND || 25450;

    return {
      symbol: 'USD/VND',
      price: Number(rate) || 25450,
      updated_at: now,
    };
  } catch (err) {
    console.warn('[marketDataService] Failed to fetch USD/VND exchange rate:', err);
    // Fallback USD rate standard
    return { symbol: 'USD/VND', price: 25450, updated_at: now };
  }
}
