import { useEffect, useRef, useState } from 'react';
import { Bell, Calculator, CandlestickChart, ChevronDown, FileText, Info, Search, Star, WalletCards, X } from 'lucide-react';
import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from 'lightweight-charts';
import { getTickerBySymbol, marketPairs } from '../../data/mock';
import { CoinDot } from '../../components/CoinDot';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '../../components/ui/drawer';
import { Slider } from '../../components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useTradeStore } from '../../store/trade.store';
import type { TradeMode } from '../../types/app';

type OrderType = 'limit' | 'market';
type ContractPositionMode = 'open' | 'close';

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
  const [showMarketPicker, setShowMarketPicker] = useState(false);
  const ticker = getTicker(currentSymbol);

  const selectSymbol = (symbol: string) => {
    setCurrentSymbol(symbol);
    setShowMarketPicker(false);
  };

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
                <button aria-label="收藏交易对">
                  <Star className="size-5 fill-[#F59E0B] text-[#F59E0B]" />
                </button>
                <button aria-label="打开K线图" onClick={() => setShowChart(true)}>
                  <CandlestickChart className="size-5 text-brand" />
                </button>
              </div>
            </div>
            <p className={`mt-2.5 font-mono text-[1.6rem] font-bold leading-none tabular-nums ${ticker.change >= 0 ? 'text-brand' : 'text-danger'}`}>{mode === 'contract' ? ticker.price : ticker.spotPrice}</p>
            <p className="mt-1.5 font-mono text-[0.78rem] text-muted-foreground tabular-nums">
              ≈{ticker.fiat} <span className={ticker.change >= 0 ? 'text-brand' : 'text-danger'}>{ticker.changeText} {ticker.delta}</span>
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

function TradeTop({ mode, setMode }: { mode: TradeMode; setMode: (mode: TradeMode) => void }) {
  return (
    <header className="flex h-11 items-center justify-between border-b border-line px-4">
      <span className="size-5" />
      <div className="rounded-md bg-[#202733] p-0.5">
        <button className={`rounded px-6 py-1.5 text-[0.86rem] outline-none transition-colors ${mode === 'spot' ? 'bg-[#111821] text-ink' : 'text-muted-foreground'}`} onClick={() => setMode('spot')}>
          现货
        </button>
        <button className={`rounded px-6 py-1.5 text-[0.86rem] outline-none transition-colors ${mode === 'contract' ? 'bg-[#111821] text-ink' : 'text-muted-foreground'}`} onClick={() => setMode('contract')}>
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
}: {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
  symbol: string;
  ticker: ReturnType<typeof getTicker>;
  closeChart: () => void;
  openLeverage: () => void;
  openMarketPicker: () => void;
}) {
  const base = symbol.split('/')[0] ?? 'BTC';
  const currentInterval = useTradeStore((state) => state.currentInterval);
  const setCurrentInterval = useTradeStore((state) => state.setCurrentInterval);
  const intervals = ['15分', '30分', '1小时', '4小时', '1日', '周线'];

  return (
    <section>
      <TradeTop mode={mode} setMode={setMode} />
      <div className="border-b border-line px-4 py-2.5">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-[1rem] font-semibold" onClick={openMarketPicker}>
            <CoinDot /> {symbol} <ChevronDown className="size-4" />
          </button>
          <div className="flex items-center gap-3.5">
            <button aria-label="收藏交易对">
              <Star className="size-5 fill-[#F59E0B] text-[#F59E0B]" />
            </button>
            <button aria-label={mode === 'contract' ? '调整杠杆' : '返回下单'} onClick={mode === 'contract' ? openLeverage : closeChart}>
              <CandlestickChart className="size-5 text-brand" />
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <div>
            <p className={`font-mono text-[1.45rem] font-bold leading-none tabular-nums ${ticker.change >= 0 ? 'text-brand' : 'text-danger'}`}>{mode === 'contract' ? ticker.price : ticker.spotPrice}</p>
            <p className="mt-1.5 font-mono text-[0.72rem] text-muted-foreground tabular-nums">
              ≈{ticker.fiat} <span className={ticker.change >= 0 ? 'text-brand' : 'text-danger'}>{ticker.changeText} {ticker.delta}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-right text-[0.68rem] text-muted-foreground">
            <Stat label="24h最高" value={ticker.high} />
            <Stat label={`24h量(${base})`} value={ticker.volume} />
            <Stat label="24h最低" value={ticker.low} />
            <Stat label="24h额(USDT)" value={ticker.turnover} />
          </div>
        </div>
      </div>
      <div className="border-b border-line">
        <div className="no-scrollbar flex gap-8 overflow-x-auto whitespace-nowrap px-4 py-2 text-[0.9rem]">
          <button className="shrink-0 border-b-2 border-brand pb-1.5 text-brand">图表</button>
          <button className="shrink-0 text-muted-foreground">币种概况</button>
        </div>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap bg-base2 px-4 py-2 text-[0.75rem] text-muted-foreground">
          {intervals.map((item) => (
            <button key={item} className={currentInterval === item ? 'shrink-0 rounded bg-soft2 px-2.5 py-1.5 text-ink' : 'shrink-0 px-2 py-1.5'} onClick={() => setCurrentInterval(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <CandleChart />
      <div className="grid grid-cols-2 gap-2.5 px-4 py-3">
        <button className="rounded bg-brand py-2.5 text-[0.9rem] font-semibold text-white" onClick={closeChart}>
          买入
        </button>
        <button className="rounded border border-danger bg-soft2 py-2.5 text-[0.9rem] font-semibold text-danger" onClick={closeChart}>
          卖出
        </button>
      </div>
      <div className="px-4 pb-24">
        <OrderBook base={base} ticker={ticker} contract={mode === 'contract'} />
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

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b96a8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(60, 70, 86, 0.45)' },
        horzLines: { color: 'rgba(60, 70, 86, 0.45)' },
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
      upColor: '#2fbe85',
      downColor: '#f6475d',
      borderVisible: false,
      wickUpColor: '#2fbe85',
      wickDownColor: '#f6475d',
      priceLineColor: '#f6475d',
      priceLineWidth: 1,
      lastValueVisible: true,
      priceLineVisible: true,
    });

    series.setData(makeCandleData());
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, []);

  return (
    <div className="h-[260px] border-b border-line bg-base">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

function BinanceOrderPanel({ mode, symbol, ticker, openLeverage }: { mode: TradeMode; symbol: string; ticker: ReturnType<typeof getTicker>; openLeverage: () => void }) {
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
          <TabsList className="mb-3 grid h-12 w-full grid-cols-2 items-stretch gap-0 overflow-hidden rounded-lg bg-[#202733] p-0">
            <TabsTrigger
              value="open"
              className="h-full min-h-0 rounded-none border-0 py-0 text-[0.92rem] font-semibold text-muted-foreground shadow-none after:hidden data-[state=active]:bg-brand data-[state=active]:text-white dark:data-[state=active]:bg-brand dark:data-[state=active]:text-white"
            >
              开仓
            </TabsTrigger>
            <TabsTrigger
              value="close"
              className="h-full min-h-0 rounded-none border-0 py-0 text-[0.92rem] font-semibold text-muted-foreground shadow-none after:hidden data-[state=active]:bg-danger data-[state=active]:text-white dark:data-[state=active]:bg-danger dark:data-[state=active]:text-white"
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
            <TradeInput value={ticker.price} suffix="USDT" compact emphasis />
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
        <button className="rounded-lg bg-brand py-3 text-[1rem] font-semibold text-white transition active:brightness-90">{leftAction}</button>
        <button className="rounded-lg bg-danger py-3 text-[1rem] font-semibold text-white transition active:brightness-90">{rightAction}</button>
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
  dropdown = false,
  large = false,
  compact = false,
  emphasis = false,
}: {
  value?: string;
  placeholder?: string;
  suffix: string;
  dropdown?: boolean;
  large?: boolean;
  compact?: boolean;
  emphasis?: boolean;
}) {
  const heightClass = compact ? 'h-[3.25rem]' : 'h-[3.95rem]';
  const inputSizeClass = compact ? `${emphasis ? 'text-[1.14rem]' : 'text-[1.05rem]'} font-semibold` : large ? 'text-[1.35rem] font-semibold' : 'text-[1rem]';
  const suffixSizeClass = compact ? 'text-[0.84rem]' : 'text-[0.92rem]';

  return (
    <div className={`flex ${heightClass} min-w-0 items-center rounded-lg border border-line bg-base2 px-4`}>
      <input
        className={`min-w-0 flex-1 bg-transparent font-mono text-ink outline-none placeholder:text-muted-foreground tabular-nums ${inputSizeClass}`}
        value={value}
        placeholder={placeholder}
        readOnly
      />
      <span className={`flex items-center gap-1 font-semibold text-ink ${suffixSizeClass}`}>
        {suffix}
        {dropdown && <ChevronDown className="size-4 text-muted-foreground" />}
      </span>
    </div>
  );
}

function PercentRail() {
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
    <div className="mb-4 -mt-0.5">
      <div className="relative h-[3rem] px-3">
        {showTooltip && (
          <div
            className="absolute -top-[1.35rem] z-30 -translate-x-1/2 rounded-md bg-soft2 px-2.5 py-1.5 font-mono text-[0.78rem] font-semibold leading-none text-ink shadow-lg shadow-black/25 after:absolute after:left-1/2 after:top-full after:size-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:bg-soft2"
            style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${percent / 100})` }}
          >
            {percent}%
          </div>
        )}

        <Slider
          className="absolute inset-x-0 top-[0.34rem] z-20 h-5 px-3 [&_[data-slot=slider-range]]:bg-ink [&_[data-slot=slider-thumb]]:z-20 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:rotate-45 [&_[data-slot=slider-thumb]]:rounded-[4px] [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-ink [&_[data-slot=slider-thumb]]:ring-0 [&_[data-slot=slider-thumb]]:after:hidden [&_[data-slot=slider-track]]:h-px [&_[data-slot=slider-track]]:overflow-visible [&_[data-slot=slider-track]]:bg-line"
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
            style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${point / 100})` }}
          />
        ))}

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
        {checked && <span className="size-2 rounded-full bg-white" />}
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

function OrderBook({ base = 'BTC', ticker, contract = false }: { base?: string; ticker: ReturnType<typeof getTicker>; contract?: boolean }) {
  const sellRows = makeDepthRows(ticker.price, 'sell', contract);
  const buyRows = makeDepthRows(ticker.price, 'buy', contract);
  const maxAmount = Math.max(...sellRows.concat(buyRows).map(([, amount]) => Number(amount.replace(/,/g, ''))));

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="no-scrollbar flex min-w-0 gap-3 overflow-x-auto whitespace-nowrap text-[0.84rem]">
          <button className="shrink-0 border-b-2 border-brand pb-1">盘口</button>
          <button className="shrink-0 text-muted-foreground">最新成交</button>
        </div>
        <button className="rounded border border-line px-1.5 py-0.5 text-[0.68rem] text-muted-foreground">0.1</button>
      </div>
      <div className="grid grid-cols-2 gap-2 px-1 text-[0.68rem] text-muted-foreground">
        <span>价(USDT)</span>
        <span className="text-right">量({base})</span>
      </div>
      <div className="mt-1.5 space-y-0.5 font-mono">
        {sellRows.map(([price, amount]) => (
          <DepthRow key={price} price={price} amount={amount} maxAmount={maxAmount} side="sell" />
        ))}
      </div>
      <div className="my-2.5 flex items-baseline justify-between border-y border-line/70 py-2">
        <span className="font-mono text-[1.06rem] font-bold text-brand tabular-nums">{ticker.price}</span>
        <span className="font-mono text-[0.72rem] text-muted-foreground tabular-nums">≈ {ticker.fiat}</span>
      </div>
      <div className="space-y-0.5 font-mono">
        {buyRows.map(([price, amount]) => (
          <DepthRow key={price} price={price} amount={amount} maxAmount={maxAmount} side="buy" />
        ))}
      </div>
    </div>
  );
}

function DepthRow({ price, amount, maxAmount, side }: { price: string; amount: string; maxAmount: number; side: 'buy' | 'sell' }) {
  const numericAmount = Number(amount.replace(/,/g, ''));
  const width = maxAmount > 0 ? Math.max(12, Math.min(100, (numericAmount / maxAmount) * 100)) : 0;
  const depthColor = side === 'buy' ? 'bg-brand/8' : 'bg-danger/8';
  const textColor = side === 'buy' ? 'text-brand' : 'text-danger';

  return (
    <div className="relative grid h-5 grid-cols-2 items-center overflow-hidden px-1 text-[0.72rem] tabular-nums">
      <span className={`absolute inset-y-0 right-0 ${depthColor}`} style={{ width: `${width}%` }} />
      <span className={`relative ${textColor}`}>{price}</span>
      <span className="relative text-right text-ink">{amount}</span>
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
  const tabs = ['全部', '新币', '创新区', 'USDT', 'USDC'];
  const rows = getMarketPickerRows().filter((row) => row.symbol.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="max-h-[92vh] overflow-hidden rounded-t-2xl border-line bg-[#15191f] p-0 text-ink shadow-2xl [&>div:first-child]:hidden">
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
            <button className="shrink-0 text-muted-foreground">‹</button>
            <Star className="size-5 shrink-0 fill-muted-foreground text-muted-foreground" />
            {tabs.map((tab, index) => (
              <button key={tab} className={index === 0 ? 'relative shrink-0 pb-2 text-ink after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-ink' : 'shrink-0 pb-2'}>
                {tab}
              </button>
            ))}
            <span className="shrink-0 text-line">|</span>
            <button className="shrink-0 text-ink">›</button>
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
          {rows.map((row) => {
            const active = row.symbol === currentSymbol;
            return (
              <button
                key={row.symbol}
                className={`grid w-full grid-cols-[minmax(0,1fr)_128px] items-center px-4 py-3 text-left ${active ? 'bg-white/[0.035]' : ''}`}
                onClick={() => onSelect(row.symbol)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Star className={`size-4 shrink-0 ${active ? 'fill-ink text-ink' : 'fill-muted-foreground text-muted-foreground'}`} />
                  <span className="grid size-5 shrink-0 place-items-center rounded-full text-[0.62rem] font-bold text-white" style={{ background: row.iconColor }}>
                    {row.base.slice(0, 1)}
                  </span>
                  <span className="truncate text-[0.95rem] font-semibold">{row.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[0.9rem] font-semibold text-ink tabular-nums">{row.price}</p>
                  <p className={`mt-1 font-mono text-[0.78rem] tabular-nums ${row.change >= 0 ? 'text-[#04c9f4]' : 'text-danger'}`}>
                    {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%
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

function getMarketPickerRows() {
  return marketPairs;
}

function getTicker(symbol: string) {
  const ticker = getTickerBySymbol(symbol);
  const changePrefix = ticker.change >= 0 ? '+' : '-';

  return {
    ...ticker,
    spotPrice: ticker.price,
    changeText: `${ticker.change >= 0 ? '+' : ''}${ticker.change.toFixed(2)}%`,
    delta: `${changePrefix}${ticker.delta}`,
  };
}

function makeDepthRows(price: string, side: 'buy' | 'sell', contract: boolean) {
  const centerPrice = parsePrice(price);
  const decimals = getPriceDecimals(price);
  const step = getPriceStep(centerPrice, contract);
  const amountSeeds = contract ? [1.245, 0.85, 0.42, 3.105, 2.1] : [0.125, 0.45, 1.2, 0.05, 0.21];

  return amountSeeds.map((amount, index) => {
    const level = index + 1;
    const levelPrice = side === 'sell' ? centerPrice + step * level : centerPrice - step * level;

    return [
      formatPrice(levelPrice, decimals),
      amount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    ];
  });
}

function parsePrice(price: string) {
  return Number(price.replace(/,/g, ''));
}

function getPriceDecimals(price: string) {
  return price.includes('.') ? price.split('.')[1]?.length ?? 0 : 0;
}

function getPriceStep(price: number, contract: boolean) {
  if (price >= 1000) return contract ? 1.5 : 1;
  if (price >= 100) return contract ? 0.1 : 0.05;
  if (price >= 1) return contract ? 0.01 : 0.005;
  return contract ? 0.0002 : 0.0001;
}

function formatPrice(price: number, decimals: number) {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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

function makeCandleData() {
  const baseTime = 1760000000;
  const closes = [
    61720, 61620, 61780, 61860, 62080, 62140, 62020, 61710, 61750, 61820, 61680, 61520,
    61360, 61470, 61590, 61340, 61260, 61420, 61550, 61640, 61780, 61620, 61720, 61685,
  ];

  return closes.map((close, index) => {
    const open = index === 0 ? 61760 : closes[index - 1];
    const high = Math.max(open, close) + 70 + (index % 4) * 22;
    const low = Math.min(open, close) - 75 - (index % 3) * 18;

    return {
      time: (baseTime + index * 900) as UTCTimestamp,
      open,
      high,
      low,
      close,
    };
  });
}
