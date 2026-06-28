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
