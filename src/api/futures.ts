import { apiClient, requestData } from './client';
import type { ApiResult } from './client';
import type {
  FuturesDepth,
  FuturesKline,
  FuturesKlineParams,
  FuturesMarketItem,
  FuturesMarketListParams,
  FuturesMarkPrice,
  FuturesSummary,
  FuturesSymbol,
  FuturesTrade,
} from '../types/app';

export type FuturesTradeRuleConfig = {
  tradeType: 'FUTURES' | string;
  ruleStatus: number;
  platformCode: string;
  platformSymbolCode: string;
  contractType?: string | null;
  marginCoinCode?: string | null;
  settleCoinCode?: string | null;
  pricePrecision: number;
  qtyPrecision: number;
  amountPrecision: number;
  minPrice: number;
  maxPrice: number;
  tickSize: number;
  minQty: number;
  maxQty: number;
  stepSize: number;
  minNotional: number;
  makerFeeRate: number;
  takerFeeRate: number;
  defaultLeverage?: number | null;
  minLeverage?: number | null;
  maxLeverage?: number | null;
  fundingIntervalHours?: number | null;
};

export type FuturesTradeConfig = {
  symbolId: number;
  symbolCode: string;
  symbolName: string;
  baseCoinCode: string;
  quoteCoinCode: string;
  futuresEnabled: number;
  tradeStatus: number;
  priceIndexEnabled: number;
  futuresTradable: boolean;
  futuresRule?: FuturesTradeRuleConfig | null;
};

export const futuresApi = {
  getSymbols: () => {
    return requestData(apiClient.post<ApiResult<FuturesSymbol[]>>('/api/trade/futures/market/symbols'));
  },

  getMarketList: (params?: FuturesMarketListParams) => {
    return requestData(apiClient.post<ApiResult<FuturesMarketItem[]>>('/api/trade/futures/market/market-list', params ?? {}));
  },

  getSummary: (symbol: string) => {
    return requestData(apiClient.post<ApiResult<FuturesSummary>>('/api/trade/futures/market/summary', { symbol }));
  },

  getMarkPrice: (symbol: string) => {
    return requestData(apiClient.post<ApiResult<FuturesMarkPrice>>('/api/trade/futures/market/mark-price', { symbol }));
  },

  getKlines: (params: FuturesKlineParams) => {
    return requestData(apiClient.post<ApiResult<FuturesKline[]>>('/api/trade/futures/market/klines', params));
  },

  getDepth: (symbol: string, limit = 20) => {
    return requestData(apiClient.post<ApiResult<FuturesDepth>>('/api/trade/futures/market/depth', { symbol, limit }));
  },

  getTrades: (symbol: string, limit = 50) => {
    return requestData(apiClient.post<ApiResult<FuturesTrade[]>>('/api/trade/futures/market/trades', { symbol, limit }));
  },

  getTradeConfig: (symbol: string) => {
    return requestData(apiClient.post<ApiResult<FuturesTradeConfig>>('/api/trade/futures/market/trade-config', { symbol }));
  },
};
