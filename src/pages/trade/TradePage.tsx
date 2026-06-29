import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Calculator, CandlestickChart, ChevronDown, Columns2, FileText, Info, Minus, PanelBottom, PanelTop, Plus, Search, Star, WalletCards, X } from 'lucide-react';
import { CandlestickSeries, ColorType, createChart, type CandlestickData, type IChartApi, type ISeriesApi, type LogicalRange, type UTCTimestamp } from 'lightweight-charts';
import { CoinDot } from '../../components/CoinDot';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '../../components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Input } from '../../components/ui/input';
import { Slider } from '../../components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useTradeStore } from '../../store/trade.store';
import { useAuthStore } from '../../store/auth.store';
import type { SpotDepthLevel, SpotKlineParams, SpotSummary, SpotTrade, TradeMode } from '../../types/app';
import { useSpotFavoriteStatus, useToggleSpotFavorite, useSpotSummary, useInfiniteSpotKlines, useSpotDepth, useSpotExchangeInfo, useSpotFavorites, useSpotMarketList, useSpotTrades } from '../../hooks/useSpotQueries';
import { addDecimalStrings, divideDecimalStrings, floorDecimalAtZero, multiplyDecimalStrings, normalizeDecimalInput, subtractDecimalStrings } from '../../lib/decimal';
import { symbolFormat } from '../../lib/utils';

const KLINE_INTERVALS: SpotKlineParams['interval'][] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const KLINE_PAGE_LIMIT = 500;
const marketPickerTabs = ['自选', '热门', '涨幅榜', '跌幅榜'] as const;

type OrderType = 'limit' | 'market';
type TradeSide = 'buy' | 'sell';
type ContractPositionMode = 'open' | 'close';
type OrderBookTab = 'book' | 'trades';
type DepthViewMode = 'both' | 'buy' | 'sell';
type TradeContentTab = 'chart' | 'trades' | 'overview';
type MarketPickerTab = (typeof marketPickerTabs)[number];
type LimitLinkedField = 'quantity' | 'amount';
type PriceSelectionSignal = {
  price: string;
  nonce: number;
};
type TradeTicker = ReturnType<typeof formatSpotSummaryToTicker>;

type TradePageProps = {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
  showChart: boolean;
  setShowChart: (value: boolean) => void;
  openLeverage: () => void;
};

export function TradePage({ mode, setMode, showChart, setShowChart, openLeverage }: TradePageProps) {
  const currentSymbol = useTradeStore((state) => state.currentSymbol);
  const setCurrentSymbol = useTradeStore((state) => state.setCurrentSymbol);
  const isLogin = useAuthStore((state) => state.isLogin);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMarketPicker, setShowMarketPicker] = useState(false);
  const routeSymbolParam = searchParams.get('symbol')?.trim() ?? '';
  const routeSymbol = routeSymbolParam ? symbolFormat.normalize(routeSymbolParam.toUpperCase()) : '';
  const shouldLoadDefaultSymbol = !routeSymbol;
  const { data: defaultMarketList = [] } = useSpotMarketList({ tab: 'ALL', limit: 1 }, shouldLoadDefaultSymbol);
  const defaultMarketRows = Array.isArray(defaultMarketList) ? defaultMarketList : [];

  const { data: spotSummary } = useSpotSummary(currentSymbol);
  const ticker = spotSummary ? formatSpotSummaryToTicker(spotSummary) : undefined;

  // 查询收藏状态
  const { data: favoriteStatus } = useSpotFavoriteStatus(currentSymbol, isLogin);
  const { mutate: toggleFavorite } = useToggleSpotFavorite();

  useEffect(() => {
    if (!routeSymbol || routeSymbol === currentSymbol) return;
    setCurrentSymbol(routeSymbol);
  }, [currentSymbol, routeSymbol, setCurrentSymbol]);

  useEffect(() => {
    if (routeSymbol || defaultMarketRows.length === 0) return;

    const defaultSymbol = symbolFormat.normalize(defaultMarketRows[0]?.symbolCode ?? '');
    if (!defaultSymbol) return;

    if (defaultSymbol !== currentSymbol) {
      setCurrentSymbol(defaultSymbol);
    }

    setSearchParams({ symbol: symbolFormat.toApi(defaultSymbol) }, { replace: true });
  }, [currentSymbol, defaultMarketRows, routeSymbol, setCurrentSymbol, setSearchParams]);

  const selectSymbol = (symbol: string) => {
    setCurrentSymbol(symbol);
    setSearchParams({ symbol: symbolFormat.toApi(symbol) });
    setShowMarketPicker(false);
  };

  const handleToggleFavorite = () => {
    if (!currentSymbol) return;

    toggleFavorite({
      symbol: currentSymbol,
      favorited: favoriteStatus?.favorited ?? false,
    });
  };

  if (mode === 'spot') {
    return (
      <>
        <SpotTradePage
          mode={mode}
          setMode={setMode}
          symbol={currentSymbol}
          ticker={ticker}
          showChart={showChart}
          setShowChart={setShowChart}
          openMarketPicker={() => setShowMarketPicker(true)}
          favoriteStatus={favoriteStatus}
          onToggleFavorite={handleToggleFavorite}
        />
        <MarketPicker
          open={showMarketPicker}
          currentSymbol={currentSymbol}
          onOpenChange={setShowMarketPicker}
          onSelect={selectSymbol}
        />
      </>
    );
  }

  return (
    <>
      {showChart ? (
        <ChartTradePage
          mode={mode}
          setMode={setMode}
          symbol={currentSymbol}
          ticker={ticker}
          closeChart={() => setShowChart(false)}
          openLeverage={openLeverage}
          openMarketPicker={() => setShowMarketPicker(true)}
          favoriteStatus={favoriteStatus}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : (
        <section>
          <TradeTop mode={mode} setMode={setMode} />
          <div className="border-b border-line px-4 py-2.5">
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 text-[0.95rem] font-semibold" onClick={() => setShowMarketPicker(true)}>
                <CoinDot /> {currentSymbol} <ChevronDown className="size-4" />
              </button>
              <div className="flex items-center gap-3.5">
                <button aria-label="收藏交易对" onClick={handleToggleFavorite}>
                  <Star className={`size-5 ${favoriteStatus?.favorited ? 'fill-brand text-brand' : 'text-muted-foreground'}`} />
                </button>
                <button aria-label="打开K线图" onClick={() => setShowChart(true)}>
                  <CandlestickChart className="size-5 text-brand" />
                </button>
              </div>
            </div>
            <p className={`mt-2.5 font-mono text-[1.52rem] font-bold leading-none tabular-nums ${getChangeClass(ticker?.change)}`}>
              {ticker ? (mode === 'contract' ? ticker.price : ticker.spotPrice) : '--'}
            </p>
            <p className="mt-1.5 font-mono text-[0.78rem] text-muted-foreground tabular-nums">
              ≈{ticker?.fiat ?? '--'} <span className={getChangeClass(ticker?.change)}>{ticker?.changeText ?? '--'} {ticker?.delta ?? '--'}</span>
            </p>
          </div>
          <BinanceOrderPanel mode={mode} symbol={currentSymbol} ticker={ticker} openLeverage={openLeverage} />
        </section>
      )}
      <MarketPicker
        open={showMarketPicker}
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
  openMarketPicker: () => void;
  favoriteStatus?: { symbolCode: string; favorited: boolean };
  onToggleFavorite: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TradeContentTab>('chart');
  const base = ticker?.base ?? getBaseFromSymbol(symbol);
  const quote = ticker?.quote ?? getQuoteFromSymbol(symbol);

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
            <button className="cursor-pointer" aria-label="收藏交易对" onClick={onToggleFavorite}>
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
              {ticker?.spotPrice ?? '--'}
            </p>
            <p className="mt-1.5 truncate font-mono text-[0.72rem] text-muted-foreground tabular-nums">
              ≈{ticker?.fiat ?? '--'} <span className={getChangeClass(ticker?.change)}>{ticker?.changeText ?? '--'}</span>
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-1 text-right text-[0.68rem] text-muted-foreground">
            <Stat label="24h最高" value={ticker?.high ?? '--'} />
            <Stat label={`24h量(${base})`} value={ticker?.volume ?? '--'} />
            <Stat label="24h最低" value={ticker?.low ?? '--'} />
            <Stat label={`24h额(${quote})`} value={ticker?.turnover ?? '--'} />
          </div>
        </div>
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
              <CandleChart />
            </>
          )}
          {activeTab === 'trades' && <LatestTradesSection symbol={symbol} base={base} />}
          {activeTab === 'overview' && <CoinOverviewPanel />}
        </div>
      )}

      <SpotTradingWorkspace symbol={symbol} base={base} quote={quote} ticker={ticker} />
      <div className="px-4 pb-3">
        <CurrentOrders />
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

function LatestTradesSection({ symbol, base }: { symbol: string; base: string }) {
  const { data: trades = [], isLoading } = useSpotTrades(symbol, 50, true);

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

function ChartTradePage({
  mode,
  setMode,
  symbol,
  ticker,
  closeChart,
  openLeverage,
  openMarketPicker,
  favoriteStatus,
  onToggleFavorite,
}: {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
  symbol: string;
  ticker?: TradeTicker;
  closeChart: () => void;
  openLeverage: () => void;
  openMarketPicker: () => void;
  favoriteStatus?: { symbolCode: string; favorited: boolean };
  onToggleFavorite: () => void;
}) {
  const base = symbol.split('/')[0] ?? 'BTC';
  const currentInterval = useTradeStore((state) => state.currentInterval);
  const setCurrentInterval = useTradeStore((state) => state.setCurrentInterval);

  return (
    <section>
      <TradeTop mode={mode} setMode={setMode} />
      <div className="border-b border-line px-4 py-2.5">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-[1rem] font-semibold" onClick={openMarketPicker}>
            <CoinDot /> {symbol} <ChevronDown className="size-4" />
          </button>
          <div className="flex items-center gap-3.5">
            <button aria-label="收藏交易对" onClick={onToggleFavorite}>
              <Star className={`size-5 ${favoriteStatus?.favorited ? 'fill-brand text-brand' : 'text-muted-foreground'}`} />
            </button>
            <button aria-label={mode === 'contract' ? '调整杠杆' : '返回下单'} onClick={mode === 'contract' ? openLeverage : closeChart}>
              <CandlestickChart className="size-5 text-brand" />
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <div>
            <p className={`font-mono text-[1.38rem] font-bold leading-none tabular-nums ${getChangeClass(ticker?.change)}`}>
              {ticker ? (mode === 'contract' ? ticker.price : ticker.spotPrice) : '--'}
            </p>
            <p className="mt-1.5 font-mono text-[0.72rem] text-muted-foreground tabular-nums">
              ≈{ticker?.fiat ?? '--'} <span className={getChangeClass(ticker?.change)}>{ticker?.changeText ?? '--'} {ticker?.delta ?? '--'}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-right text-[0.68rem] text-muted-foreground">
            <Stat label="24h最高" value={ticker?.high ?? '--'} />
            <Stat label={`24h量(${base})`} value={ticker?.volume ?? '--'} />
            <Stat label="24h最低" value={ticker?.low ?? '--'} />
            <Stat label="24h额(USDT)" value={ticker?.turnover ?? '--'} />
          </div>
        </div>
      </div>
      <div className="border-b border-line">
        <Tabs value="chart" className="min-w-0 gap-0">
          <TabsList variant="line" className="no-scrollbar flex !h-10 w-full min-w-0 justify-start gap-8 overflow-x-auto whitespace-nowrap rounded-none px-4 py-0 text-[0.9rem] font-semibold leading-none">
            <TabsTrigger
              value="chart"
              className="!h-10 flex-none shrink-0 rounded-none border-0 bg-transparent px-0 pb-1.5 pt-0 text-muted-foreground shadow-none after:!bottom-0 after:bg-warning data-[state=active]:bg-transparent data-[state=active]:text-brand dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-brand"
            >
              图表
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="!h-10 flex-none shrink-0 rounded-none border-0 bg-transparent px-0 pb-1.5 pt-0 text-muted-foreground shadow-none after:!bottom-0 after:bg-warning data-[state=active]:bg-transparent data-[state=active]:text-brand dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-brand"
            >
              币种概况
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap bg-base2 px-4 py-2 text-[0.75rem] text-muted-foreground">
          {KLINE_INTERVALS.map((item) => (
            <button key={item} className={currentInterval === item ? 'shrink-0 rounded bg-soft2 px-2.5 py-1.5 text-ink' : 'shrink-0 px-2 py-1.5'} onClick={() => setCurrentInterval(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <CandleChart />
      <div className="grid grid-cols-2 gap-2.5 px-4 py-3">
        <button className="rounded bg-buy py-2.5 text-[0.9rem] font-semibold text-white" onClick={closeChart}>
          买入
        </button>
        <button className="rounded border border-sell bg-soft2 py-2.5 text-[0.9rem] font-semibold text-sell" onClick={closeChart}>
          卖出
        </button>
      </div>
      <div className="px-4 pb-24">
        <OrderBook base={base} ticker={ticker} />
      </div>
    </section>
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

function CandleChart() {
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

  const {
    data: klinePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteSpotKlines({
    symbol: currentSymbol,
    interval: currentInterval,
    limit: KLINE_PAGE_LIMIT,
  });

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

function SpotTradingWorkspace({ symbol, base, quote, ticker }: { symbol: string; base: string; quote: string; ticker?: TradeTicker }) {
  const [selectedPrice, setSelectedPrice] = useState<PriceSelectionSignal | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('limit');

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,0.43fr)_minmax(0,0.57fr)] gap-2.5 border-b border-line px-3 py-3">
      <CompactOrderBook
        symbol={symbol}
        base={base}
        quote={quote}
        ticker={ticker}
        orderType={orderType}
        onSelectPrice={(price) => setSelectedPrice({ price, nonce: Date.now() })}
      />
      <SpotOrderForm
        symbol={symbol}
        base={base}
        quote={quote}
        ticker={ticker}
        orderType={orderType}
        setOrderType={setOrderType}
        selectedPrice={selectedPrice}
      />
    </div>
  );
}

function CompactOrderBook({
  symbol,
  base,
  quote,
  ticker,
  orderType,
  onSelectPrice,
}: {
  symbol: string;
  base: string;
  quote: string;
  ticker?: TradeTicker;
  orderType: OrderType;
  onSelectPrice: (price: string) => void;
}) {
  const [depthView, setDepthView] = useState<DepthViewMode>('both');
  const { data: depth, isLoading } = useSpotDepth(symbol, 20);
  const bothRowCount = orderType === 'market' ? 5 : 6;
  const singleSideRowCount = orderType === 'market' ? 10 : 12;
  const visibleRowCount = depthView === 'both' ? bothRowCount : singleSideRowCount;
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
      <CompactMarketPrice ticker={ticker} />
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

function CompactMarketPrice({ ticker }: { ticker?: TradeTicker }) {
  return (
    <div className="my-2.5 text-center">
      <p className={`font-mono text-[1.45rem] font-bold leading-none tabular-nums ${getChangeClass(ticker?.change)}`}>{ticker?.spotPrice ?? '--'}</p>
      <p className="mt-1 font-mono text-[0.72rem] text-muted-foreground tabular-nums">≈ {ticker?.fiat ?? '--'}</p>
    </div>
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
  const { data: exchangeInfo } = useSpotExchangeInfo(symbol);
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
    const nextPrice = normalizeDecimalInput(nextValue);
    applyLimitPrice(nextPrice);
  };

  const applyLimitPrice = (nextPrice: string) => {
    setPrice(nextPrice);

    if (!isLimitOrder) return;

    if (lastEdited === 'amount') {
      setQuantity(divideDecimalStrings(amount, nextPrice, 8));
      return;
    }

    setAmount(multiplyDecimalStrings(nextPrice, quantity));
  };

  const updateQuantity = (nextValue: string) => {
    const nextQuantity = normalizeDecimalInput(nextValue);
    setQuantity(nextQuantity);
    setLastEdited('quantity');

    if (isLimitOrder) {
      setAmount(multiplyDecimalStrings(price, nextQuantity));
    }
  };

  const updateAmount = (nextValue: string) => {
    const nextAmount = normalizeDecimalInput(nextValue);
    setAmount(nextAmount);
    setLastEdited('amount');
    setQuantity(divideDecimalStrings(nextAmount, price, 8));
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
          <PercentRail compact />
          <TradeInput value={amount} onValueChange={updateAmount} placeholder="成交金额" suffix={quote} dense ariaLabel={`成交金额(${quote})`} />
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex h-[2.75rem] items-center justify-center rounded-lg border border-transparent bg-soft px-3 text-[0.86rem] font-semibold text-muted-foreground/70">
            市价
          </div>
          <TradeInput value={quantity} onValueChange={updateQuantity} placeholder="数量" suffix={inputUnit} dense ariaLabel={`数量(${inputUnit})`} />
          <PercentRail compact />
        </div>
      )}

      <div className="mt-2 space-y-1 text-[0.7rem] leading-tight">
        <MetricLine label="可用" value={side === 'buy' ? `-- ${quote}` : `-- ${base}`} />
        <MetricLine label={estimatedPrimaryLabel} value={estimatedPrimaryValue} />
        <MetricLine label="预计手续费" value={`-- ${feeUnit}`} />
      </div>

      <button className={`mt-2.5 h-11 w-full rounded-lg text-[0.9rem] font-semibold text-white transition active:brightness-90 cursor-pointer ${actionColor}`} type="button">
        {actionLabel}
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

function BinanceOrderPanel({ mode, symbol, ticker, openLeverage }: { mode: TradeMode; symbol: string; ticker?: TradeTicker; openLeverage: () => void }) {
  const base = symbol.split('/')[0] ?? 'BTC';
  const isContract = mode === 'contract';
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [positionMode, setPositionMode] = useState<ContractPositionMode>('open');
  const isLimitOrder = orderType === 'limit';
  const marketPlaceholder = positionMode === 'open' ? '最优追价开仓' : '最优追价平仓';
  const leftAction = isContract ? (positionMode === 'open' ? '买入开多' : '平空') : `买入 ${base}`;
  const rightAction = isContract ? (positionMode === 'open' ? '卖出开空' : '平多') : `卖出 ${base}`;
  const contractMetricLabel = positionMode === 'open' ? '可开' : '可平';
  const showContractLimitMeta = isContract && isLimitOrder;

  useEffect(() => {
    setOrderType('limit');
    setPositionMode('open');
  }, [mode]);

  return (
    <div className="px-4 py-3.5">
      {isContract && (
        <Tabs value={positionMode} onValueChange={(value) => setPositionMode(value as ContractPositionMode)}>
          <TabsList className="mb-3 grid h-11 w-full grid-cols-2 items-stretch gap-0 overflow-hidden rounded-md bg-soft p-0">
            <TabsTrigger
              value="open"
              className="h-full min-h-0 rounded-none border-0 py-0 text-[0.9rem] font-semibold text-muted-foreground shadow-none after:hidden data-[state=active]:bg-buy data-[state=active]:text-white dark:data-[state=active]:bg-buy dark:data-[state=active]:text-white"
            >
              开仓
            </TabsTrigger>
            <TabsTrigger
              value="close"
              className="h-full min-h-0 rounded-none border-0 py-0 text-[0.9rem] font-semibold text-muted-foreground shadow-none after:hidden data-[state=active]:bg-sell data-[state=active]:text-white dark:data-[state=active]:bg-sell dark:data-[state=active]:text-white"
            >
              平仓
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="mb-3.5 flex min-w-0 items-center justify-between gap-3">
        <Tabs className="min-w-0 flex-1" value={orderType} onValueChange={(value) => setOrderType(value as OrderType)}>
          <TabsList variant="line" className="no-scrollbar flex h-auto min-w-0 justify-start gap-8 overflow-x-auto whitespace-nowrap p-0 text-[1rem] font-semibold">
            <TabsTrigger
              value="limit"
              className="h-auto shrink-0 rounded-none px-0 pb-2 text-muted-foreground after:bg-warning data-[state=active]:text-ink data-[state=active]:after:opacity-100"
            >
              限价
            </TabsTrigger>
            <TabsTrigger
              value="market"
              className="h-auto shrink-0 rounded-none px-0 pb-2 text-muted-foreground after:bg-warning data-[state=active]:text-ink data-[state=active]:after:opacity-100"
            >
              市价
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Info className="size-5 shrink-0 text-muted-foreground" />
      </div>

      <div className="mb-3.5 flex items-center justify-between text-[0.92rem] text-muted-foreground">
        <span>可用 -- USDT</span>
      </div>

      {isLimitOrder ? (
        <>
          <div className="mb-2.5 flex items-end justify-between">
            <span className="text-[0.82rem] text-muted-foreground">委托价格</span>
            <Calculator className="size-4.5 text-muted-foreground" />
          </div>

          <div className="mb-3">
            <TradeInput value={ticker?.price ?? ''} suffix="USDT" compact emphasis />
          </div>
        </>
      ) : (
        <div className="mb-3 flex h-[3.25rem] items-center rounded-lg border border-transparent bg-soft px-4 text-[0.86rem] font-semibold text-muted-foreground/70">
          {isContract ? marketPlaceholder : '按市场最优价格成交'}
        </div>
      )}

      <label className="mb-2 block text-[0.82rem] text-muted-foreground">数量</label>
      <TradeInput placeholder="" suffix={base} dropdown compact />
      <PercentRail />

      {showContractLimitMeta && (
        <div className="mb-3.5 flex items-center justify-between border-t border-line pt-3">
          <button className="flex items-center gap-1 text-[0.84rem] font-semibold text-muted-foreground">
            生效时间 <span className="text-ink">GTC</span> <ChevronDown className="size-4" />
          </button>
          <button className="rounded border border-line px-3 py-1.5 text-[0.8rem] text-brand" onClick={openLeverage}>
            全仓 | 10x
          </button>
        </div>
      )}

      {isContract && (
        <div className={`${showContractLimitMeta ? 'mb-3.5' : 'my-3.5 border-t border-line pt-3'} space-y-3`}>
          <CheckRow label="止盈/止损" />
          <CheckRow label={positionMode === 'open' ? '只减仓' : '仅平仓'} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <button className="rounded-md bg-buy py-3 text-[0.95rem] font-semibold text-white transition active:brightness-90">{leftAction}</button>
        <button className="rounded-md bg-sell py-3 text-[0.95rem] font-semibold text-white transition active:brightness-90">{rightAction}</button>
      </div>

      {isContract ? (
        <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.78rem]">
          {positionMode === 'open' && (
            <>
              <Metric label="强平价格" value="-- USDT" />
              <Metric label="强平价格" value="-- USDT" />
              <Metric label="保证金" value="0.00 USDT" />
              <Metric label="保证金" value="0.00 USDT" />
            </>
          )}
          <Metric label={contractMetricLabel} value={`0.000 ${base}`} />
          <Metric label={contractMetricLabel} value={`0.000 ${base}`} />
        </div>
      ) : (
        <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.78rem]">
          <Metric label="可用" value="-- USDT" />
          <Metric label="可用" value={`-- ${base}`} />
          <Metric label="预计买入" value={`0.000 ${base}`} />
          <Metric label="预计卖出" value="0.00 USDT" />
        </div>
      )}

      <CurrentOrders />
    </div>
  );
}

function TradeInput({
  value = '',
  placeholder,
  suffix,
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
  const heightClass = dense ? 'h-[2.75rem]' : compact ? 'h-[3.25rem]' : 'h-[3.95rem]';
  const inputSizeClass = dense
    ? `${emphasis ? 'text-[1rem]' : 'text-[0.94rem]'} font-semibold`
    : compact
      ? `${emphasis ? 'text-[1.14rem]' : 'text-[1.05rem]'} font-semibold`
      : large
        ? 'text-[1.35rem] font-semibold'
        : 'text-[1rem]';
  const suffixSizeClass = dense ? 'text-[0.78rem]' : compact ? 'text-[0.84rem]' : 'text-[0.92rem]';
  const hasSteppers = Boolean(onStepDown || onStepUp);
  const stepButtonClass = `grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors ${
    stepDisabled || disabled ? 'opacity-45' : 'cursor-pointer hover:bg-soft2 hover:text-ink active:bg-line/80'
  }`;
  const stepTarget = ariaLabel ?? suffix;

  return (
    <div
      key={feedbackKey ?? 'stable-input-shell'}
      className={`flex ${heightClass} min-w-0 items-center gap-2 rounded-lg border px-2.5 transition-colors duration-200 focus-within:border-muted-foreground/70 ${
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
          <Minus className="size-3.5" />
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
      <span className={`flex items-center gap-1 font-semibold text-ink ${suffixSizeClass}`}>
        {suffix}
        {dropdown && <ChevronDown className="size-4 text-muted-foreground" />}
      </span>
      {hasSteppers && (
        <button
          aria-label={`增加${stepTarget}`}
          className={stepButtonClass}
          disabled={stepDisabled || disabled}
          onClick={onStepUp}
          type="button"
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function PercentRail({ compact = false }: { compact?: boolean }) {
  const [percent, setPercent] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const points = [0, 25, 50, 75, 100];
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
            setPercent(value[0] ?? 0);
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

function CheckRow({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);

  return (
    <label className="flex items-center gap-2.5 text-[0.96rem] text-ink">
      <input className="sr-only" type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
      <span className={`grid size-[1.15rem] place-items-center rounded border ${checked ? 'border-brand bg-brand' : 'border-line bg-base2'}`}>
        {checked && <span className="size-2 rounded-full bg-primary-foreground" />}
      </span>
      {label}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label} <span className="text-ink tabular-nums">{value}</span></p>
    </div>
  );
}

function OrderBook({ base = 'BTC', ticker }: { base?: string; ticker?: TradeTicker }) {
  const currentSymbol = useTradeStore((state) => state.currentSymbol);
  const [activeTab, setActiveTab] = useState<OrderBookTab>('book');
  const [depthView, setDepthView] = useState<DepthViewMode>('both');

  const { data: depth, isLoading } = useSpotDepth(currentSymbol, 10);
  const { data: trades = [], isLoading: tradesLoading } = useSpotTrades(currentSymbol, 50, activeTab === 'trades');

  const sellRows = (depth?.asks ?? []).slice(0, depthView === 'both' ? 5 : 10).map(formatDepthRow);

  const buyRows = (depth?.bids ?? []).slice(0, depthView === 'both' ? 5 : 10).map(formatDepthRow);

  const maxAmount = Math.max(0, ...sellRows.concat(buyRows).map((row) => row.quantity));

  return (
    <div className="min-w-0">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderBookTab)} className="min-w-0 flex-1 gap-0">
          <TabsList variant="line" className="no-scrollbar flex !h-6 min-w-0 justify-start gap-3 overflow-x-auto whitespace-nowrap p-0 text-[0.84rem] font-semibold leading-none">
            <TabsTrigger
              value="book"
              className="!h-6 flex-none shrink-0 rounded-none border-0 bg-transparent px-0 pb-1 pt-0 text-muted-foreground shadow-none after:!bottom-0 after:bg-warning data-[state=active]:bg-transparent data-[state=active]:text-ink dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-ink"
            >
              盘口
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="!h-6 flex-none shrink-0 rounded-none border-0 bg-transparent px-0 pb-1 pt-0 text-muted-foreground shadow-none after:!bottom-0 after:bg-warning data-[state=active]:bg-transparent data-[state=active]:text-ink dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-ink"
            >
              最新成交
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {activeTab === 'book' && (
          <div className="flex shrink-0 items-center gap-1">
            <div className="flex h-6 items-center overflow-hidden rounded border border-line bg-base2">
              <DepthViewButton mode="both" activeMode={depthView} label="买盘+卖盘" onSelect={setDepthView} />
              <DepthViewButton mode="buy" activeMode={depthView} label="买盘" onSelect={setDepthView} />
              <DepthViewButton mode="sell" activeMode={depthView} label="卖盘" onSelect={setDepthView} />
            </div>
          </div>
        )}
      </div>
      {activeTab === 'book' ? (
        <>
          <div className="grid grid-cols-2 gap-2 px-1 text-[0.68rem] text-muted-foreground">
            <span>价(USDT)</span>
            <span className="text-right">量({base})</span>
          </div>
          {depthView !== 'buy' && <DepthRows rows={sellRows} side="sell" maxAmount={maxAmount} isLoading={isLoading} />}
          <div className="my-2.5 flex items-baseline justify-between border-y border-line/70 py-2">
            <span className={`font-mono text-[1.06rem] font-bold tabular-nums ${getChangeClass(ticker?.change)}`}>{ticker?.price ?? '--'}</span>
            <span className="font-mono text-[0.72rem] text-muted-foreground tabular-nums">≈ {ticker?.fiat ?? '--'}</span>
          </div>
          {depthView !== 'sell' && <DepthRows rows={buyRows} side="buy" maxAmount={maxAmount} isLoading={isLoading} />}
        </>
      ) : (
        <LatestTrades trades={trades} base={base} isLoading={tradesLoading} />
      )}
    </div>
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
        rows.map((row) => (
          <DepthRow
            key={`${side}-${row.price}`}
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

function LatestTrades({ trades, base, isLoading }: { trades: SpotTrade[]; base: string; isLoading: boolean }) {
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
  currentSymbol,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  currentSymbol: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (symbol: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MarketPickerTab>('热门');
  const isLogin = useAuthStore((state) => state.isLogin);
  const isFavoriteTab = activeTab === '自选';
  const normalizedQuery = query.trim();
  const marketTab = activeTab === '热门' ? 'HOT' : activeTab === '涨幅榜' ? 'GAINERS' : 'LOSERS';
  const { data: marketList = [], isLoading: marketLoading } = useSpotMarketList({
    keyword: normalizedQuery || undefined,
    tab: marketTab,
  }, !isFavoriteTab);
  const { data: favoriteList = [], isLoading: favoritesLoading } = useSpotFavorites(isFavoriteTab && isLogin);
  const favoriteRows = isLogin ? favoriteList : [];
  const rowsSource = isFavoriteTab ? favoriteRows : marketList;
  const rows = Array.isArray(rowsSource) ? rowsSource : [];
  const isLoading = isFavoriteTab && isLogin ? favoritesLoading : marketLoading;
  const emptyText = isFavoriteTab && !isLogin ? '请登录后查看' : isFavoriteTab ? '暂无自选' : '暂无交易对';

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
                  <p className="font-mono text-[0.9rem] font-semibold text-ink tabular-nums">{formatPriceString(row.lastPrice)}</p>
                  <p className={`mt-1 font-mono text-[0.78rem] tabular-nums ${getChangeClass(row.priceChangePercent)}`}>
                    {row.priceChangePercent >= 0 ? '+' : ''}{row.priceChangePercent.toFixed(2)}%
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

function CurrentOrders() {
  return (
    <div className="col-span-full -mx-4 mt-5 border-t border-line px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="no-scrollbar flex min-w-0 gap-4 overflow-x-auto whitespace-nowrap text-[0.9rem] font-semibold">
          <button className="shrink-0 text-ink">当前委托</button>
          <button className="shrink-0 text-muted-foreground">历史委托</button>
        </div>
        <FileText className="size-4.5 text-muted-foreground" />
      </div>
      <div className="grid min-h-[70px] place-items-center text-muted-foreground">
        <div className="text-center">
          <WalletCards className="mx-auto mb-1.5 size-6" />
          <p className="text-[0.78rem]">暂无订单</p>
        </div>
      </div>
    </div>
  );
}

function getBaseFromSymbol(symbol: string): string {
  return symbol.split('/')[0] || '--';
}

function getQuoteFromSymbol(symbol: string): string {
  return symbol.split('/')[1] || '--';
}

function toDecimalInput(value: string): string {
  return value.replace(/,/g, '');
}

function toRuleDecimal(value?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '';

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

function formatPriceString(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

function getChangeClass(change?: number): string {
  if (typeof change !== 'number') return 'text-muted-foreground';
  return change >= 0 ? 'text-buy' : 'text-sell';
}

function formatDepthRow(level: SpotDepthLevel) {
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
