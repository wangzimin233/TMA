import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Bell, Calculator, CandlestickChart, ChevronDown, Columns2, FileText, Info, Loader2, Minus, PanelBottom, PanelTop, Plus, Search, Star, WalletCards, X } from 'lucide-react';
import { CandlestickSeries, ColorType, createChart, type CandlestickData, type IChartApi, type ISeriesApi, type LogicalRange, type UTCTimestamp } from 'lightweight-charts';
import { CoinDot } from '../../components/CoinDot';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '../../components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Input } from '../../components/ui/input';
import { Slider } from '../../components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useTradeStore } from '../../store/trade.store';
import { useAuthStore } from '../../store/auth.store';
import type { FuturesDepthLevel, FuturesMarkPrice, FuturesSummary, FuturesTrade, SpotDepthLevel, SpotKlineParams, SpotSummary, SpotTrade, TradeMode } from '../../types/app';
import { useCancelSpotOrder, usePlaceSpotOrder, useSpotFavoriteStatus, useToggleSpotFavorite, useSpotSummary, useInfiniteSpotKlines, useSpotDepth, useSpotExchangeInfo, useSpotFavorites, useSpotMarketList, useSpotOpenOrders, useSpotOrderDetail, useSpotOrderHistory, useSpotTradeConfig, useSpotTrades } from '../../hooks/useSpotQueries';
import { useCancelFuturesOrder, useFuturesDepth, useFuturesMarkPrice, useFuturesMarketList, useFuturesOpenOrders, useFuturesOrderDetail, useFuturesOrderHistory, useFuturesPositions, useFuturesSummary, useFuturesTradeConfig, useFuturesTrades, useInfiniteFuturesKlines, usePlaceFuturesOrder } from '../../hooks/useFuturesQueries';
import { useAccountAssets } from '../../hooks/useAccountQueries';
import { addDecimalStrings, divideDecimalStrings, floorDecimalAtZero, floorDecimalToStep, formatDecimalToPrecision, multiplyDecimalStrings, normalizeDecimalInput, subtractDecimalStrings } from '../../lib/decimal';
import { buildSpotOrderPayload, getSpotOrderValidation, type SpotOrderBalance, type SpotOrderRule } from '../../lib/spot-order';
import { buildFuturesOrderPayload, convertFuturesQuantityUnit, getCloseAvailableQty, getFuturesBaseQuantityFromUnit, getFuturesOrderValidation, type FuturesOrderBalance, type FuturesOrderDirection, type FuturesOrderPosition, type FuturesOrderRule, type FuturesQuantityUnit, type FuturesTimeInForce } from '../../lib/futures-order';
import { formatFuturesFundingRate, formatFuturesFundingTime, formatNullableMarketPercent, formatNullableMarketPrice, formatNullableMarketVolume, getNullableChangeClass, isFiniteNumber } from '../../lib/futures-market';
import { symbolFormat } from '../../lib/utils';
import type { AccountAsset, AccountType } from '../../api/account';
import type { SpotOrder, SpotTradeConfig } from '../../api/spot';
import type { FuturesOrder, FuturesTradeConfig } from '../../api/futures';

const KLINE_INTERVALS: SpotKlineParams['interval'][] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const KLINE_PAGE_LIMIT = 500;
const marketPickerTabs = ['自选', '热门', '涨幅榜', '跌幅榜'] as const;

type OrderType = 'limit' | 'market';
type TradeSide = 'buy' | 'sell';
type ContractPositionMode = 'open' | 'close';
type DepthViewMode = 'both' | 'buy' | 'sell';
type TradeContentTab = 'chart' | 'trades' | 'overview';
type MarketPickerTab = (typeof marketPickerTabs)[number];
type LimitLinkedField = 'quantity' | 'amount';
const contractTimeInForceOptions: Array<{ value: FuturesTimeInForce; label: string; description: string }> = [
  { value: 'GTC', label: 'GTC', description: '取消前有效' },
  { value: 'IOC', label: 'IOC', description: '立即成交否则取消' },
  { value: 'FOK', label: 'FOK', description: '全部成交否则取消' },
];
type PriceSelectionSignal = {
  price: string;
  nonce: number;
};
type ContractOrderBookLayout = {
  positionMode: ContractPositionMode;
  takeProfitStopLossEnabled: boolean;
};
type TradeTicker = {
  symbol: string;
  base: string;
  quote: string;
  price: string;
  spotPrice: string;
  fiat: string;
  change: number | null;
  changeText: string;
  delta: string;
  high: string;
  low: string;
  volume: string;
  turnover: string;
  iconColor: string;
  markPrice?: string;
  indexPrice?: string;
  fundingRate?: string;
  nextFundingTime?: string;
  leverageText?: string;
};
type MarketTrade = SpotTrade | FuturesTrade;

type TradePageProps = {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
  showChart: boolean;
  setShowChart: (value: boolean) => void;
  openLeverage: () => void;
  openTransfer: (fromAccountType?: AccountType, toAccountType?: AccountType, coinCode?: string) => void;
};

export function TradePage({ mode, setMode, showChart, setShowChart, openLeverage, openTransfer }: TradePageProps) {
  const currentSymbol = useTradeStore((state) => state.currentSymbol);
  const setCurrentSymbol = useTradeStore((state) => state.setCurrentSymbol);
  const isLogin = useAuthStore((state) => state.isLogin);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMarketPicker, setShowMarketPicker] = useState(false);
  const isContractMode = mode === 'contract';
  const routeSymbolParam = searchParams.get('symbol')?.trim() ?? '';
  const routeSymbol = routeSymbolParam ? symbolFormat.normalize(routeSymbolParam.toUpperCase()) : '';
  const rememberedSymbol = currentSymbol ? symbolFormat.normalize(currentSymbol) : '';
  const shouldLoadDefaultSymbol = !routeSymbol && !rememberedSymbol;
  const { data: defaultMarketList = [] } = useSpotMarketList({ tab: 'ALL', limit: 1 }, shouldLoadDefaultSymbol && !isContractMode);
  const { data: defaultFuturesMarketList = [] } = useFuturesMarketList({ tab: 'ALL', limit: 1 }, shouldLoadDefaultSymbol && isContractMode);
  const defaultRowsSource = isContractMode ? defaultFuturesMarketList : defaultMarketList;
  const defaultMarketRows = Array.isArray(defaultRowsSource) ? defaultRowsSource : [];

  const { data: spotSummary } = useSpotSummary(currentSymbol, !isContractMode);
  const { data: futuresSummary } = useFuturesSummary(currentSymbol, isContractMode);
  const { data: futuresMarkPrice } = useFuturesMarkPrice(currentSymbol, isContractMode);
  const ticker = isContractMode
    ? futuresSummary ? formatFuturesSummaryToTicker(futuresSummary, futuresMarkPrice) : undefined
    : spotSummary ? formatSpotSummaryToTicker(spotSummary) : undefined;

  // 查询收藏状态
  const { data: favoriteStatus } = useSpotFavoriteStatus(currentSymbol, isLogin && !isContractMode);
  const { mutate: toggleFavorite } = useToggleSpotFavorite();

  useEffect(() => {
    if (!routeSymbol || routeSymbol === currentSymbol) return;
    setCurrentSymbol(routeSymbol);
  }, [currentSymbol, routeSymbol, setCurrentSymbol]);

  useEffect(() => {
    if (routeSymbol || !rememberedSymbol) return;

    if (rememberedSymbol !== currentSymbol) {
      setCurrentSymbol(rememberedSymbol);
    }

    setSearchParams({ symbol: symbolFormat.toApi(rememberedSymbol) }, { replace: true });
  }, [currentSymbol, rememberedSymbol, routeSymbol, setCurrentSymbol, setSearchParams]);

  useEffect(() => {
    if (routeSymbol || rememberedSymbol || defaultMarketRows.length === 0) return;

    const defaultSymbol = symbolFormat.normalize(defaultMarketRows[0]?.symbolCode ?? '');
    if (!defaultSymbol) return;

    if (defaultSymbol !== currentSymbol) {
      setCurrentSymbol(defaultSymbol);
    }

    setSearchParams({ symbol: symbolFormat.toApi(defaultSymbol) }, { replace: true });
  }, [currentSymbol, defaultMarketRows, rememberedSymbol, routeSymbol, setCurrentSymbol, setSearchParams]);

  const selectSymbol = (symbol: string) => {
    setCurrentSymbol(symbol);
    setSearchParams({ symbol: symbolFormat.toApi(symbol) });
    setShowMarketPicker(false);
  };

  const handleToggleFavorite = () => {
    if (!currentSymbol || isContractMode) return;

    toggleFavorite({
      symbol: currentSymbol,
      favorited: favoriteStatus?.favorited ?? false,
    });
  };

  return (
    <>
      <SpotTradePage
        mode={mode}
        setMode={setMode}
        symbol={currentSymbol}
        ticker={ticker}
        showChart={showChart}
        setShowChart={setShowChart}
        openLeverage={openLeverage}
        openTransfer={openTransfer}
        openMarketPicker={() => setShowMarketPicker(true)}
        favoriteStatus={favoriteStatus}
        onToggleFavorite={handleToggleFavorite}
      />
      <MarketPicker
        open={showMarketPicker}
        mode={mode}
        currentSymbol={currentSymbol}
        onOpenChange={setShowMarketPicker}
        onSelect={selectSymbol}
      />
    </>
  );
}

function SpotTradePage({
  mode,
  setMode,
  symbol,
  ticker,
  showChart,
  setShowChart,
  openLeverage,
  openTransfer,
  openMarketPicker,
  favoriteStatus,
  onToggleFavorite,
}: {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
  symbol: string;
  ticker?: TradeTicker;
  showChart: boolean;
  setShowChart: (value: boolean) => void;
  openLeverage: () => void;
  openTransfer: (fromAccountType?: AccountType, toAccountType?: AccountType, coinCode?: string) => void;
  openMarketPicker: () => void;
  favoriteStatus?: { symbolCode: string; favorited: boolean };
  onToggleFavorite: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TradeContentTab>('chart');
  const isContract = mode === 'contract';
  const base = ticker?.base ?? getBaseFromSymbol(symbol);
  const quote = ticker?.quote ?? getQuoteFromSymbol(symbol);
  const latestPrice = isContract ? ticker?.price : ticker?.spotPrice;
  const subtitleChange = isContract ? `${ticker?.changeText ?? '--'} ${ticker?.delta ?? '--'}` : ticker?.changeText ?? '--';

  const toggleChart = () => {
    setShowChart(!showChart);
  };

  return (
    <section className="min-w-0">
      <TradeTop mode={mode} setMode={setMode} />
      <div className="border-b border-line px-4 py-2.5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <button className="flex min-w-0 items-center gap-2 text-[1rem] font-semibold cursor-pointer" onClick={openMarketPicker}>
            <CoinDot />
            <span className="truncate">{symbol || '选择交易对'}</span>
            <ChevronDown className="size-4 shrink-0" />
          </button>
          <div className="flex shrink-0 items-center gap-3.5">
            <button
              className={isContract ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}
              aria-label={isContract ? '合约自选暂未开放' : '收藏交易对'}
              disabled={isContract}
              onClick={onToggleFavorite}
            >
              <Star className={`size-5 ${favoriteStatus?.favorited ? 'fill-brand text-brand' : 'text-muted-foreground'}`} />
            </button>
            <button className="cursor-pointer" aria-label={showChart ? '隐藏图表区域' : '显示图表区域'} onClick={toggleChart}>
              <CandlestickChart className={`size-5 ${showChart ? 'text-brand' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
          <div className="min-w-0">
            <p className={`truncate font-mono text-[1.38rem] font-bold leading-none tabular-nums ${getChangeClass(ticker?.change)}`}>
              {latestPrice ?? '--'}
            </p>
            <p className="mt-1.5 truncate font-mono text-[0.72rem] text-muted-foreground tabular-nums">
              ≈{ticker?.fiat ?? '--'} <span className={getChangeClass(ticker?.change)}>{subtitleChange}</span>
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-1 text-right text-[0.68rem] text-muted-foreground">
            <Stat label="24h最高" value={ticker?.high ?? '--'} />
            <Stat label={`24h量(${base})`} value={ticker?.volume ?? '--'} />
            <Stat label="24h最低" value={ticker?.low ?? '--'} />
            <Stat label={`24h额(${quote})`} value={ticker?.turnover ?? '--'} />
          </div>
        </div>
        {isContract && <ContractTickerMeta ticker={ticker} compact />}
      </div>

      {showChart && (
        <div className="border-b border-line bg-base">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TradeContentTab)} className="min-w-0 gap-0">
            <TabsList variant="line" className="no-scrollbar flex !h-10 w-full min-w-0 justify-start gap-8 overflow-x-auto whitespace-nowrap rounded-none px-4 py-0 text-[0.9rem] font-semibold leading-none">
              <TradeContentTrigger value="chart">图表</TradeContentTrigger>
              <TradeContentTrigger value="trades">最新成交</TradeContentTrigger>
              <TradeContentTrigger value="overview">币种概况</TradeContentTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 'chart' && (
            <>
              <KlineIntervalTabs />
              <CandleChart mode={mode} />
            </>
          )}
          {activeTab === 'trades' && <LatestTradesSection mode={mode} symbol={symbol} base={base} />}
          {activeTab === 'overview' && <CoinOverviewPanel />}
        </div>
      )}

      <TradingWorkspace mode={mode} symbol={symbol} base={base} quote={quote} ticker={ticker} openLeverage={openLeverage} openTransfer={openTransfer} />
      <div className="px-4 pb-3">
        <CurrentOrders mode={mode} symbol={symbol} />
      </div>
    </section>
  );
}

function TradeContentTrigger({ value, children }: { value: TradeContentTab; children: ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="!h-10 flex-none shrink-0 rounded-none border-0 bg-transparent px-0 pb-1.5 pt-0 text-muted-foreground shadow-none after:!bottom-0 after:bg-warning data-[state=active]:bg-transparent data-[state=active]:text-brand dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-brand"
    >
      {children}
    </TabsTrigger>
  );
}

function KlineIntervalTabs() {
  const currentInterval = useTradeStore((state) => state.currentInterval);
  const setCurrentInterval = useTradeStore((state) => state.setCurrentInterval);

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap bg-base2 px-4 py-2 text-[0.75rem] text-muted-foreground">
      {KLINE_INTERVALS.map((item) => (
        <button key={item} className={currentInterval === item ? 'shrink-0 rounded bg-soft2 px-2.5 py-1.5 text-ink cursor-pointer' : 'shrink-0 px-2 py-1.5 cursor-pointer'} onClick={() => setCurrentInterval(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}

function LatestTradesSection({ mode, symbol, base }: { mode: TradeMode; symbol: string; base: string }) {
  const isContract = mode === 'contract';
  const { data: spotTrades = [], isLoading: spotLoading } = useSpotTrades(symbol, 50, !isContract);
  const { data: futuresTrades = [], isLoading: futuresLoading } = useFuturesTrades(symbol, 50, isContract);
  const trades = isContract ? futuresTrades : spotTrades;
  const isLoading = isContract ? futuresLoading : spotLoading;

  return (
    <div className="mx-3 mb-3 max-h-[250px] overflow-y-auto rounded-md border border-line bg-base2/45 px-3 py-2 shadow-inner shadow-black/20">
      <LatestTrades trades={trades} base={base} isLoading={isLoading} />
    </div>
  );
}

function CoinOverviewPanel() {
  return (
    <div className="mx-3 mb-3 grid min-h-[9rem] place-items-center rounded-md border border-line bg-base2/35 px-4 py-3 text-[0.8rem] text-muted-foreground">
      暂无数据
    </div>
  );
}

function TradeTop({ mode, setMode }: { mode: TradeMode; setMode: (mode: TradeMode) => void }) {
  return (
    <header className="flex h-11 items-center justify-between border-b border-line px-4">
      <span className="size-5" />
      <div className="rounded-md bg-soft p-0.5">
        <button className={`rounded px-6 py-1.5 text-[0.86rem] outline-none transition-colors ${mode === 'spot' ? 'bg-base text-brand' : 'text-muted-foreground'}`} onClick={() => setMode('spot')}>
          现货
        </button>
        <button className={`rounded px-6 py-1.5 text-[0.86rem] outline-none transition-colors ${mode === 'contract' ? 'bg-base text-brand' : 'text-muted-foreground'}`} onClick={() => setMode('contract')}>
          合约
        </button>
      </div>
      <Bell className="size-5 text-muted-foreground" />
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p>{label}</p>
      <p className="font-mono text-[0.78rem] text-ink tabular-nums">{value}</p>
    </div>
  );
}

function ContractTickerMeta({ ticker, compact = false }: { ticker?: TradeTicker; compact?: boolean }) {
  return (
    <div className={`mt-2 grid min-w-0 grid-cols-2 gap-x-2 gap-y-1 font-mono tabular-nums ${compact ? 'text-[0.64rem]' : 'text-[0.68rem]'}`}>
      <span className="truncate text-muted-foreground">标记 {ticker?.markPrice ?? '--'}</span>
      <span className="truncate text-muted-foreground">资金 {ticker?.fundingRate ?? '--'}</span>
      <span className="truncate text-muted-foreground">指数 {ticker?.indexPrice ?? '--'}</span>
      <span className="truncate text-muted-foreground">结算 {ticker?.nextFundingTime ?? '--'}</span>
      {ticker?.leverageText && <span className="col-span-2 truncate text-muted-foreground">杠杆 {ticker.leverageText}</span>}
    </div>
  );
}

function CandleChart({ mode }: { mode: TradeMode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const fetchNextPageRef = useRef<(() => Promise<unknown>) | null>(null);
  const canFetchMoreRef = useRef(false);
  const isFetchingHistoryRef = useRef(false);
  const fetchLockRef = useRef(false);
  const lastHistoryFetchAtRef = useRef(0);
  const initialFitKeyRef = useRef('');
  const currentSymbol = useTradeStore((state) => state.currentSymbol);
  const currentInterval = useTradeStore((state) => state.currentInterval);
  const chartDataKey = `${currentSymbol}:${currentInterval}`;

  const isContract = mode === 'contract';
  const spotKlinesQuery = useInfiniteSpotKlines({
    symbol: currentSymbol,
    interval: currentInterval,
    limit: KLINE_PAGE_LIMIT,
  }, !isContract);
  const futuresKlinesQuery = useInfiniteFuturesKlines({
    symbol: currentSymbol,
    interval: currentInterval,
    limit: KLINE_PAGE_LIMIT,
  }, isContract);
  const {
    data: klinePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = isContract ? futuresKlinesQuery : spotKlinesQuery;

  const candleData = useMemo<CandlestickData<UTCTimestamp>[]>(() => {
    const itemsByOpenTime = new Map<number, CandlestickData<UTCTimestamp>>();

    for (const item of klinePages?.pages.flat() ?? []) {
      itemsByOpenTime.set(item.openTime, {
        time: Math.floor(item.openTime / 1000) as UTCTimestamp,
        open: item.openPrice,
        high: item.highPrice,
        low: item.lowPrice,
        close: item.closePrice,
      });
    }

    return Array.from(itemsByOpenTime.entries())
      .sort(([leftOpenTime], [rightOpenTime]) => leftOpenTime - rightOpenTime)
      .map(([, item]) => item);
  }, [klinePages]);

  const hasKlines = candleData.length > 0;

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage as () => Promise<unknown>;
    canFetchMoreRef.current = Boolean(hasNextPage);
    isFetchingHistoryRef.current = isFetchingNextPage;
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    initialFitKeyRef.current = '';
    fetchLockRef.current = false;
  }, [chartDataKey]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b96a8',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(43, 49, 57, 0.68)' },
        horzLines: { color: 'rgba(43, 49, 57, 0.68)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: 'rgba(139,150,168,.35)' },
        horzLine: { color: 'rgba(139,150,168,.35)' },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
      priceLineColor: '#f6465d',
      priceLineWidth: 1,
      lastValueVisible: true,
      priceLineVisible: true,
    });

    const handleVisibleRangeChange = (range: LogicalRange | null) => {
      if (!range || range.from >= 20) return;
      if (!canFetchMoreRef.current || isFetchingHistoryRef.current || fetchLockRef.current) return;

      const now = Date.now();
      fetchLockRef.current = true;
      isFetchingHistoryRef.current = true;

      if (now - lastHistoryFetchAtRef.current < 700) {
        window.setTimeout(() => {
          fetchLockRef.current = false;
          isFetchingHistoryRef.current = false;
        }, 700);
        return;
      }

      lastHistoryFetchAtRef.current = now;
      void fetchNextPageRef.current?.().finally(() => {
        window.setTimeout(() => {
          fetchLockRef.current = false;
          isFetchingHistoryRef.current = false;
        }, 300);
      });
    };

    chartRef.current = chart;
    seriesRef.current = series;
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    seriesRef.current.setData(candleData);

    if (candleData.length > 0 && initialFitKeyRef.current !== chartDataKey) {
      chartRef.current.timeScale().fitContent();
      initialFitKeyRef.current = chartDataKey;
    }
  }, [candleData, chartDataKey]);

  return (
    <div className="relative h-[260px] border-b border-line bg-base">
      <div ref={containerRef} className="h-full w-full" />
      {isFetchingNextPage && hasKlines && (
        <div className="pointer-events-none absolute left-3 top-2 rounded bg-base2/90 px-2 py-1 text-[0.68rem] text-muted-foreground shadow-sm">
          加载历史...
        </div>
      )}
      {!hasKlines && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-[0.82rem] text-muted-foreground">
          {isLoading ? 'K线加载中...' : '暂无K线数据'}
        </div>
      )}
    </div>
  );
}

function TradingWorkspace({
  mode,
  symbol,
  base,
  quote,
  ticker,
  openLeverage,
  openTransfer,
}: {
  mode: TradeMode;
  symbol: string;
  base: string;
  quote: string;
  ticker?: TradeTicker;
  openLeverage: () => void;
  openTransfer: (fromAccountType?: AccountType, toAccountType?: AccountType, coinCode?: string) => void;
}) {
  const [selectedPrice, setSelectedPrice] = useState<PriceSelectionSignal | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [contractOrderBookLayout, setContractOrderBookLayout] = useState<ContractOrderBookLayout>({
    positionMode: 'open',
    takeProfitStopLossEnabled: false,
  });
  const orderBookKey = `${mode}:${symbol}:${orderType}:${contractOrderBookLayout.positionMode}:${contractOrderBookLayout.takeProfitStopLossEnabled ? 'tpsl' : 'plain'}`;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,0.43fr)_minmax(0,0.57fr)] items-start gap-2.5 border-b border-line px-3 py-3">
      <CompactOrderBook
        key={orderBookKey}
        mode={mode}
        symbol={symbol}
        base={base}
        quote={quote}
        ticker={ticker}
        orderType={orderType}
        contractLayout={contractOrderBookLayout}
        onSelectPrice={(price) => setSelectedPrice({ price, nonce: Date.now() })}
      />
      <div className="min-w-0">
        {mode === 'contract' ? (
          <ContractOrderForm
            symbol={symbol}
            base={base}
            quote={quote}
            ticker={ticker}
            orderType={orderType}
            setOrderType={setOrderType}
            selectedPrice={selectedPrice}
            openLeverage={openLeverage}
            openTransfer={openTransfer}
            onOrderBookLayoutChange={setContractOrderBookLayout}
          />
        ) : (
          <SpotOrderForm
            symbol={symbol}
            base={base}
            quote={quote}
            ticker={ticker}
            orderType={orderType}
            setOrderType={setOrderType}
            selectedPrice={selectedPrice}
          />
        )}
      </div>
    </div>
  );
}

function CompactOrderBook({
  mode,
  symbol,
  base,
  quote,
  ticker,
  orderType,
  contractLayout,
  onSelectPrice,
}: {
  mode: TradeMode;
  symbol: string;
  base: string;
  quote: string;
  ticker?: TradeTicker;
  orderType: OrderType;
  contractLayout: ContractOrderBookLayout;
  onSelectPrice: (price: string) => void;
}) {
  const [depthView, setDepthView] = useState<DepthViewMode>('both');
  const isContract = mode === 'contract';
  const { data: spotDepth, isLoading: spotDepthLoading } = useSpotDepth(symbol, 20, !isContract);
  const { data: futuresDepth, isLoading: futuresDepthLoading } = useFuturesDepth(symbol, 20, isContract);
  const depth = isContract ? futuresDepth : spotDepth;
  const isLoading = isContract ? futuresDepthLoading : spotDepthLoading;
  const visibleRowCount = getCompactDepthDisplayRows({
    depthView,
    mode,
    orderType,
    contractLayout,
  });
  const sellRows = (depth?.asks ?? []).slice(0, visibleRowCount).map(formatDepthRow);
  const buyRows = (depth?.bids ?? []).slice(0, visibleRowCount).map(formatDepthRow);
  const maxAmount = Math.max(0, ...sellRows.concat(buyRows).map((row) => row.quantity));
  const buyTotal = buyRows.reduce((total, row) => total + row.quantity, 0);
  const sellTotal = sellRows.reduce((total, row) => total + row.quantity, 0);
  const total = buyTotal + sellTotal;
  const buyPercent = total > 0 ? Math.round((buyTotal / total) * 100) : 50;
  const sellPercent = 100 - buyPercent;

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-2 gap-1 px-1 text-[0.66rem] leading-tight text-muted-foreground">
        <span>价格<br />({quote})</span>
        <span className="text-right">数量<br />({base})</span>
      </div>
      {depthView !== 'buy' && <DepthRows rows={sellRows} side="sell" maxAmount={maxAmount} isLoading={isLoading} onSelectPrice={onSelectPrice} compact />}
      <CompactMarketPrice mode={mode} ticker={ticker} onSelectPrice={onSelectPrice} />
      {depthView !== 'sell' && <DepthRows rows={buyRows} side="buy" maxAmount={maxAmount} isLoading={isLoading} onSelectPrice={onSelectPrice} compact />}
      <div className="mt-2.5 flex items-center gap-1 font-mono text-[0.68rem] tabular-nums">
        <span className="text-buy">{buyPercent}%</span>
        <div className="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-soft">
          <span className="order-flow-segment bg-buy" style={{ width: `${buyPercent}%` }} />
          <span className="order-flow-segment bg-sell" style={{ width: `${sellPercent}%` }} />
        </div>
        <span className="text-sell">{sellPercent}%</span>
      </div>
      <div className="mt-2 flex justify-end">
        <div className="inline-grid grid-cols-3 gap-0.5 rounded-md bg-base2/80 p-0.5">
          <DepthViewButton mode="both" activeMode={depthView} label="买卖盘" onSelect={setDepthView} />
          <DepthViewButton mode="buy" activeMode={depthView} label="仅买盘" onSelect={setDepthView} />
          <DepthViewButton mode="sell" activeMode={depthView} label="仅卖盘" onSelect={setDepthView} />
        </div>
      </div>
    </div>
  );
}

function CompactMarketPrice({ mode, ticker, onSelectPrice }: { mode: TradeMode; ticker?: TradeTicker; onSelectPrice?: (price: string) => void }) {
  const price = mode === 'contract' ? ticker?.price : ticker?.spotPrice;
  const selectable = Boolean(price && onSelectPrice);
  const selectPrice = () => {
    if (!price) return;
    onSelectPrice?.(toDecimalInput(price));
  };

  return (
    <button
      className={`my-2.5 block w-full rounded-md text-center transition-colors ${selectable ? 'cursor-pointer hover:bg-white/[0.035] active:bg-white/[0.055]' : 'cursor-default'}`}
      disabled={!selectable}
      onClick={selectPrice}
      type="button"
    >
      <p className={`font-mono text-[1.45rem] font-bold leading-none tabular-nums ${getChangeClass(ticker?.change)}`}>{price ?? '--'}</p>
      <p className="mt-1 font-mono text-[0.72rem] text-muted-foreground tabular-nums">≈ {ticker?.fiat ?? '--'}</p>
    </button>
  );
}

function SpotOrderForm({
  symbol,
  base,
  quote,
  ticker,
  orderType,
  setOrderType,
  selectedPrice,
}: {
  symbol: string;
  base: string;
  quote: string;
  ticker?: TradeTicker;
  orderType: OrderType;
  setOrderType: (orderType: OrderType) => void;
  selectedPrice: PriceSelectionSignal | null;
}) {
  const [side, setSide] = useState<TradeSide>('buy');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [lastEdited, setLastEdited] = useState<LimitLinkedField>('quantity');
  const isAuthenticated = useAuthStore((state) => state.isLogin);
  const { data: exchangeInfo } = useSpotExchangeInfo(symbol);
  const { data: tradeConfig } = useSpotTradeConfig(symbol);
  const { data: accountAssets = [] } = useAccountAssets('SPOT', isAuthenticated);
  const placeOrder = usePlaceSpotOrder();
  const marketPrice = toDecimalInput(ticker?.spotPrice ?? ticker?.price ?? '');
  const isLimitOrder = orderType === 'limit';
  const inputUnit = isLimitOrder ? base : side === 'buy' ? quote : base;
  const actionColor = side === 'buy' ? 'bg-buy' : 'bg-sell';
  const actionLabel = `${side === 'buy' ? '买入' : '卖出'} ${base}`;
  const estimatedPrimaryLabel = side === 'buy' ? '可买' : '可卖';
  const estimatedPrimaryValue = getSpotEstimatedValue({
    side,
    isLimitOrder,
    quantity,
    amount,
    marketPrice,
    base,
    quote,
  });
  const feeUnit = side === 'buy' ? base : quote;
  const priceStep = toRuleDecimal(exchangeInfo?.tickSize);
  const quantityStep = toRuleDecimal(exchangeInfo?.stepSize);
  const pricePrecision = getInputPrecision(tradeConfig?.spotRule?.pricePrecision, priceStep);
  const quantityPrecision = getInputPrecision(tradeConfig?.spotRule?.qtyPrecision, quantityStep);
  const amountPrecision = getInputPrecision(tradeConfig?.spotRule?.amountPrecision, undefined, exchangeInfo?.quoteAssetPrecision);
  const estimatedFeePrecision = side === 'buy'
    ? getInputPrecision(exchangeInfo?.baseAssetPrecision) ?? 8
    : amountPrecision ?? 8;
  const balanceByCoin = useMemo(() => getSpotBalanceMap(accountAssets), [accountAssets]);
  const baseAvailable = balanceByCoin[base]?.availableBalance ?? '0';
  const quoteAvailable = balanceByCoin[quote]?.availableBalance ?? '0';
  const orderQuantity = isLimitOrder || side === 'sell' ? quantity : '';
  const orderAmount = isLimitOrder ? amount : side === 'buy' ? quantity : '';
  const orderRule = useMemo(
    () => getSpotOrderRule(exchangeInfo, tradeConfig),
    [exchangeInfo, tradeConfig],
  );
  const validation = getSpotOrderValidation({
    rule: orderRule,
    balances: balanceByCoin,
    base,
    quote,
    side,
    orderType,
    price,
    quantity: orderQuantity,
    amount: orderAmount,
    marketPrice,
  });
  const submitReason = !isAuthenticated ? '请先登录' : validation.reason;
  const isSubmitting = placeOrder.isPending;
  const submitDisabled = !isAuthenticated || !validation.canSubmit || isSubmitting;
  const percentResetKey = `${symbol}:${side}:${orderType}`;
  const estimatedFee = formatDecimalToPrecision(getEstimatedSpotFee({
    side,
    isLimitOrder,
    price,
    quantity: orderQuantity,
    amount: orderAmount,
    marketPrice,
    feeRate: toRuleDecimal(tradeConfig?.spotRule?.takerFeeRate),
    feeUnit,
  }), estimatedFeePrecision);

  useEffect(() => {
    setPrice('');
    setQuantity('');
    setAmount('');
    setLastEdited('quantity');
  }, [symbol, side, orderType]);

  useEffect(() => {
    if (!price && marketPrice && isLimitOrder) {
      setPrice(marketPrice);
    }
  }, [isLimitOrder, marketPrice, price]);

  useEffect(() => {
    if (!selectedPrice || !isLimitOrder) return;

    applyLimitPrice(selectedPrice.price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrice?.nonce, isLimitOrder]);

  const updatePrice = (nextValue: string) => {
    const nextPrice = normalizeDecimalInput(nextValue, pricePrecision);
    applyLimitPrice(nextPrice);
  };

  const applyLimitPrice = (nextPrice: string) => {
    setPrice(nextPrice);

    if (!isLimitOrder) return;

    if (lastEdited === 'amount') {
      syncQuantityFromAmount(amount, nextPrice);
      return;
    }

    setAmount(multiplyDecimalStrings(nextPrice, quantity));
  };

  const normalizeQuantityToStep = (nextQuantity: string) => {
    if (!quantityStep) return nextQuantity;
    return floorDecimalToStep(nextQuantity, quantityStep);
  };

  const syncQuantityFromAmount = (nextAmount: string, nextPrice = price) => {
    const rawQuantity = divideDecimalStrings(nextAmount, nextPrice, 18);
    const steppedQuantity = normalizeQuantityToStep(rawQuantity);

    setQuantity(steppedQuantity);
  };

  const updateQuantity = (nextValue: string) => {
    const nextQuantity = normalizeDecimalInput(nextValue, quantityPrecision);
    setQuantity(nextQuantity);
    setLastEdited('quantity');

    if (isLimitOrder) {
      setAmount(multiplyDecimalStrings(price, nextQuantity));
    }
  };

  const updateAmount = (nextValue: string) => {
    const nextAmount = normalizeDecimalInput(nextValue, amountPrecision);
    setAmount(nextAmount);
    setLastEdited('amount');
    syncQuantityFromAmount(nextAmount);
  };

  const stepPrice = (direction: 'down' | 'up') => {
    if (!priceStep) return;

    const basePrice = price || marketPrice || '0';
    const nextPrice = direction === 'up'
      ? addDecimalStrings(basePrice, priceStep)
      : floorDecimalAtZero(subtractDecimalStrings(basePrice, priceStep));

    applyLimitPrice(nextPrice);
  };

  const stepQuantity = (direction: 'down' | 'up') => {
    if (!quantityStep) return;

    const nextQuantity = direction === 'up'
      ? addDecimalStrings(quantity, quantityStep)
      : floorDecimalAtZero(subtractDecimalStrings(quantity, quantityStep));

    updateQuantity(nextQuantity);
  };

  const applyBalancePercent = (percent: number) => {
    const available = side === 'buy' ? quoteAvailable : baseAvailable;
    const nextValue = divideDecimalStrings(multiplyDecimalStrings(available, String(percent)), '100', 18);

    if (side === 'buy') {
      if (isLimitOrder) {
        updateAmount(nextValue);
      } else {
        updateQuantity(nextValue);
      }
      return;
    }

    updateQuantity(normalizeQuantityToStep(nextValue));
  };

  const submitOrder = () => {
    if (submitDisabled) return;

    placeOrder.mutate(buildSpotOrderPayload({
      symbolCode: symbolFormat.toApi(symbol),
      side,
      orderType,
      price,
      quantity: orderQuantity,
      amount: orderAmount,
    }), {
      onSuccess: () => {
        setQuantity('');
        setAmount('');
      },
    });
  };

  return (
    <div className="min-w-0">
      <div className="relative mb-2 grid h-8 grid-cols-2 overflow-hidden rounded-md bg-base2 p-0.5" role="tablist" aria-label="买卖方向">
        <span
          className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-[6px] transition-transform duration-200 ease-out ${side === 'buy' ? 'bg-buy' : 'translate-x-[calc(100%+2px)] bg-sell'}`}
        />
        <button
          aria-selected={side === 'buy'}
          className={`relative z-10 rounded-[6px] text-[0.82rem] font-semibold transition-colors duration-200 cursor-pointer ${side === 'buy' ? 'text-white' : 'text-muted-foreground'}`}
          onClick={() => setSide('buy')}
          role="tab"
          type="button"
        >
          买入
        </button>
        <button
          aria-selected={side === 'sell'}
          className={`relative z-10 rounded-[6px] text-[0.82rem] font-semibold transition-colors duration-200 cursor-pointer ${side === 'sell' ? 'text-white' : 'text-muted-foreground'}`}
          onClick={() => setSide('sell')}
          role="tab"
          type="button"
        >
          卖出
        </button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="mb-2 flex h-8 w-full items-center justify-between rounded-md bg-base2 px-3 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-soft cursor-pointer" type="button">
            {getOrderTypeLabel(orderType)}
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="border border-line bg-panel text-ink">
          <DropdownMenuItem className="cursor-pointer text-[0.82rem]" onSelect={() => setOrderType('limit')}>
            限价单
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-[0.82rem]" onSelect={() => setOrderType('market')}>
            市价单
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isLimitOrder ? (
        <div className="space-y-1.5">
          <TradeInput
            value={price}
            onValueChange={updatePrice}
            suffix={quote}
            dense
            emphasis
            onStepDown={() => stepPrice('down')}
            onStepUp={() => stepPrice('up')}
            stepDisabled={!priceStep}
            feedbackKey={selectedPrice?.nonce}
            ariaLabel={`价格(${quote})`}
          />
          <TradeInput
            value={quantity}
            onValueChange={updateQuantity}
            placeholder="数量"
            suffix={base}
            dense
            onStepDown={() => stepQuantity('down')}
            onStepUp={() => stepQuantity('up')}
            stepDisabled={!quantityStep}
            ariaLabel={`数量(${base})`}
          />
          <PercentRail compact resetKey={percentResetKey} onPercentChange={applyBalancePercent} />
          <TradeInput value={amount} onValueChange={updateAmount} placeholder="成交金额" suffix={quote} dense ariaLabel={`成交金额(${quote})`} />
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex h-[2.75rem] items-center justify-center rounded-lg border border-transparent bg-soft px-3 text-[0.86rem] font-semibold text-muted-foreground/70">
            市价
          </div>
          <TradeInput value={quantity} onValueChange={updateQuantity} placeholder="数量" suffix={inputUnit} dense ariaLabel={`数量(${inputUnit})`} />
          <PercentRail compact resetKey={percentResetKey} onPercentChange={applyBalancePercent} />
        </div>
      )}

      <div className="mt-2 space-y-1 text-[0.7rem] leading-tight">
        <MetricLine label="可用" value={side === 'buy' ? `${formatDecimalDisplay(quoteAvailable)} ${quote}` : `${formatDecimalDisplay(baseAvailable)} ${base}`} />
        <MetricLine label={estimatedPrimaryLabel} value={estimatedPrimaryValue} />
        <MetricLine label="预计手续费" value={`${estimatedFee || '--'} ${feeUnit}`} />
      </div>
      {submitReason && (
        <p className="mt-2 min-h-4 truncate text-[0.68rem] leading-none text-warning">
          {submitReason}
        </p>
      )}

      <button
        className={`mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[0.9rem] font-semibold text-white transition active:brightness-90 ${actionColor} ${submitDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        disabled={submitDisabled}
        onClick={submitOrder}
        type="button"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? '提交中' : actionLabel}
      </button>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 text-muted-foreground">
      <span className="shrink-0">{label}</span>
      <span className="min-w-0 truncate font-mono text-ink tabular-nums">{value}</span>
    </div>
  );
}

function getOrderTypeLabel(orderType: OrderType): string {
  return orderType === 'limit' ? '限价单' : '市价单';
}

function getCompactDepthDisplayRows({
  depthView,
  mode,
  orderType,
  contractLayout,
}: {
  depthView: DepthViewMode;
  mode: TradeMode;
  orderType: OrderType;
  contractLayout: ContractOrderBookLayout;
}): number {
  const bothSideRows = mode === 'contract'
    ? orderType === 'market' ? 9 : 10
    : orderType === 'market' ? 5 : 6;
  const tpslExtraRows = mode === 'contract'
    && contractLayout.positionMode === 'open'
    && contractLayout.takeProfitStopLossEnabled
    ? 2
    : 0;
  const visibleRows = bothSideRows + tpslExtraRows;

  if (depthView === 'both') {
    return Math.min(mode === 'contract' ? 12 : 10, visibleRows);
  }

  return Math.min(20, visibleRows * 2);
}

function getSpotEstimatedValue({
  side,
  isLimitOrder,
  quantity,
  amount,
  marketPrice,
  base,
  quote,
}: {
  side: TradeSide;
  isLimitOrder: boolean;
  quantity: string;
  amount: string;
  marketPrice: string;
  base: string;
  quote: string;
}): string {
  if (isLimitOrder) {
    return side === 'buy' ? `${quantity || '0'} ${base}` : `${amount || '0'} ${quote}`;
  }

  if (side === 'buy') {
    return `${divideDecimalStrings(quantity, marketPrice, 8) || '0'} ${base}`;
  }

  return `${multiplyDecimalStrings(marketPrice, quantity) || '0'} ${quote}`;
}

function ContractOrderForm({
  symbol,
  base,
  quote,
  ticker,
  orderType,
  setOrderType,
  selectedPrice,
  openLeverage,
  openTransfer,
  onOrderBookLayoutChange,
}: {
  symbol: string;
  base: string;
  quote: string;
  ticker?: TradeTicker;
  orderType: OrderType;
  setOrderType: (orderType: OrderType) => void;
  selectedPrice: PriceSelectionSignal | null;
  openLeverage: () => void;
  openTransfer: (fromAccountType?: AccountType, toAccountType?: AccountType, coinCode?: string) => void;
  onOrderBookLayoutChange: (layout: ContractOrderBookLayout) => void;
}) {
  const { data: futuresTradeConfig } = useFuturesTradeConfig(symbol, true);
  const futuresRule = futuresTradeConfig?.futuresRule;
  const [positionMode, setPositionMode] = useState<ContractPositionMode>('open');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState<FuturesQuantityUnit>('base');
  const [takeProfitStopLossEnabled, setTakeProfitStopLossEnabled] = useState(false);
  const [timeInForce, setTimeInForce] = useState<FuturesTimeInForce>('GTC');
  const [showTimeInForceDrawer, setShowTimeInForceDrawer] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isLogin);
  const { data: accountAssets = [] } = useAccountAssets('FUTURES', isAuthenticated);
  const { data: futuresPositions = [] } = useFuturesPositions(symbol, isAuthenticated, {
    refetchInterval: 3000,
    staleTime: 3000,
  });
  const placeOrder = usePlaceFuturesOrder();
  const isLimitOrder = orderType === 'limit';
  const marketPlaceholder = positionMode === 'open' ? '市价开仓' : '市价平仓';
  const contractMetricLabel = positionMode === 'open' ? '可开' : '可平';
  const selectedLeverage = useTradeStore((state) => state.selectedLeverage);
  const setSelectedLeverage = useTradeStore((state) => state.setSelectedLeverage);
  const effectiveLeverage = selectedLeverage || futuresRule?.defaultLeverage || 10;
  const leverageText = `${effectiveLeverage}x`;
  const marginModeLabel = '逐仓';
  const positionModeLabel = '双向';
  const marginCoin = futuresRule?.marginCoinCode ?? quote;
  const primaryAction = positionMode === 'open'
    ? { label: '开多', helper: '看涨', className: 'bg-buy', direction: 'long' as const }
    : { label: '平多', helper: '减多', className: 'bg-sell', direction: 'long' as const };
  const secondaryAction = positionMode === 'open'
    ? { label: '开空', helper: '看跌', className: 'bg-sell', direction: 'short' as const }
    : { label: '平空', helper: '减空', className: 'bg-buy', direction: 'short' as const };
  const pricePrecision = getInputPrecision(futuresRule?.pricePrecision, toRuleDecimal(futuresRule?.tickSize));
  const quantityPrecision = getInputPrecision(futuresRule?.qtyPrecision, toRuleDecimal(futuresRule?.stepSize));
  const amountPrecision = getInputPrecision(futuresRule?.amountPrecision);
  const quantityStep = toRuleDecimal(futuresRule?.stepSize);
  const marketPrice = toDecimalInput(ticker?.price ?? '');
  const referencePrice = isLimitOrder ? price : marketPrice;
  const orderQuantity = getFuturesBaseQuantityFromUnit({
    quantity,
    unit: quantityUnit,
    referencePrice,
    stepSize: quantityStep,
  });
  const quantityDisplayPrecision = quantityUnit === 'base' ? quantityPrecision : amountPrecision;
  const futuresBalance = useMemo(
    () => getFuturesBalance(accountAssets, marginCoin),
    [accountAssets, marginCoin],
  );
  const orderRule = useMemo(
    () => getFuturesOrderRule(futuresTradeConfig),
    [futuresTradeConfig],
  );
  const orderPositions = useMemo(
    () => futuresPositions.map((position) => ({
      positionSide: position.positionSide,
      availableQty: toRuleDecimal(position.availableQty ?? undefined) || '0',
    })),
    [futuresPositions],
  );
  const getValidation = (direction: FuturesOrderDirection) => getFuturesOrderValidation({
    rule: orderRule,
    balance: futuresBalance,
    positions: orderPositions,
    positionMode,
    direction,
    orderType,
    price,
    quantity: orderQuantity,
    marketPrice,
    quote: marginCoin,
    base,
    leverage: effectiveLeverage,
  });
  const primaryValidation = getValidation(primaryAction.direction);
  const secondaryValidation = getValidation(secondaryAction.direction);
  const maxOpenQuantity = normalizeQuantityToDisplayStep(getFuturesMaxOpenQuantity(futuresBalance?.availableBalance ?? '0', referencePrice, effectiveLeverage), quantityStep);
  const primaryPreviewQuantity = positionMode === 'open'
    ? maxOpenQuantity
    : getCloseAvailableQty(orderPositions, primaryAction.direction);
  const secondaryPreviewQuantity = positionMode === 'open'
    ? maxOpenQuantity
    : getCloseAvailableQty(orderPositions, secondaryAction.direction);
  const submitReason = !isAuthenticated
    ? '请先登录'
    : primaryValidation.reason || secondaryValidation.reason;
  const isSubmitting = placeOrder.isPending;

  useEffect(() => {
    onOrderBookLayoutChange({
      positionMode,
      takeProfitStopLossEnabled: positionMode === 'open' && takeProfitStopLossEnabled,
    });
  }, [onOrderBookLayoutChange, positionMode, takeProfitStopLossEnabled]);

  useEffect(() => {
    setOrderType('limit');
    setPositionMode('open');
    setPrice('');
    setQuantity('');
    setQuantityUnit('base');
    setTakeProfitStopLossEnabled(false);
    setTimeInForce('GTC');
    setShowTimeInForceDrawer(false);
  }, [setOrderType, symbol]);

  useEffect(() => {
    setQuantity('');
    setQuantityUnit('base');
  }, [positionMode, orderType]);

  useEffect(() => {
    if (!price && isLimitOrder) {
      setPrice(toDecimalInput(ticker?.price ?? ''));
    }
  }, [isLimitOrder, price, ticker?.price]);

  useEffect(() => {
    if (!selectedPrice || !isLimitOrder) return;

    setPrice(normalizeDecimalInput(selectedPrice.price, pricePrecision));
  }, [selectedPrice?.nonce, isLimitOrder, pricePrecision]);

  const normalizeQuantityToStep = (nextQuantity: string) => {
    if (!quantityStep) return nextQuantity;
    return floorDecimalToStep(nextQuantity, quantityStep);
  };
  const formatDisplayQuantity = (nextQuantity: string, nextUnit = quantityUnit) => {
    return normalizeDecimalInput(nextUnit === 'base' ? normalizeQuantityToStep(nextQuantity) : nextQuantity, nextUnit === 'base' ? quantityPrecision : amountPrecision);
  };
  const updateContractPriceByStep = (direction: 'down' | 'up') => {
    const priceStep = toRuleDecimal(futuresRule?.tickSize) || '0.01';
    const currentPrice = price || '0';
    const nextPrice = direction === 'up'
      ? addDecimalStrings(currentPrice, priceStep)
      : floorDecimalAtZero(subtractDecimalStrings(currentPrice, priceStep));

    setPrice(normalizeDecimalInput(nextPrice, pricePrecision));
  };
  const updateContractQuantityByStep = (direction: 'down' | 'up') => {
    const step = quantityUnit === 'base' ? quantityStep || '0.001' : '1';
    const currentQuantity = quantity || '0';
    const nextQuantity = direction === 'up'
      ? addDecimalStrings(currentQuantity, step)
      : floorDecimalAtZero(subtractDecimalStrings(currentQuantity, step));

    setQuantity(formatDisplayQuantity(nextQuantity));
  };

  const applyBalancePercent = (percent: number) => {
    const referencePrice = isLimitOrder ? price : marketPrice;
    const rawQuantity = positionMode === 'open'
      ? getFuturesMaxOpenQuantity(futuresBalance?.availableBalance ?? '0', referencePrice, effectiveLeverage)
      : getCloseAvailableQty(orderPositions, primaryAction.direction);
    const percentQuantity = divideDecimalStrings(multiplyDecimalStrings(rawQuantity, String(percent)), '100', 18);

    if (quantityUnit === 'quote') {
      setQuantity(formatDisplayQuantity(multiplyDecimalStrings(percentQuantity, referencePrice), 'quote'));
      return;
    }

    setQuantity(formatDisplayQuantity(percentQuantity, 'base'));
  };

  const changeQuantityUnit = (nextUnit: FuturesQuantityUnit) => {
    const nextQuantity = convertFuturesQuantityUnit({
      value: quantity,
      fromUnit: quantityUnit,
      toUnit: nextUnit,
      referencePrice,
      stepSize: quantityStep,
    });

    if (nextQuantity === null) return;

    setQuantityUnit(nextUnit);
    setQuantity(formatDisplayQuantity(nextQuantity, nextUnit));
  };

  const submitFuturesOrder = (direction: FuturesOrderDirection, validation = getValidation(direction)) => {
    if (!isAuthenticated || !validation.canSubmit || isSubmitting) return;

    placeOrder.mutate(buildFuturesOrderPayload({
      symbolCode: symbolFormat.toApi(symbol),
      positionMode,
      direction,
      orderType,
      price,
      quantity: orderQuantity,
      leverage: effectiveLeverage,
      timeInForce,
    }), {
      onSuccess: () => {
        setQuantity('');
      },
    });
  };
  const openLeverageModal = () => {
    if (!selectedLeverage) {
      setSelectedLeverage(effectiveLeverage);
    }
    openLeverage();
  };

  return (
    <div className="min-w-0">
      <Tabs value={positionMode} onValueChange={(value) => setPositionMode(value as ContractPositionMode)}>
        <TabsList className="mb-1.5 grid h-7 w-full grid-cols-2 items-stretch gap-0 overflow-hidden rounded-md bg-base2 p-0">
          <TabsTrigger
            value="open"
            className="h-full min-h-0 rounded-none border-0 py-0 text-[0.78rem] font-semibold text-muted-foreground shadow-none after:hidden data-[state=active]:bg-buy data-[state=active]:text-white dark:data-[state=active]:bg-buy dark:data-[state=active]:text-white"
          >
            开仓
          </TabsTrigger>
          <TabsTrigger
            value="close"
            className="h-full min-h-0 rounded-none border-0 py-0 text-[0.78rem] font-semibold text-muted-foreground shadow-none after:hidden data-[state=active]:bg-sell data-[state=active]:text-white dark:data-[state=active]:bg-sell dark:data-[state=active]:text-white"
          >
            平仓
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-1.5 grid grid-cols-3 gap-1">
        <button className="h-7 rounded-md bg-base2 text-[0.58rem] font-semibold text-muted-foreground cursor-not-allowed" disabled type="button">
          <span className="inline-block scale-[0.86] leading-none">{marginModeLabel}</span>
        </button>
        <button className="h-7 rounded-md bg-base2 text-[0.62rem] font-semibold text-brand transition hover:bg-soft cursor-pointer" onClick={openLeverageModal} type="button">
          <span className="inline-block scale-[0.9] leading-none">{leverageText}</span>
        </button>
        <button className="h-7 rounded-md bg-base2 text-[0.58rem] font-semibold text-muted-foreground cursor-not-allowed" disabled type="button">
          <span className="inline-block scale-[0.86] leading-none">{positionModeLabel}</span>
        </button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="mb-1.5 flex h-7 w-full items-center justify-between rounded-md bg-base2 px-2.5 text-[0.66rem] font-semibold text-ink transition-colors hover:bg-soft cursor-pointer" type="button">
            <span className="inline-block scale-[0.9] leading-none">{getOrderTypeLabel(orderType)}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="border border-line bg-panel text-ink">
          <DropdownMenuItem className="cursor-pointer text-[0.78rem]" onSelect={() => setOrderType('limit')}>
            限价单
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-[0.78rem]" onSelect={() => setOrderType('market')}>
            市价单
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isLimitOrder ? (
        <TradeInput
          value={price}
          onValueChange={(value) => setPrice(normalizeDecimalInput(value, pricePrecision))}
          placeholder="价格"
          suffix={quote}
          onStepDown={() => updateContractPriceByStep('down')}
          onStepUp={() => updateContractPriceByStep('up')}
          dense
          emphasis
          feedbackKey={selectedPrice?.nonce}
          ariaLabel={`委托价格(${quote})`}
        />
      ) : (
        <div className="flex h-[2.75rem] items-center rounded-lg border border-transparent bg-soft px-3 text-[0.76rem] font-semibold text-muted-foreground/70">
          {marketPlaceholder}
        </div>
      )}

      <label className="mb-1 mt-1.5 block text-[0.64rem] text-muted-foreground">数量</label>
      <TradeInput
        value={quantity}
        onValueChange={(value) => setQuantity(normalizeDecimalInput(value, quantityDisplayPrecision))}
        placeholder="数量"
        suffix={quantityUnit === 'base' ? base : marginCoin}
        suffixNode={
          <ContractQuantityUnitMenu
            base={base}
            quote={marginCoin}
            selected={quantityUnit}
            onSelect={changeQuantityUnit}
          />
        }
        onStepDown={() => updateContractQuantityByStep('down')}
        onStepUp={() => updateContractQuantityByStep('up')}
        dense
        ariaLabel={`合约数量(${quantityUnit === 'base' ? base : marginCoin})`}
      />
      <div className="pt-1.5">
        <PercentRail compact resetKey={`${symbol}:${positionMode}:${orderType}:${quantityUnit}`} onPercentChange={applyBalancePercent} />
      </div>

      <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2 text-[0.64rem] text-muted-foreground">
        <span>可用</span>
        <span className="flex min-w-0 items-center gap-1 font-mono text-ink tabular-nums">
          {formatDecimalDisplay(futuresBalance?.availableBalance)} {marginCoin}
          <button
            aria-label={`划转${marginCoin}到合约账户`}
            className="grid size-5 shrink-0 place-items-center rounded-sm text-brand transition hover:bg-brand/10 active:bg-brand/15 cursor-pointer"
            onClick={() => openTransfer('FUND', 'FUTURES', marginCoin)}
            type="button"
          >
            <ArrowLeftRight className="size-3.5" />
          </button>
        </span>
      </div>

      {positionMode === 'open' && (
        <div className="my-2 border-t border-line pt-2">
          <CheckRow
            checked={takeProfitStopLossEnabled}
            compact
            label="止盈/止损"
            onCheckedChange={setTakeProfitStopLossEnabled}
          />
          {takeProfitStopLossEnabled && (
            <div className="mt-1.5 space-y-1.5">
              <ContractTriggerPriceInput label="止盈" quote={quote} />
              <ContractTriggerPriceInput label="止损" quote={quote} />
            </div>
          )}
        </div>
      )}

      {isLimitOrder && (
        <button
          className="mb-1.5 flex items-center gap-0.5 text-xs font-semibold leading-none text-muted-foreground transition-colors hover:text-ink cursor-pointer"
          onClick={() => setShowTimeInForceDrawer(true)}
          type="button"
        >
          <span className="text-xs leading-none">{timeInForce}</span>
          <ChevronDown className="size-2.5" />
        </button>
      )}

      <ContractTimeInForceDrawer
        open={showTimeInForceDrawer}
        selected={timeInForce}
        onOpenChange={setShowTimeInForceDrawer}
        onSelect={(nextValue) => {
          setTimeInForce(nextValue);
          setShowTimeInForceDrawer(false);
        }}
      />

      <div className="space-y-1.5">
        <ContractActionPreview
          base={base}
          label={contractMetricLabel}
          marginValue={primaryValidation.requiredMargin}
          positionMode={positionMode}
          quantityValue={primaryPreviewQuantity}
          quote={marginCoin}
        />
        <button
          className={`flex h-9 w-full items-center justify-center gap-2.5 rounded-md text-[0.84rem] font-semibold text-white transition active:brightness-90 ${primaryAction.className} ${!isAuthenticated || !primaryValidation.canSubmit || isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          disabled={!isAuthenticated || !primaryValidation.canSubmit || isSubmitting}
          onClick={() => submitFuturesOrder(primaryAction.direction, primaryValidation)}
          type="button"
        >
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          <span>{isSubmitting ? '提交中' : primaryAction.label}</span>
          <span className="text-[0.62rem] font-medium opacity-85">{primaryAction.helper}</span>
        </button>
        <ContractActionPreview
          base={base}
          label={contractMetricLabel}
          marginValue={secondaryValidation.requiredMargin}
          positionMode={positionMode}
          quantityValue={secondaryPreviewQuantity}
          quote={marginCoin}
        />
        <button
          className={`flex h-9 w-full items-center justify-center gap-2.5 rounded-md text-[0.84rem] font-semibold text-white transition active:brightness-90 ${secondaryAction.className} ${!isAuthenticated || !secondaryValidation.canSubmit || isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          disabled={!isAuthenticated || !secondaryValidation.canSubmit || isSubmitting}
          onClick={() => submitFuturesOrder(secondaryAction.direction, secondaryValidation)}
          type="button"
        >
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          <span>{isSubmitting ? '提交中' : secondaryAction.label}</span>
          <span className="text-[0.62rem] font-medium opacity-85">{secondaryAction.helper}</span>
        </button>
      </div>
      {submitReason && (
        <p className="mt-2 min-h-4 truncate text-[0.64rem] leading-none text-warning">
          {submitReason}
        </p>
      )}

      <div className="mt-2 space-y-0.5 text-[0.64rem] leading-tight">
        <MetricLine label="最小名义额" value={`${formatDecimalDisplay(futuresRule?.minNotional)} ${quote}`} />
        <MetricLine label="步长" value={formatDecimalDisplay(futuresRule?.stepSize)} />
      </div>
    </div>
  );
}

function ContractQuantityUnitMenu({
  base,
  quote,
  selected,
  onSelect,
}: {
  base: string;
  quote: string;
  selected: FuturesQuantityUnit;
  onSelect: (unit: FuturesQuantityUnit) => void;
}) {
  const label = selected === 'base' ? base : quote;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="切换合约数量单位"
          className="flex min-w-[3.25rem] shrink-0 cursor-pointer items-center justify-end gap-1 rounded-sm px-1 text-[0.84rem] font-semibold text-ink transition-colors hover:bg-soft"
          type="button"
        >
          <span className="max-w-[3.7rem] truncate">{label}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[6.5rem] border border-line bg-panel text-ink">
        {[
          { value: 'base' as const, label: base },
          { value: 'quote' as const, label: quote },
        ].map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={`cursor-pointer text-[0.78rem] ${selected === option.value ? 'bg-base2 text-brand' : ''}`}
            onSelect={() => onSelect(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContractTimeInForceDrawer({
  open,
  selected,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  selected: FuturesTimeInForce;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: FuturesTimeInForce) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[78vh] w-full max-w-[430px] border-line bg-panel px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-ink">
        <div className="pt-5">
          <DrawerTitle className="text-left text-[1.05rem] font-semibold text-ink">订单时效</DrawerTitle>
        </div>
        <div className="mt-5 space-y-3">
          {contractTimeInForceOptions.map((option) => {
            const isSelected = selected === option.value;

            return (
              <button
                key={option.value}
                className={`w-full cursor-pointer rounded-lg border px-4 py-3.5 text-left transition-colors active:bg-soft ${
                  isSelected
                    ? 'border-ink bg-base2 text-ink'
                    : 'border-line bg-base2/45 text-ink hover:border-ink/60 hover:bg-base2'
                }`}
                onClick={() => onSelect(option.value)}
                type="button"
              >
                <span className="block text-[0.92rem] font-semibold leading-none">{option.label}</span>
                <span className="mt-2 block text-[0.74rem] leading-none text-muted-foreground">{option.description}</span>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ContractTriggerPriceInput({ label, quote }: { label: string; quote: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[0.62rem] text-muted-foreground">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-0.5 cursor-pointer" type="button">
            高级 <ChevronDown className="size-3" />
          </button>
          <button className="flex items-center gap-0.5 cursor-pointer" type="button">
            最新 <ChevronDown className="size-3" />
          </button>
        </div>
      </div>
      <div className="flex h-8 min-w-0 items-center rounded-md border border-line bg-base2 px-2.5 text-[0.72rem] text-muted-foreground">
        <span className="min-w-0 flex-1 text-center font-semibold">价格</span>
        <span className="border-l border-line pl-2 font-semibold text-ink">{quote}</span>
      </div>
    </div>
  );
}

function ContractActionPreview({
  base,
  label,
  marginValue,
  positionMode,
  quantityValue,
  quote,
}: {
  base: string;
  label: string;
  marginValue?: string;
  positionMode: ContractPositionMode;
  quantityValue?: string;
  quote: string;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-2 text-[0.64rem] leading-tight text-muted-foreground">
      <span>{label}</span>
      <span className="min-w-0 text-right font-mono text-[0.68rem] text-ink tabular-nums">
        {formatDecimalDisplay(quantityValue)} {base}
        {positionMode === 'open' && (
          <>
            <br />
            <span className="text-[0.62rem] text-muted-foreground">保证金</span> {formatDecimalDisplay(marginValue)} {quote}
          </>
        )}
      </span>
    </div>
  );
}

function TradeInput({
  value = '',
  placeholder,
  suffix,
  suffixNode,
  onValueChange,
  onStepDown,
  onStepUp,
  stepDisabled = false,
  dropdown = false,
  large = false,
  compact = false,
  dense = false,
  emphasis = false,
  readOnly = false,
  disabled = false,
  feedbackKey,
  ariaLabel,
}: {
  value?: string;
  placeholder?: string;
  suffix: string;
  suffixNode?: ReactNode;
  onValueChange?: (value: string) => void;
  onStepDown?: () => void;
  onStepUp?: () => void;
  stepDisabled?: boolean;
  dropdown?: boolean;
  large?: boolean;
  compact?: boolean;
  dense?: boolean;
  emphasis?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  feedbackKey?: number;
  ariaLabel?: string;
}) {
  const heightClass = dense ? 'h-[2.95rem]' : compact ? 'h-[3.25rem]' : 'h-[3.95rem]';
  const inputSizeClass = dense
    ? `${emphasis ? 'text-[1rem]' : 'text-[0.94rem]'} font-semibold`
    : compact
      ? `${emphasis ? 'text-[1.14rem]' : 'text-[1.05rem]'} font-semibold`
      : large
        ? 'text-[1.35rem] font-semibold'
        : 'text-[1rem]';
  const suffixSizeClass = dense ? 'text-[0.84rem]' : compact ? 'text-[0.84rem]' : 'text-[0.92rem]';
  const hasSteppers = Boolean(onStepDown || onStepUp);
  const stepButtonClass = `${dense ? 'grid h-full w-7 place-items-center text-[1.22rem]' : 'grid size-6 place-items-center rounded-md'} shrink-0 text-muted-foreground transition-colors ${
    stepDisabled || disabled ? 'opacity-45' : 'cursor-pointer hover:bg-soft2 hover:text-ink active:bg-line/80'
  }`;
  const stepTarget = ariaLabel ?? suffix;

  return (
    <div
      key={feedbackKey ?? 'stable-input-shell'}
      className={`flex ${heightClass} min-w-0 items-center ${dense && hasSteppers ? 'gap-2 rounded-lg px-2' : 'gap-2 rounded-lg px-2.5'} border transition-colors duration-200 focus-within:border-muted-foreground/70 ${
        feedbackKey ? 'price-fill-pulse border-line bg-base2' : 'border-line bg-base2'
      }`}
    >
      {hasSteppers && (
        <button
          aria-label={`减少${stepTarget}`}
          className={stepButtonClass}
          disabled={stepDisabled || disabled}
          onClick={onStepDown}
          type="button"
        >
          {dense ? '−' : <Minus className="size-3.5" />}
        </button>
      )}
      <Input
        aria-label={ariaLabel}
        className={`h-full min-w-0 flex-1 border-0 bg-transparent px-0 py-0 font-mono text-ink shadow-none outline-none ring-0 placeholder:text-muted-foreground focus-visible:border-0 focus-visible:ring-0 disabled:bg-transparent disabled:opacity-60 tabular-nums ${inputSizeClass}`}
        value={value}
        placeholder={placeholder}
        inputMode="decimal"
        readOnly={readOnly || !onValueChange}
        disabled={disabled}
        onChange={(event) => onValueChange?.(event.target.value)}
      />
      {suffixNode ?? (
        <span className={`flex min-w-[3.25rem] shrink-0 items-center justify-end gap-1 font-semibold text-ink ${suffixSizeClass}`}>
          {suffix}
          {dropdown && <ChevronDown className="size-3.5 text-muted-foreground" />}
        </span>
      )}
      {hasSteppers && (
        <button
          aria-label={`增加${stepTarget}`}
          className={stepButtonClass}
          disabled={stepDisabled || disabled}
          onClick={onStepUp}
          type="button"
        >
          {dense ? '＋' : <Plus className="size-3.5" />}
        </button>
      )}
    </div>
  );
}

function PercentRail({ compact = false, resetKey, onPercentChange }: { compact?: boolean; resetKey?: string; onPercentChange?: (percent: number) => void }) {
  const [percent, setPercent] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const points = [0, 25, 50, 75, 100];

  useEffect(() => {
    setPercent(0);
    setShowTooltip(false);
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, [resetKey]);

  const showTooltipNow = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    setShowTooltip(true);
  };
  const hideTooltipSoon = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowTooltip(false), 700);
  };

  return (
    <div className={compact ? 'mb-1 -mt-0.5' : 'mb-4 -mt-0.5'}>
      <div className={compact ? 'relative h-[2rem] px-2' : 'relative h-[3rem] px-3'}>
        {showTooltip && (
          <div
            className="absolute -top-[1.35rem] z-30 -translate-x-1/2 rounded-md bg-soft2 px-2.5 py-1.5 font-mono text-[0.78rem] font-semibold leading-none text-ink shadow-lg shadow-black/25 after:absolute after:left-1/2 after:top-full after:size-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:bg-soft2"
            style={{ left: `calc(${compact ? '0.5rem' : '0.75rem'} + (100% - ${compact ? '1rem' : '1.5rem'}) * ${percent / 100})` }}
          >
            {percent}%
          </div>
        )}

        <Slider
          className={`${compact ? 'px-2' : 'px-3'} absolute inset-x-0 top-[0.34rem] z-20 h-5 [&_[data-slot=slider-range]]:bg-ink [&_[data-slot=slider-thumb]]:z-20 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:rotate-45 [&_[data-slot=slider-thumb]]:rounded-[4px] [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-ink [&_[data-slot=slider-thumb]]:ring-0 [&_[data-slot=slider-thumb]]:after:hidden [&_[data-slot=slider-track]]:h-px [&_[data-slot=slider-track]]:overflow-visible [&_[data-slot=slider-track]]:bg-line`}
          max={100}
          min={0}
          step={1}
          value={[percent]}
          onBlur={hideTooltipSoon}
          onFocus={showTooltipNow}
          onPointerDown={showTooltipNow}
          onPointerUp={hideTooltipSoon}
          onValueChange={(value) => {
            const nextPercent = value[0] ?? 0;
            setPercent(nextPercent);
            onPercentChange?.(nextPercent);
            showTooltipNow();
          }}
        />

        {points.map((point) => (
          <span
            key={point}
            className={`pointer-events-none absolute top-[0.97rem] z-10 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] ${
              point <= percent ? 'bg-ink' : 'bg-soft2'
            }`}
            style={{ left: `calc(${compact ? '0.5rem' : '0.75rem'} + (100% - ${compact ? '1rem' : '1.5rem'}) * ${point / 100})` }}
          />
        ))}

        {!compact && (
          <div className="absolute inset-x-0 top-[2.12rem] text-[0.74rem] font-medium text-muted-foreground">
            {points.map((point) => (
              <span
                key={point}
                className="absolute -translate-x-1/2"
                style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${point / 100})` }}
              >
                {point}%
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckRow({
  label,
  compact = false,
  checked,
  onCheckedChange,
}: {
  label: string;
  compact?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isChecked = checked ?? internalChecked;
  const updateChecked = (nextChecked: boolean) => {
    if (checked === undefined) setInternalChecked(nextChecked);
    onCheckedChange?.(nextChecked);
  };

  return (
    <label className={`flex items-center gap-2 text-ink ${compact ? 'text-[0.72rem]' : 'text-[0.96rem]'}`}>
      <input className="sr-only" type="checkbox" checked={isChecked} onChange={(event) => updateChecked(event.target.checked)} />
      <span className={`grid place-items-center rounded border ${compact ? 'size-3.5' : 'size-[1.15rem]'} ${isChecked ? 'border-brand bg-brand' : 'border-line bg-base2'}`}>
        {isChecked && <span className={`${compact ? 'size-1.5' : 'size-2'} rounded-full bg-primary-foreground`} />}
      </span>
      {label}
    </label>
  );
}

function DepthViewButton({
  mode,
  activeMode,
  label,
  onSelect,
}: {
  mode: DepthViewMode;
  activeMode: DepthViewMode;
  label: string;
  onSelect: (mode: DepthViewMode) => void;
}) {
  const Icon = mode === 'both' ? Columns2 : mode === 'buy' ? PanelBottom : PanelTop;
  const active = mode === activeMode;

  return (
    <button
      aria-label={label}
      title={label}
      className={`grid h-6 w-7 place-items-center rounded-[5px] transition-colors cursor-pointer ${
        active ? 'bg-soft2 text-ink shadow-inner shadow-black/20' : 'text-muted-foreground hover:bg-soft hover:text-ink'
      }`}
      onClick={() => onSelect(mode)}
      type="button"
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function DepthRows({
  rows,
  side,
  maxAmount,
  isLoading,
  onSelectPrice,
  compact = false,
}: {
  rows: ReturnType<typeof formatDepthRow>[];
  side: 'buy' | 'sell';
  maxAmount: number;
  isLoading: boolean;
  onSelectPrice?: (price: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`${side === 'sell' ? 'mt-1.5' : ''} space-y-0.5 font-mono`}>
      {rows.length > 0 ? (
        rows.map((row, rowIndex) => (
          <DepthRow
            key={`${side}-${row.price}-${rowIndex}`}
            price={row.price}
            amount={row.amount}
            quantity={row.quantity}
            maxAmount={maxAmount}
            side={side}
            onSelectPrice={onSelectPrice}
            compact={compact}
          />
        ))
      ) : (
        <DepthEmptyRows label={isLoading ? '加载中' : side === 'sell' ? '暂无卖盘' : '暂无买盘'} />
      )}
    </div>
  );
}

function DepthEmptyRows({ label }: { label: string }) {
  return (
    <div className="grid h-[6.375rem] place-items-center text-[0.72rem] text-muted-foreground">
      {label}
    </div>
  );
}

function DepthRow({
  price,
  amount,
  quantity,
  maxAmount,
  side,
  onSelectPrice,
  compact = false,
}: {
  price: string;
  amount: string;
  quantity: number;
  maxAmount: number;
  side: 'buy' | 'sell';
  onSelectPrice?: (price: string) => void;
  compact?: boolean;
}) {
  const width = maxAmount > 0 ? Math.max(12, Math.min(100, (quantity / maxAmount) * 100)) : 0;
  const fillScale = width / 100;
  const depthColor = side === 'buy' ? 'bg-buy/8' : 'bg-sell/8';
  const textColor = side === 'buy' ? 'text-buy' : 'text-sell';
  const clickable = Boolean(onSelectPrice);
  const textSizeClass = compact ? 'text-[0.66rem]' : 'text-[0.72rem]';
  const handleSelectPrice = () => onSelectPrice?.(toDecimalInput(price));

  return (
    <button
      className={`relative grid w-full grid-cols-2 items-center overflow-hidden px-1 text-left tabular-nums transition-colors ${
        compact ? 'h-[1.08rem]' : 'h-5'
      } ${clickable ? 'cursor-pointer hover:bg-white/[0.035] active:bg-white/[0.055]' : ''}`}
      disabled={!clickable}
      onClick={handleSelectPrice}
      onPointerDown={handleSelectPrice}
      type="button"
    >
      <span className={`depth-liquidity-bar absolute inset-y-0 right-0 w-full origin-right ${depthColor}`} style={{ transform: `scaleX(${fillScale})` }} />
      <span className={`relative ${textColor} ${textSizeClass}`}>{price}</span>
      <span className={`relative text-right text-ink ${textSizeClass}`}>{amount}</span>
    </button>
  );
}

function LatestTrades({ trades, base, isLoading }: { trades: MarketTrade[]; base: string; isLoading: boolean }) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(4.5rem,0.72fr)] gap-2 px-1 text-[0.68rem] text-muted-foreground">
        <span>时间</span>
        <span>价格(USDT)</span>
        <span className="text-right">数量({base})</span>
      </div>
      <div className="mt-2 min-h-[10.75rem] space-y-1 font-mono">
        {trades.length > 0 ? (
          trades.map((trade) => (
            <div key={trade.tradeId} className="grid h-5 grid-cols-[4.5rem_minmax(0,1fr)_minmax(4.5rem,0.72fr)] items-center gap-2 px-1 text-[0.72rem] tabular-nums">
              <span className="text-ink/90">{formatTradeTime(trade.tradeTime)}</span>
              <span className={trade.buyerMaker ? 'text-sell' : 'text-buy'}>{formatPriceString(trade.price)}</span>
              <span className="text-right text-ink">{formatTradeQuantity(trade.quantity)}</span>
            </div>
          ))
        ) : (
          <div className="grid min-h-[10.75rem] place-items-center text-[0.72rem] text-muted-foreground">
            {isLoading ? '加载中' : '暂无成交'}
          </div>
        )}
      </div>
    </div>
  );
}

function MarketPicker({
  open,
  mode,
  currentSymbol,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  mode: TradeMode;
  currentSymbol: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (symbol: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MarketPickerTab>('热门');
  const isLogin = useAuthStore((state) => state.isLogin);
  const isContract = mode === 'contract';
  const isFavoriteTab = activeTab === '自选';
  const normalizedQuery = query.trim();
  const marketTab = activeTab === '热门' ? 'HOT' : activeTab === '涨幅榜' ? 'GAINERS' : 'LOSERS';
  const { data: marketList = [], isLoading: marketLoading } = useSpotMarketList({
    keyword: normalizedQuery || undefined,
    tab: marketTab,
  }, !isFavoriteTab && !isContract);
  const { data: futuresMarketList = [], isLoading: futuresMarketLoading } = useFuturesMarketList({
    keyword: normalizedQuery || undefined,
    tab: marketTab,
  }, !isFavoriteTab && isContract);
  const { data: favoriteList = [], isLoading: favoritesLoading } = useSpotFavorites(isFavoriteTab && isLogin && !isContract);
  const favoriteRows = isLogin ? favoriteList : [];
  const rowsSource = isFavoriteTab ? (isContract ? [] : favoriteRows) : isContract ? futuresMarketList : marketList;
  const rows = Array.isArray(rowsSource) ? rowsSource : [];
  const isLoading = isFavoriteTab && isLogin && !isContract ? favoritesLoading : isContract && !isFavoriteTab ? futuresMarketLoading : marketLoading;
  const emptyText = isFavoriteTab && isContract ? '合约自选暂未开放' : isFavoriteTab && !isLogin ? '请登录后查看' : isFavoriteTab ? '暂无自选' : '暂无交易对';

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="max-h-[92vh] overflow-hidden rounded-t-xl border-line bg-panel p-0 text-ink shadow-2xl [&>div:first-child]:hidden">
        <div className="relative flex h-14 items-center justify-center border-b border-line">
          <DrawerTitle className="text-[1.08rem] font-semibold text-ink">市场</DrawerTitle>
          <DrawerClose className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="关闭市场选择">
            <X className="size-6 text-muted-foreground" />
          </DrawerClose>
        </div>

        <div className="px-4 pt-3">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-base px-3 text-muted-foreground">
            <Search className="size-5" />
            <input
              className="min-w-0 flex-1 bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-muted-foreground"
              placeholder="搜索"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="no-scrollbar -mx-1 mt-4 flex items-center gap-5 overflow-x-auto whitespace-nowrap px-1 text-[0.82rem] font-semibold text-muted-foreground">
            {marketPickerTabs.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'relative shrink-0 pb-2 text-ink after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-ink cursor-pointer' : 'shrink-0 pb-2 transition-colors hover:text-ink cursor-pointer'}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_128px] text-[0.68rem] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              币种 <ChevronDown className="size-3 rotate-180" />
            </span>
            <span className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
              最新价 <ChevronDown className="size-3 rotate-180" /> / 24h涨幅 <ChevronDown className="size-3 rotate-180" />
            </span>
          </div>
        </div>

        <div className="mt-2 max-h-[60vh] overflow-y-auto pb-6">
          {isLoading ? (
            <div className="py-12 text-center text-[0.82rem] text-muted-foreground">加载中...</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-[0.82rem] text-muted-foreground">{emptyText}</div>
          ) : rows.map((row) => {
            const symbol = symbolFormat.normalize(row.symbolCode);
            const active = symbol === currentSymbol;
            return (
              <button
                key={row.symbolCode}
                className={`grid w-full grid-cols-[minmax(0,1fr)_128px] items-center px-4 py-3 text-left ${active ? 'bg-white/[0.035]' : ''}`}
                onClick={() => onSelect(symbol)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Star className={`size-4 shrink-0 ${active ? 'fill-ink text-ink' : 'fill-muted-foreground text-muted-foreground'}`} />
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[0.62rem] font-bold text-primary-foreground">
                    {row.baseCoinCode.slice(0, 1)}
                  </span>
                  <span className="truncate text-[0.95rem] font-semibold">{symbol}</span>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[0.9rem] font-semibold text-ink tabular-nums">{formatNullableMarketPrice(row.lastPrice)}</p>
                  <p className={`mt-1 font-mono text-[0.78rem] tabular-nums ${getChangeClass(row.priceChangePercent)}`}>
                    {formatNullableMarketPercent(row.priceChangePercent)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CurrentOrders({ mode = 'spot', symbol }: { mode?: TradeMode; symbol?: string }) {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
  const isLogin = useAuthStore((state) => state.isLogin);
  const isContract = mode === 'contract';
  const queryEnabled = Boolean(symbol) && isLogin;
  const { data: spotOpenOrders = [], isLoading: spotOpenLoading } = useSpotOpenOrders(symbol ?? '', queryEnabled && !isContract && activeTab === 'open');
  const { data: spotHistoryPage, isLoading: spotHistoryLoading } = useSpotOrderHistory(symbol ?? '', queryEnabled && !isContract && activeTab === 'history');
  const { data: futuresOpenOrders = [], isLoading: futuresOpenLoading } = useFuturesOpenOrders(symbol ?? '', queryEnabled && isContract && activeTab === 'open', {
    refetchInterval: 3000,
    staleTime: 3000,
  });
  const { data: futuresHistoryPage, isLoading: futuresHistoryLoading } = useFuturesOrderHistory(symbol ?? '', queryEnabled && isContract && activeTab === 'history');
  const { data: spotOrderDetail, isLoading: spotDetailLoading } = useSpotOrderDetail(selectedOrderNo, Boolean(selectedOrderNo) && !isContract);
  const { data: futuresOrderDetail, isLoading: futuresDetailLoading } = useFuturesOrderDetail(selectedOrderNo, Boolean(selectedOrderNo) && isContract);
  const spotCancelOrder = useCancelSpotOrder();
  const futuresCancelOrder = useCancelFuturesOrder();
  const cancelOrder = isContract ? futuresCancelOrder : spotCancelOrder;
  const rows = isContract
    ? activeTab === 'open' ? futuresOpenOrders : futuresHistoryPage?.list ?? []
    : activeTab === 'open' ? spotOpenOrders : spotHistoryPage?.list ?? [];
  const isLoading = isContract
    ? activeTab === 'open' ? futuresOpenLoading : futuresHistoryLoading
    : activeTab === 'open' ? spotOpenLoading : spotHistoryLoading;
  const orderDetail = isContract ? futuresOrderDetail : spotOrderDetail;
  const detailLoading = isContract ? futuresDetailLoading : spotDetailLoading;

  const cancelSelectedOrder = (orderNo: string) => {
    cancelOrder.mutate({ orderNo, remark: '用户主动撤单' });
  };

  return (
    <div className="col-span-full -mx-4 mt-5 border-t border-line px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="no-scrollbar flex min-w-0 gap-4 overflow-x-auto whitespace-nowrap text-[0.9rem] font-semibold">
          <button className={`shrink-0 cursor-pointer ${activeTab === 'open' ? 'text-ink' : 'text-muted-foreground'}`} onClick={() => setActiveTab('open')} type="button">当前委托</button>
          <button className={`shrink-0 cursor-pointer ${activeTab === 'history' ? 'text-ink' : 'text-muted-foreground'}`} onClick={() => setActiveTab('history')} type="button">历史委托</button>
        </div>
        <FileText className="size-4.5 text-muted-foreground" />
      </div>

      {isLoading ? (
        <div className="grid min-h-[70px] place-items-center text-[0.78rem] text-muted-foreground">
          <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" />加载中</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="grid min-h-[70px] place-items-center text-muted-foreground">
          <div className="text-center">
            <WalletCards className="mx-auto mb-1.5 size-6" />
            <p className="text-[0.78rem]">
              {!isLogin ? '请先登录查看委托' : isContract ? '暂无合约委托' : symbol ? '暂无订单' : '暂无现货订单'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.map((order) => (
            <OrderRow
              key={order.orderNo}
              cancelPending={cancelOrder.isPending}
              onCancel={cancelSelectedOrder}
              onOpenDetail={setSelectedOrderNo}
              order={order}
              showCancel={activeTab === 'open'}
            />
          ))}
        </div>
      )}

      <OrderDetailDrawer
        loading={detailLoading}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderNo(null);
        }}
        open={Boolean(selectedOrderNo)}
        order={orderDetail}
      />
    </div>
  );
}

function OrderRow({
  order,
  showCancel,
  cancelPending,
  onCancel,
  onOpenDetail,
}: {
  order: SpotOrder | FuturesOrder;
  showCancel: boolean;
  cancelPending: boolean;
  onCancel: (orderNo: string) => void;
  onOpenDetail: (orderNo: string) => void;
}) {
  const sideClass = order.side === 'BUY' ? 'text-buy' : 'text-sell';
  const canCancel = showCancel && !isFinalOrderStatus(order.orderStatus);
  const isFutures = isFuturesOrder(order);

  return (
    <div className="rounded-md border border-line bg-base2/45 px-3 py-2.5">
      <button className="w-full cursor-pointer text-left" onClick={() => onOpenDetail(order.orderNo)} type="button">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[0.82rem] font-semibold text-ink">{symbolFormat.normalize(order.symbolCode)}</p>
            <p className="mt-1 text-[0.68rem] text-muted-foreground">{formatOrderTime(order.submitTime ?? order.createTime)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-[0.78rem] font-semibold ${sideClass}`}>
              {isFutures ? formatFuturesTradeAction(order.tradeAction) : formatOrderSide(order.side)} · {formatOrderType(order.orderType)}
            </p>
            <p className="mt-1 text-[0.68rem] text-muted-foreground">{formatOrderStatus(order.orderStatus)}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[0.68rem]">
          <OrderMetric label="价格" value={formatDecimalDisplay(order.price)} />
          <OrderMetric label="数量" value={formatDecimalDisplay(order.quantity)} />
          <OrderMetric label="成交" value={formatDecimalDisplay(order.executedQuantity)} />
          {isFutures && (
            <>
              <OrderMetric label="保证金" value={formatDecimalDisplay(order.frozenMargin)} />
              <OrderMetric label="PnL" value={formatDecimalDisplay(order.realizedPnl)} />
              <OrderMetric label="杠杆" value={order.leverage ? `${order.leverage}x` : '--'} />
            </>
          )}
        </div>
      </button>
      {canCancel && (
        <button
          className="mt-2 h-8 w-full rounded-md border border-line text-[0.76rem] font-semibold text-ink transition-colors hover:bg-soft disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          disabled={cancelPending}
          onClick={() => onCancel(order.orderNo)}
          type="button"
        >
          {cancelPending ? '撤单中' : '撤单'}
        </button>
      )}
    </div>
  );
}

function OrderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-ink tabular-nums">{value || '--'}</p>
    </div>
  );
}

function OrderDetailDrawer({
  open,
  order,
  loading,
  onOpenChange,
}: {
  open: boolean;
  order?: SpotOrder | FuturesOrder;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="max-h-[86vh] rounded-t-xl border-line bg-panel p-0 text-ink [&>div:first-child]:hidden">
        <div className="relative flex h-13 items-center justify-center border-b border-line">
          <DrawerTitle className="text-[1rem] font-semibold">订单详情</DrawerTitle>
          <DrawerClose className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" aria-label="关闭订单详情">
            <X className="size-5 text-muted-foreground" />
          </DrawerClose>
        </div>
        {loading || !order ? (
          <div className="grid min-h-[12rem] place-items-center text-[0.8rem] text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" />加载中</span>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto px-4 py-4 text-[0.8rem]">
            <DetailLine label="订单号" value={order.orderNo} />
            <DetailLine label="交易对" value={symbolFormat.normalize(order.symbolCode)} />
            {isFuturesOrder(order) ? (
              <FuturesOrderDetailLines order={order} />
            ) : (
              <SpotOrderDetailLines order={order} />
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function SpotOrderDetailLines({ order }: { order: SpotOrder }) {
  return (
    <>
      <DetailLine label="方向/类型" value={`${formatOrderSide(order.side)} · ${formatOrderType(order.orderType)}`} />
      <DetailLine label="状态" value={formatOrderStatus(order.orderStatus)} />
      <DetailLine label="委托价格" value={formatDecimalDisplay(order.price)} />
      <DetailLine label="委托数量" value={formatDecimalDisplay(order.quantity)} />
      <DetailLine label="委托金额" value={formatDecimalDisplay(order.quoteAmount)} />
      <DetailLine label="成交数量" value={formatDecimalDisplay(order.executedQuantity)} />
      <DetailLine label="成交金额" value={formatDecimalDisplay(order.executedQuoteAmount)} />
      <DetailLine label="成交均价" value={formatDecimalDisplay(order.avgPrice)} />
      <DetailLine label="手续费" value={`${formatDecimalDisplay(order.feeAmount)} ${order.feeCoinCode ?? ''}`.trim()} />
      <DetailLine label="冻结" value={`${formatDecimalDisplay(order.frozenAmount)} ${order.frozenCoinCode ?? ''}`.trim()} />
      <DetailLine label="提交时间" value={formatOrderTime(order.submitTime ?? order.createTime)} />
      <DetailLine label="完成时间" value={formatOrderTime(order.finishTime)} />
      {order.cancelReason && <DetailLine label="原因" value={order.cancelReason} />}
    </>
  );
}

function FuturesOrderDetailLines({ order }: { order: FuturesOrder }) {
  return (
    <>
      <DetailLine label="方向/类型" value={`${formatFuturesTradeAction(order.tradeAction)} · ${formatOrderType(order.orderType)}`} />
      <DetailLine label="状态" value={formatOrderStatus(order.orderStatus)} />
      <DetailLine label="仓位方向" value={`${formatPositionSide(order.positionSide)} · ${order.leverage ? `${order.leverage}x` : '--'}`} />
      <DetailLine label="委托价格" value={formatDecimalDisplay(order.price)} />
      <DetailLine label="委托数量" value={formatDecimalDisplay(order.quantity)} />
      <DetailLine label="成交数量" value={formatDecimalDisplay(order.executedQuantity)} />
      <DetailLine label="成交均价" value={formatDecimalDisplay(order.avgPrice)} />
      <DetailLine label="冻结保证金" value={formatDecimalDisplay(order.frozenMargin)} />
      <DetailLine label="已实现盈亏" value={formatDecimalDisplay(order.realizedPnl)} />
      <DetailLine label="手续费" value={formatDecimalDisplay(order.feeAmount)} />
      <DetailLine label="提交时间" value={formatOrderTime(order.submitTime ?? order.createTime)} />
      <DetailLine label="完成时间" value={formatOrderTime(order.finishTime)} />
      {order.cancelReason && <DetailLine label="原因" value={order.cancelReason} />}
    </>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-line/60 pb-2 last:border-b-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all text-right font-mono text-ink tabular-nums">{value || '--'}</span>
    </div>
  );
}

function getBaseFromSymbol(symbol: string): string {
  return symbol.split('/')[0] || '--';
}

function getQuoteFromSymbol(symbol: string): string {
  return symbol.split('/')[1] || '--';
}

function getSpotBalanceMap(assets: AccountAsset[]): Record<string, SpotOrderBalance> {
  return assets.reduce<Record<string, SpotOrderBalance>>((map, asset) => {
    map[asset.coinCode] = {
      coinCode: asset.coinCode,
      availableBalance: toRuleDecimal(asset.availableBalance) || '0',
    };
    return map;
  }, {});
}

function getSpotOrderRule(
  exchangeInfo: {
    spotTradingAllowed?: boolean;
    quoteOrderQtyMarketAllowed?: boolean;
    orderTypes?: string[];
    minPrice?: number;
    maxPrice?: number;
    tickSize?: number;
    minQty?: number;
    maxQty?: number;
    stepSize?: number;
    minNotional?: number;
  } | undefined,
  tradeConfig: SpotTradeConfig | undefined,
): SpotOrderRule | undefined {
  if (!exchangeInfo) return undefined;
  const spotRule = tradeConfig?.spotRule;

  return {
    spotTradingAllowed: exchangeInfo.spotTradingAllowed,
    spotTradable: tradeConfig ? tradeConfig.spotTradable : true,
    orderTypes: exchangeInfo.orderTypes,
    quoteOrderQtyMarketAllowed: exchangeInfo.quoteOrderQtyMarketAllowed,
    minPrice: toRuleDecimal(spotRule?.minPrice ?? exchangeInfo.minPrice),
    maxPrice: toRuleDecimal(spotRule?.maxPrice ?? exchangeInfo.maxPrice),
    tickSize: toRuleDecimal(spotRule?.tickSize ?? exchangeInfo.tickSize),
    minQty: toRuleDecimal(spotRule?.minQty ?? exchangeInfo.minQty),
    maxQty: toRuleDecimal(spotRule?.maxQty ?? exchangeInfo.maxQty),
    stepSize: toRuleDecimal(spotRule?.stepSize ?? exchangeInfo.stepSize),
    minNotional: toRuleDecimal(spotRule?.minNotional ?? exchangeInfo.minNotional),
  };
}

function getFuturesBalance(assets: AccountAsset[], marginCoin: string): FuturesOrderBalance | undefined {
  const asset = assets.find((item) => item.coinCode === marginCoin);
  if (!asset) return undefined;

  return {
    coinCode: asset.coinCode,
    availableBalance: toRuleDecimal(asset.availableBalance) || '0',
  };
}

function getFuturesOrderRule(tradeConfig: FuturesTradeConfig | undefined): FuturesOrderRule | undefined {
  if (!tradeConfig?.futuresRule) return undefined;
  const futuresRule = tradeConfig.futuresRule;

  return {
    futuresTradable: tradeConfig.futuresTradable,
    minPrice: toRuleDecimal(futuresRule.minPrice),
    maxPrice: toRuleDecimal(futuresRule.maxPrice),
    tickSize: toRuleDecimal(futuresRule.tickSize),
    minQty: toRuleDecimal(futuresRule.minQty),
    maxQty: toRuleDecimal(futuresRule.maxQty),
    stepSize: toRuleDecimal(futuresRule.stepSize),
    minNotional: toRuleDecimal(futuresRule.minNotional),
  };
}

function getFuturesMaxOpenQuantity(availableBalance: string, price: string, leverage: number): string {
  if (!availableBalance || !price) return '0';

  return divideDecimalStrings(multiplyDecimalStrings(availableBalance, String(leverage)), price, 18) || '0';
}

function normalizeQuantityToDisplayStep(quantity: string, step?: string): string {
  if (!step) return quantity || '0';
  return floorDecimalToStep(quantity, step) || '0';
}

function getEstimatedSpotFee({
  side,
  isLimitOrder,
  price,
  quantity,
  amount,
  marketPrice,
  feeRate,
}: {
  side: TradeSide;
  isLimitOrder: boolean;
  price: string;
  quantity: string;
  amount: string;
  marketPrice: string;
  feeRate: string;
  feeUnit: string;
}): string {
  if (!feeRate) return '';

  if (side === 'buy') {
    const baseQuantity = isLimitOrder ? quantity : divideDecimalStrings(amount, marketPrice, 18);
    return multiplyDecimalStrings(baseQuantity, feeRate);
  }

  const effectivePrice = isLimitOrder ? price : marketPrice;
  return multiplyDecimalStrings(multiplyDecimalStrings(effectivePrice, quantity), feeRate);
}

function getInputPrecision(primary?: number | null, step?: string, fallback?: number | null): number | undefined {
  if (typeof primary === 'number' && Number.isInteger(primary) && primary >= 0) return primary;
  if (step) return getDecimalScale(step);
  if (typeof fallback === 'number' && Number.isInteger(fallback) && fallback >= 0) return fallback;
  return undefined;
}

function getDecimalScale(value: string): number {
  const [, fractionPart = ''] = value.split('.');
  return fractionPart.length;
}

function formatDecimalDisplay(value?: string | number | null): string {
  const normalized = typeof value === 'number' ? toRuleDecimal(value) : value ?? '';
  if (!normalized) return '0';
  if (!normalized.includes('.')) return normalized;

  const [integerPart, fractionPart = ''] = normalized.split('.');
  const trimmedFraction = fractionPart.slice(0, 8).replace(/0+$/, '');
  return trimmedFraction ? `${integerPart}.${trimmedFraction}` : integerPart;
}

function isFinalOrderStatus(status: number): boolean {
  return [3, 4, 5, 6].includes(status);
}

function isFuturesOrder(order: SpotOrder | FuturesOrder): order is FuturesOrder {
  return 'tradeAction' in order;
}

function formatOrderSide(side: string): string {
  if (side === 'BUY') return '买入';
  if (side === 'SELL') return '卖出';
  return side || '--';
}

function formatOrderType(orderType: string): string {
  if (orderType === 'LIMIT') return '限价';
  if (orderType === 'MARKET') return '市价';
  return orderType || '--';
}

function formatOrderStatus(status: number): string {
  const statusMap: Record<number, string> = {
    0: '待提交',
    1: '已提交',
    2: '部分成交',
    3: '完全成交',
    4: '已撤单',
    5: '已拒绝',
    6: '已过期',
    7: '已触发待成交',
  };

  return statusMap[status] ?? `状态 ${status}`;
}

function formatFuturesTradeAction(action: string): string {
  const actionMap: Record<string, string> = {
    OPEN_LONG: '开多',
    OPEN_SHORT: '开空',
    CLOSE_LONG: '平多',
    CLOSE_SHORT: '平空',
  };

  return actionMap[action] ?? (action || '--');
}

function formatPositionSide(positionSide: string): string {
  if (positionSide === 'LONG') return '多仓';
  if (positionSide === 'SHORT') return '空仓';
  return positionSide || '--';
}

function formatOrderTime(value?: string | null): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function toDecimalInput(value: string): string {
  return value.replace(/,/g, '');
}

function toRuleDecimal(value?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';

  const raw = String(value);
  if (!raw.includes('e')) return normalizeDecimalInput(raw);

  return value.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * 将 SpotSummary API 数据格式化为 ticker 格式
 */
function formatSpotSummaryToTicker(summary: SpotSummary) {
  const base = summary.baseCoinCode;
  const change = summary.priceChangePercent;
  const changePrefix = change >= 0 ? '+' : '';
  const previousPrice = change === -100 ? summary.lastPrice : summary.lastPrice / (1 + change / 100);
  const delta = Math.abs(summary.lastPrice - previousPrice);

  return {
    symbol: symbolFormat.normalize(summary.symbolCode),
    base,
    quote: summary.quoteCoinCode,
    price: formatPriceString(summary.lastPrice),
    spotPrice: formatPriceString(summary.lastPrice),
    fiat: `$${formatPriceString(summary.lastPrice)}`,
    change,
    changeText: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
    delta: `${changePrefix}${formatPriceString(delta)}`,
    high: formatPriceString(summary.highPrice),
    low: formatPriceString(summary.lowPrice),
    volume: formatVolume(summary.volume),
    turnover: formatVolume(summary.quoteVolume),
    iconColor: '#F7931A', // 默认颜色
  };
}

function formatFuturesSummaryToTicker(summary: FuturesSummary, markPrice?: FuturesMarkPrice): TradeTicker {
  const base = summary.baseCoinCode;
  const change = summary.priceChangePercent;
  const lastPrice = isFiniteNumber(summary.lastPrice) ? summary.lastPrice : markPrice?.markPrice;
  const previousPrice = isFiniteNumber(change) && isFiniteNumber(lastPrice) && change !== -100
    ? lastPrice / (1 + change / 100)
    : undefined;
  const delta = isFiniteNumber(lastPrice) && isFiniteNumber(previousPrice)
    ? `${change && change >= 0 ? '+' : ''}${formatNullableMarketPrice(Math.abs(lastPrice - previousPrice))}`
    : '--';
  const mark = markPrice?.markPrice ?? summary.markPrice;
  const index = markPrice?.indexPrice ?? summary.indexPrice;
  const fundingRate = markPrice?.lastFundingRate ?? summary.lastFundingRate;
  const nextFundingTime = markPrice?.nextFundingTime ?? summary.nextFundingTime;

  return {
    symbol: symbolFormat.normalize(summary.symbolCode),
    base,
    quote: summary.quoteCoinCode,
    price: formatNullableMarketPrice(lastPrice),
    spotPrice: formatNullableMarketPrice(lastPrice),
    fiat: `$${formatNullableMarketPrice(lastPrice)}`,
    change,
    changeText: formatNullableMarketPercent(change),
    delta,
    high: formatNullableMarketPrice(summary.highPrice),
    low: formatNullableMarketPrice(summary.lowPrice),
    volume: formatNullableMarketVolume(summary.volume),
    turnover: formatNullableMarketVolume(summary.quoteVolume),
    markPrice: formatNullableMarketPrice(mark),
    indexPrice: formatNullableMarketPrice(index),
    fundingRate: formatFuturesFundingRate(fundingRate),
    nextFundingTime: formatFuturesFundingTime(nextFundingTime),
    leverageText: formatLeverageRange(summary.minLeverage, summary.maxLeverage, summary.defaultLeverage),
    iconColor: '#F7931A',
  };
}

function formatLeverageRange(minLeverage?: number | null, maxLeverage?: number | null, defaultLeverage?: number | null): string | undefined {
  if (!isFiniteNumber(minLeverage) || !isFiniteNumber(maxLeverage)) return undefined;
  const defaultText = isFiniteNumber(defaultLeverage) ? ` 默认 ${defaultLeverage}x` : '';
  return `${minLeverage}x-${maxLeverage}x${defaultText}`;
}

function formatPriceString(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

function getChangeClass(change?: number | null): string {
  return getNullableChangeClass(change);
}

function formatDepthRow(level: SpotDepthLevel | FuturesDepthLevel) {
  return {
    price: formatPriceString(level.price),
    amount: formatDepthQuantity(level.quantity),
    quantity: level.quantity,
  };
}

function formatDepthQuantity(quantity: number): string {
  if (quantity >= 1_000_000_000) return `${trimFixed(quantity / 1_000_000_000, 2)}B`;
  if (quantity >= 1_000_000) return `${trimFixed(quantity / 1_000_000, 2)}M`;
  if (quantity >= 1_000) return `${trimFixed(quantity / 1_000, 2)}K`;
  return formatDecimalWithoutScientific(quantity);
}

function formatTradeQuantity(quantity: number): string {
  return formatDecimalWithoutScientific(quantity);
}

function formatTradeTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDecimalWithoutScientific(value: number): string {
  return value.toLocaleString('en-US', {
    useGrouping: false,
    maximumFractionDigits: 20,
  });
}

function trimFixed(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

function formatVolume(volume: number): string {
  if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(2)}亿`;
  if (volume >= 100000000) return `${(volume / 100000000).toFixed(2)}亿`;
  if (volume >= 10000) return `${(volume / 10000).toFixed(2)}万`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toFixed(2);
}
