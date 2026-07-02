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
import type { FuturesPlaceOrderPayload, FuturesTradeAction } from '../lib/futures-order';

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

export type FuturesOrderStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | number;

export type FuturesOrder = {
  orderNo: string;
  symbolCode: string;
  symbolName?: string | null;
  tradeAction: FuturesTradeAction | string;
  side: 'BUY' | 'SELL' | string;
  positionSide: 'LONG' | 'SHORT' | string;
  marginMode?: 'ISOLATED' | string | null;
  orderType: 'LIMIT' | 'MARKET' | string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | null;
  leverage?: number | null;
  price?: number | null;
  quantity?: number | null;
  executedQuantity?: number | null;
  avgPrice?: number | null;
  frozenMargin?: number | null;
  feeAmount?: number | null;
  realizedPnl?: number | null;
  orderStatus: FuturesOrderStatus;
  cancelReason?: string | null;
  submitTime?: string | null;
  finishTime?: string | null;
  lastFillTime?: string | null;
  createTime?: string | null;
};

export type FuturesPosition = {
  positionNo: string;
  symbolCode: string;
  symbolName?: string | null;
  positionSide: 'LONG' | 'SHORT' | string;
  marginMode?: 'ISOLATED' | string | null;
  leverage?: number | null;
  positionQty?: number | null;
  availableQty?: number | null;
  openAvgPrice?: number | null;
  positionMargin?: number | null;
  maintenanceMargin?: number | null;
  liquidationPrice?: number | null;
  bankruptcyPrice?: number | null;
  lastMarkPrice?: number | null;
  unrealizedPnl?: number | null;
  riskStatus?: number | null;
  lastSyncTime?: string | null;
  lastRiskCheckTime?: string | null;
};

export type FuturesPlaceOrderResponse = {
  orderNo: string;
  symbolCode: string;
  tradeAction: FuturesTradeAction | string;
  side: 'BUY' | 'SELL' | string;
  positionSide: 'LONG' | 'SHORT' | string;
  orderType: 'LIMIT' | 'MARKET' | string;
  leverage?: number | null;
  orderStatus: FuturesOrderStatus;
  frozenMargin?: number | null;
  availableBalance?: number | null;
  frozenBalance?: number | null;
  marginBalance?: number | null;
  liquidationPrice?: number | null;
  submitTime?: string | null;
};

export type FuturesOrderHistoryParams = {
  page?: number;
  pageSize?: number;
  symbolCode?: string;
  orderStatus?: FuturesOrderStatus;
};

export type FuturesCancelOrderPayload = {
  orderNo: string;
  remark?: string;
};

export type PageResult<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
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

  getPositions: (symbolCode?: string) => {
    return requestData(apiClient.post<ApiResult<FuturesPosition[]>>('/api/trade/futures/order/positions', {
      ...(symbolCode ? { symbolCode } : {}),
    }));
  },

  placeFuturesOrder: (payload: FuturesPlaceOrderPayload) => {
    return requestData(apiClient.post<ApiResult<FuturesPlaceOrderResponse>>('/api/trade/futures/order/place', payload));
  },

  cancelFuturesOrder: (payload: FuturesCancelOrderPayload) => {
    return requestData(apiClient.post<ApiResult<FuturesOrder>>('/api/trade/futures/order/cancel', payload));
  },

  getOpenOrders: (symbolCode?: string) => {
    return requestData(apiClient.post<ApiResult<FuturesOrder[]>>('/api/trade/futures/order/open-orders', {
      ...(symbolCode ? { symbolCode } : {}),
    }));
  },

  getOrderHistory: (params?: FuturesOrderHistoryParams) => {
    return requestData(apiClient.post<ApiResult<PageResult<FuturesOrder>>>('/api/trade/futures/order/history', {
      page: 1,
      pageSize: 10,
      ...params,
    }));
  },

  getOrderDetail: (orderNo: string) => {
    return requestData(apiClient.post<ApiResult<FuturesOrder>>('/api/trade/futures/order/detail', { orderNo }));
  },
};
