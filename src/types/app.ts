export type Tab = 'home' | 'market' | 'trade' | 'profile';

export type TradeMode = 'spot' | 'contract';

export type MarketPairView = {
  symbol: string;
  base: string;
  quote: string;
  price: string;
  fiat: string;
  change: number | null;
  volume: string;
  iconColor: string;
};

// ============ 现货行情相关类型 ============

/**
 * 现货交易对信息
 */
export type SpotSymbol = {
  symbolId: number;
  symbolCode: string;
  symbolName: string;
  baseCoinCode: string;
  quoteCoinCode: string;
  displaySort: number;
};

/**
 * 现货24小时行情
 */
export type SpotTicker = {
  symbol: string;
  lastPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  priceChangePercent: number;
};

/**
 * 现货行情列表项（交易对+行情）
 */
export type SpotMarketItem = {
  symbolId: number;
  symbolCode: string;
  symbolName: string;
  baseCoinCode: string;
  quoteCoinCode: string;
  displaySort: number;
  lastPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  priceChangePercent: number;
};

/**
 * 现货币对详情摘要
 */
export type SpotSummary = {
  symbolId: number;
  symbolCode: string;
  symbolName: string;
  baseCoinCode: string;
  quoteCoinCode: string;
  tradeStatus: string;
  lastPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  priceChangePercent: number;
  bestBidPrice: number;
  bestBidQuantity: number;
  bestAskPrice: number;
  bestAskQuantity: number;
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
  tickSize: number;
  minQty: number;
  stepSize: number;
  minNotional: number;
  spotTradingAllowed: boolean;
};

/**
 * 现货K线数据
 */
export type SpotKline = {
  symbol: string;
  interval: string;
  openTime: number;
  closeTime: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  quoteVolume: number;
  tradeCount: number;
  takerBuyVolume: number;
  takerBuyQuoteVolume: number;
  closed: boolean;
};

/**
 * 现货盘口深度
 */
export type SpotDepth = {
  symbol: string;
  lastUpdateId: number;
  bids: SpotDepthLevel[];
  asks: SpotDepthLevel[];
};

export type SpotDepthLevel = {
  price: number;
  quantity: number;
};

/**
 * 现货最近成交
 */
export type SpotTrade = {
  tradeId: number;
  price: number;
  quantity: number;
  quoteQuantity: number;
  tradeTime: number;
  buyerMaker: boolean;
  bestMatch: boolean;
};

/**
 * 现货自选状态
 */
export type SpotFavoriteStatus = {
  symbolCode: string;
  favorited: boolean;
};

/**
 * 现货自选列表项（包含行情）
 */
export type SpotFavoriteItem = {
  symbolId: number;
  symbolCode: string;
  symbolName: string;
  baseCoinCode: string;
  quoteCoinCode: string;
  displaySort: number;
  lastPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  priceChangePercent: number;
  favorited: boolean;
  favoriteSort: number;
  favoriteTime: string;
};

// ============ API 请求参数类型 ============

export type SpotMarketListParams = {
  keyword?: string;
  tab?: 'ALL' | 'HOT' | 'GAINERS' | 'LOSERS' | 'NEW';
  direction?: 'UP' | 'DOWN';
  sortBy?: 'displaySort' | 'priceChangePercent' | 'quoteVolume' | 'lastPrice' | 'createTime';
  sortDirection?: 'ASC' | 'DESC';
  limit?: number;
};

export type SpotKlineParams = {
  symbol: string;
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
  startTime?: number;
  endTime?: number;
  limit?: number;
};

// ============ 合约公开行情相关类型 ============

export type FuturesSymbol = {
  symbolId: number;
  symbolCode: string;
  symbolName: string;
  baseCoinCode: string;
  quoteCoinCode: string;
  displaySort: number;
};

export type FuturesMarketItem = {
  symbolId: number;
  symbolCode: string;
  symbolName: string;
  baseCoinCode: string;
  quoteCoinCode: string;
  displaySort: number;
  lastPrice: number | null;
  markPrice: number | null;
  indexPrice: number | null;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  volume: number | null;
  quoteVolume: number | null;
  priceChangePercent: number | null;
  lastFundingRate: number | null;
  nextFundingTime: number | null;
};

export type FuturesSummary = {
  symbolId: number;
  symbolCode: string;
  symbolName: string;
  baseCoinCode: string;
  quoteCoinCode: string;
  futuresEnabled: number;
  tradeStatus: number;
  priceIndexEnabled: number;
  lastPrice: number | null;
  markPrice: number | null;
  indexPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  volume: number | null;
  quoteVolume: number | null;
  priceChangePercent: number | null;
  bestBidPrice: number | null;
  bestBidQuantity: number | null;
  bestAskPrice: number | null;
  bestAskQuantity: number | null;
  lastFundingRate: number | null;
  nextFundingTime: number | null;
  tickSize: number;
  minQty: number;
  stepSize: number;
  minNotional: number;
  defaultLeverage: number | null;
  minLeverage: number | null;
  maxLeverage: number | null;
};

export type FuturesMarkPrice = {
  symbolCode: string;
  markPrice: number | null;
  indexPrice: number | null;
  estimatedSettlePrice: number | null;
  lastFundingRate: number | null;
  nextFundingTime: number | null;
  eventTime: number | null;
};

export type FuturesKline = SpotKline;

export type FuturesDepth = {
  symbol: string;
  lastUpdateId: number;
  bids: FuturesDepthLevel[];
  asks: FuturesDepthLevel[];
};

export type FuturesDepthLevel = SpotDepthLevel;

export type FuturesTrade = {
  tradeId: number;
  price: number;
  quantity: number;
  quoteQuantity: number;
  tradeTime: number;
  buyerMaker: boolean;
  bestMatch: boolean | null;
};

export type FuturesMarketListParams = {
  keyword?: string;
  tab?: 'ALL' | 'HOT' | 'GAINERS' | 'LOSERS' | 'NEW';
  direction?: 'UP' | 'DOWN';
  sortBy?: 'displaySort' | 'priceChangePercent' | 'quoteVolume' | 'lastPrice' | 'markPrice' | 'lastFundingRate' | 'createTime';
  sortDirection?: 'ASC' | 'DESC';
  limit?: number;
};

export type FuturesKlineParams = SpotKlineParams;
