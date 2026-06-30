import { apiClient, requestData } from './client';
import type {
  SpotSymbol,
  SpotTicker,
  SpotMarketItem,
  SpotSummary,
  SpotKline,
  SpotDepth,
  SpotTrade,
  SpotFavoriteStatus,
  SpotFavoriteItem,
  SpotMarketListParams,
  SpotKlineParams,
} from '../types/app';
import type { ApiResult } from './client';
import type { SpotOrderPayload } from '../lib/spot-order';

export type SpotTradeRuleConfig = {
  tradeType: 'SPOT' | 'FUTURES' | string;
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

export type SpotTradeConfig = {
  symbolId: number;
  symbolCode: string;
  symbolName: string;
  baseCoinCode: string;
  quoteCoinCode: string;
  spotEnabled: number;
  futuresEnabled: number;
  tradeStatus: number;
  priceIndexEnabled: number;
  spotTradable: boolean;
  futuresTradable: boolean;
  spotRule?: SpotTradeRuleConfig | null;
  futuresRule?: SpotTradeRuleConfig | null;
};

export type SpotOrderStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | number;

export type SpotOrder = {
  orderNo: string;
  symbolCode: string;
  symbolName?: string | null;
  side: 'BUY' | 'SELL' | string;
  orderType: 'LIMIT' | 'MARKET' | string;
  timeInForce?: string | null;
  price?: number | null;
  quantity?: number | null;
  quoteAmount?: number | null;
  executedQuantity?: number | null;
  executedQuoteAmount?: number | null;
  avgPrice?: number | null;
  feeCoinCode?: string | null;
  feeAmount?: number | null;
  frozenCoinCode?: string | null;
  frozenAmount?: number | null;
  orderStatus: SpotOrderStatus;
  cancelReason?: string | null;
  availableBalance?: number | null;
  frozenBalance?: number | null;
  submitTime?: string | null;
  finishTime?: string | null;
  lastFillTime?: string | null;
  createTime?: string | null;
};

export type SpotOrderHistoryParams = {
  page?: number;
  pageSize?: number;
  symbolCode?: string;
  orderStatus?: SpotOrderStatus;
};

export type PageResult<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type SpotCancelOrderPayload = {
  orderNo: string;
  remark?: string;
};

/**
 * 现货行情和自选相关 API
 */
export const spotApi = {
  // ============ 现货行情接口 ============

  /**
   * 查询现货交易对列表
   * 用于搜索功能
   */
  getSymbols: () => {
    return requestData(apiClient.get<ApiResult<SpotSymbol[]>>('/api/trade/spot/symbols'));
  },

  /**
   * 查询现货行情列表
   * 支持搜索、榜单、筛选、排序
   */
  getMarketList: (params?: SpotMarketListParams) => {
    return requestData(apiClient.get<ApiResult<SpotMarketItem[]>>('/api/trade/spot/market-list', { params }));
  },

  /**
   * 查询现货24小时行情（批量）
   * @param symbols 交易对列表，多个用英文逗号分隔，如 "BTCUSDT,ETHUSDT"
   */
  getTickers: (symbols?: string) => {
    return requestData(apiClient.get<ApiResult<SpotTicker[]>>('/api/trade/spot/tickers', { params: { symbols } }));
  },

  /**
   * 查询现货币对详情摘要
   * 包含行情、买一卖一、交易规则
   */
  getSummary: (symbol: string) => {
    return requestData(apiClient.get<ApiResult<SpotSummary>>('/api/trade/spot/summary', { params: { symbol } }));
  },

  /**
   * 查询现货K线
   */
  getKlines: (params: SpotKlineParams) => {
    return requestData(apiClient.get<ApiResult<SpotKline[]>>('/api/trade/spot/klines', { params }));
  },

  /**
   * 查询现货盘口深度
   */
  getDepth: (symbol: string, limit = 20) => {
    return requestData(apiClient.get<ApiResult<SpotDepth>>('/api/trade/spot/depth', { params: { symbol, limit } }));
  },

  /**
   * 查询现货最新成交
   */
  getTrades: (symbol: string, limit = 50) => {
    return requestData(apiClient.get<ApiResult<SpotTrade[]>>('/api/trade/spot/trades', { params: { symbol, limit } }));
  },

  /**
   * 查询现货交易规则
   */
  getExchangeInfo: (symbol: string) => {
    return requestData(
      apiClient.get<ApiResult<{
        symbol: string;
        status: string;
        baseAsset: string;
        quoteAsset: string;
        baseAssetPrecision: number;
        quoteAssetPrecision: number;
        quoteOrderQtyMarketAllowed: boolean;
        spotTradingAllowed: boolean;
        orderTypes: string[];
        minPrice: number;
        maxPrice: number;
        tickSize: number;
        minQty: number;
        maxQty: number;
        stepSize: number;
        minNotional: number;
      }>>('/api/trade/spot/exchange-info', { params: { symbol } }),
    );
  },

  /**
   * 查询交易对开关与手续费规则
   */
  getTradeConfig: (symbol: string) => {
    return requestData(apiClient.get<ApiResult<SpotTradeConfig>>('/api/trade/spot/trade-config', { params: { symbol } }));
  },

  /**
   * 提交现货订单
   */
  placeSpotOrder: (payload: SpotOrderPayload) => {
    return requestData(apiClient.post<ApiResult<SpotOrder>>('/api/trade/spot/order/place', payload));
  },

  /**
   * 撤销现货订单
   */
  cancelSpotOrder: (payload: SpotCancelOrderPayload) => {
    return requestData(apiClient.post<ApiResult<SpotOrder>>('/api/trade/spot/order/cancel', payload));
  },

  /**
   * 查询当前委托
   */
  getOpenOrders: (symbolCode?: string) => {
    return requestData(apiClient.get<ApiResult<SpotOrder[]>>('/api/trade/spot/order/open-orders', {
      params: symbolCode ? { symbolCode } : undefined,
    }));
  },

  /**
   * 查询历史委托
   */
  getOrderHistory: (params?: SpotOrderHistoryParams) => {
    return requestData(apiClient.get<ApiResult<PageResult<SpotOrder>>>('/api/trade/spot/order/history', {
      params: { page: 1, pageSize: 10, ...params },
    }));
  },

  /**
   * 查询单笔订单详情
   */
  getOrderDetail: (orderNo: string) => {
    return requestData(apiClient.get<ApiResult<SpotOrder>>('/api/trade/spot/order/detail', { params: { orderNo } }));
  },

  // ============ 现货自选接口 ============

  /**
   * 查询当前用户自选列表
   */
  getFavorites: () => {
    return requestData(apiClient.get<ApiResult<SpotFavoriteItem[]>>('/api/trade/spot/favorites'));
  },

  /**
   * 收藏现货交易对
   */
  addFavorite: (symbolCode: string) => {
    return requestData(apiClient.post<ApiResult<void>>('/api/trade/spot/favorites', { symbolCode }));
  },

  /**
   * 取消收藏现货交易对
   */
  removeFavorite: (symbolCode: string) => {
    return requestData(apiClient.delete<ApiResult<void>>(`/api/trade/spot/favorites/${symbolCode}`));
  },

  /**
   * 查询当前用户是否已收藏某个交易对
   */
  getFavoriteStatus: (symbolCode: string) => {
    return requestData(apiClient.get<ApiResult<SpotFavoriteStatus>>('/api/trade/spot/favorites/status', { params: { symbolCode } }));
  },
};
