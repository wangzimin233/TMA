import { useEffect, useRef, useState } from 'react';
import { Bell, Calculator, CandlestickChart, ChevronDown, FileText, Info, Menu, Star, WalletCards } from 'lucide-react';
import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from 'lightweight-charts';
import { asks, bids, contractAsks, contractBids, marketRows } from '../../data/mock';
import { CoinDot } from '../../components/CoinDot';
import { useTradeStore } from '../../store/trade.store';
import type { TradeMode } from '../../types/app';

type TradePageProps = {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
  showChart: boolean;
  setShowChart: (value: boolean) => void;
  openLeverage: () => void;
};

export function TradePage({ mode, setMode, showChart, setShowChart, openLeverage }: TradePageProps) {
  const currentSymbol = useTradeStore((state) => state.currentSymbol);
  const ticker = getTicker(currentSymbol);

  if (showChart) {
    return <ChartTradePage mode={mode} setMode={setMode} symbol={currentSymbol} ticker={ticker} closeChart={() => setShowChart(false)} openLeverage={openLeverage} />;
  }

  return (
    <section>
      <TradeTop mode={mode} setMode={setMode} />
      <div className="border-b border-line px-4 py-2.5">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-[0.95rem] font-semibold">
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
        <p className="mt-1.5 font-mono text-[0.78rem] text-muted tabular-nums">
          ≈{ticker.fiat} <span className={ticker.change >= 0 ? 'text-brand' : 'text-danger'}>{ticker.changeText} {ticker.delta}</span>
        </p>
      </div>
      <BinanceOrderPanel mode={mode} symbol={currentSymbol} openLeverage={openLeverage} />
    </section>
  );
}

function TradeTop({ mode, setMode }: { mode: TradeMode; setMode: (mode: TradeMode) => void }) {
  return (
    <header className="flex h-11 items-center justify-between border-b border-line px-4">
      <Menu className="size-5 text-muted" />
      <div className="rounded-md bg-[#202733] p-0.5">
        <button className={`rounded px-6 py-1.5 text-[0.86rem] outline-none transition-colors ${mode === 'spot' ? 'bg-[#111821] text-ink' : 'text-muted'}`} onClick={() => setMode('spot')}>
          现货
        </button>
        <button className={`rounded px-6 py-1.5 text-[0.86rem] outline-none transition-colors ${mode === 'contract' ? 'bg-[#111821] text-ink' : 'text-muted'}`} onClick={() => setMode('contract')}>
          合约
        </button>
      </div>
      <Bell className="size-5 text-muted" />
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
}: {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
  symbol: string;
  ticker: ReturnType<typeof getTicker>;
  closeChart: () => void;
  openLeverage: () => void;
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
          <button className="flex items-center gap-2 text-[1rem] font-semibold" onClick={closeChart}>
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
            <p className="mt-1.5 font-mono text-[0.72rem] text-muted tabular-nums">
              ≈{ticker.fiat} <span className={ticker.change >= 0 ? 'text-brand' : 'text-danger'}>{ticker.changeText} {ticker.delta}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-right text-[0.68rem] text-muted">
            <Stat label="24h最高" value="62,453.33" />
            <Stat label="24h量(BTC)" value="5,936.97" />
            <Stat label="24h最低" value="60,727.6" />
            <Stat label="24h额(USDT)" value="3.65亿" />
          </div>
        </div>
      </div>
      <div className="border-b border-line">
        <div className="flex gap-8 px-4 py-2 text-[0.9rem]">
          <button className="border-b-2 border-brand pb-1.5 text-brand">图表</button>
          <button className="text-muted">币种概况</button>
        </div>
        <div className="flex items-center justify-between bg-base2 px-4 py-2 text-[0.75rem] text-muted">
          {intervals.map((item) => (
            <button key={item} className={currentInterval === item ? 'rounded bg-soft2 px-2.5 py-1.5 text-ink' : ''} onClick={() => setCurrentInterval(item)}>
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
        <OrderBook base={base} contract={mode === 'contract'} />
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

function BinanceOrderPanel({ mode, symbol, openLeverage }: { mode: TradeMode; symbol: string; openLeverage: () => void }) {
  const base = symbol.split('/')[0] ?? 'BTC';
  const isContract = mode === 'contract';

  return (
    <div className="px-4 py-3.5">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8 text-[1rem] font-semibold">
          <button className="relative pb-2 text-ink after:absolute after:bottom-0 after:left-1 after:h-[3px] after:w-7 after:bg-warning">限价</button>
          <button className="pb-2 text-muted">市价</button>
        </div>
        <Info className="size-5 text-muted" />
      </div>

      <div className="mb-3.5 flex items-center justify-between text-[0.92rem] text-muted">
        <span>可用 -- USDT</span>
        <button className="text-[1.05rem] leading-none text-warning">⇆</button>
      </div>

      <div className="mb-2.5 flex items-end justify-between">
        <span className="text-[0.82rem] text-muted">委托价格</span>
        <Calculator className="size-4.5 text-muted" />
      </div>

      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_52px] gap-2">
        <TradeInput value="62,077.7" suffix="USDT" compact emphasis />
        <button className="rounded-lg border border-line bg-base2 text-[0.82rem] font-semibold text-ink transition-colors active:bg-soft">BBO</button>
      </div>

      <label className="mb-2 block text-[0.82rem] text-muted">数量</label>
      <TradeInput placeholder="" suffix={base} dropdown compact />
      <PercentRail />

      <div className="my-3.5 border-t border-line" />

      {isContract && (
        <div className="mb-3.5 space-y-3">
          <CheckRow label="止盈/止损" />
          <div className="flex items-center justify-between">
            <CheckRow label="只减仓" />
            <button className="flex items-center gap-1 text-[0.84rem] text-muted">
              生效时间 <span className="text-ink">GTC</span> <ChevronDown className="size-4" />
            </button>
          </div>
          <button className="rounded border border-line px-3 py-1.5 text-[0.8rem] text-brand" onClick={openLeverage}>
            全仓 | 10x
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <button className="rounded-lg bg-brand py-3 text-[1rem] font-semibold text-white transition active:brightness-90">{isContract ? '买入/做多' : `买入 ${base}`}</button>
        <button className="rounded-lg bg-danger py-3 text-[1rem] font-semibold text-white transition active:brightness-90">{isContract ? '卖出/做空' : `卖出 ${base}`}</button>
      </div>

      {isContract ? (
        <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.78rem]">
          <Metric label="强平价格" value="-- USDT" />
          <Metric label="强平价格" value="-- USDT" />
          <Metric label="保证金" value="0.00 USDT" />
          <Metric label="保证金" value="0.00 USDT" />
          <Metric label="可开" value={`0.000 ${base}`} />
          <Metric label="可开" value={`0.000 ${base}`} />
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
        className={`min-w-0 flex-1 bg-transparent font-mono text-ink outline-none placeholder:text-muted tabular-nums ${inputSizeClass}`}
        value={value}
        placeholder={placeholder}
        readOnly
      />
      <span className={`flex items-center gap-1 font-semibold text-ink ${suffixSizeClass}`}>
        {suffix}
        {dropdown && <ChevronDown className="size-4 text-muted" />}
      </span>
    </div>
  );
}

function PercentRail() {
  return (
    <div className="my-4 px-4">
      <div className="relative h-px bg-line">
        {[0, 25, 50, 75, 100].map((point, index) => (
          <span
            key={point}
            className={`absolute top-1/2 border border-line bg-base2 ${index === 0 ? 'size-3.5 border-ink' : 'size-2'}`}
            style={{ left: `${point}%`, transform: `translateX(-50%) translateY(-50%) rotate(45deg)` }}
          />
        ))}
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
      <p className="text-muted">{label} <span className="text-ink tabular-nums">{value}</span></p>
    </div>
  );
}

function OrderBook({ base = 'BTC', contract = false }: { base?: string; contract?: boolean }) {
  const sellRows = contract ? contractAsks : asks;
  const buyRows = contract ? contractBids : bids;
  const maxAmount = Math.max(...sellRows.concat(buyRows).map(([, amount]) => Number(amount.replace(/,/g, ''))));

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-3 text-[0.84rem]">
          <button className="border-b-2 border-brand pb-1">盘口</button>
          <button className="text-muted">最新成交</button>
        </div>
        <button className="rounded border border-line px-1.5 py-0.5 text-[0.68rem] text-muted">0.1</button>
      </div>
      <div className="grid grid-cols-2 gap-2 px-1 text-[0.68rem] text-muted">
        <span>价(USDT)</span>
        <span className="text-right">量({base})</span>
      </div>
      <div className="mt-1.5 space-y-0.5 font-mono">
        {sellRows.map(([price, amount]) => (
          <DepthRow key={price} price={price} amount={amount} maxAmount={maxAmount} side="sell" />
        ))}
      </div>
      <div className="my-2.5 flex items-baseline justify-between border-y border-line/70 py-2">
        <span className="font-mono text-[1.06rem] font-bold text-brand tabular-nums">{contract ? '64,230.50' : '61,700.00'}</span>
        <span className="font-mono text-[0.72rem] text-muted tabular-nums">≈ $61,700.00</span>
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

function getTicker(symbol: string) {
  const row = marketRows.find((item) => item.symbol === symbol);
  const price = row?.price ?? '61,700.00';
  const fiat = row?.fiat ?? '$61,647.09';
  const change = row?.change ?? -2.35;
  const absDelta = symbol.startsWith('BTC') ? '1484.64' : symbol.startsWith('ETH') ? '39.33' : '8.20';

  return {
    price,
    spotPrice: price,
    fiat,
    change,
    changeText: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
    delta: `${change >= 0 ? '+' : '-'}${absDelta}`,
  };
}

function CurrentOrders() {
  return (
    <div className="col-span-full -mx-4 mt-5 border-t border-line px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-[0.9rem] font-semibold">
          <button className="text-ink">当前委托</button>
          <button className="text-muted">历史委托</button>
        </div>
        <FileText className="size-4.5 text-muted" />
      </div>
      <div className="grid min-h-[70px] place-items-center text-muted">
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
