import { Bell, CandlestickChart, ChevronDown, FileText, Menu, Star, WalletCards } from 'lucide-react';
import { asks, bids, candleData, contractAsks, contractBids } from '../../data/mock';
import { CoinDot } from '../../components/CoinDot';
import type { TradeMode } from '../../types/app';

type TradePageProps = {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
  showChart: boolean;
  setShowChart: (value: boolean) => void;
  openLeverage: () => void;
};

export function TradePage({ mode, setMode, showChart, setShowChart, openLeverage }: TradePageProps) {
  if (showChart) {
    return <ChartTradePage mode={mode} setMode={setMode} closeChart={() => setShowChart(false)} openLeverage={openLeverage} />;
  }

  return (
    <section>
      <TradeTop mode={mode} setMode={setMode} />
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-xl font-bold">
            <CoinDot /> BTC/USDT <ChevronDown className="size-4" />
          </button>
          <div className="flex items-center gap-4">
            <button aria-label="收藏交易对">
              <Star className="size-7 fill-[#F59E0B] text-[#F59E0B]" />
            </button>
            <button aria-label="打开K线图" onClick={() => setShowChart(true)}>
              <CandlestickChart className="size-7 text-brand" />
            </button>
          </div>
        </div>
        <p className="mt-4 font-mono text-[42px] font-bold text-brand">{mode === 'contract' ? '64,230.50' : '61,700.00'}</p>
        <p className="font-mono text-lg text-muted">
          ≈$61,647.09 <span className="text-danger">-2.35% -1484.64</span>
        </p>
      </div>
      {mode === 'contract' ? <ContractTradeForm openLeverage={openLeverage} /> : <SpotTradeForm compact />}
    </section>
  );
}

function TradeTop({ mode, setMode }: { mode: TradeMode; setMode: (mode: TradeMode) => void }) {
  return (
    <header className="flex h-[58px] items-center justify-between border-b border-line px-4">
      <Menu className="size-7 text-muted" />
      <div className="rounded-lg bg-soft p-1">
        <button className={`rounded-md px-8 py-2 text-lg ${mode === 'spot' ? 'bg-base text-ink' : 'text-muted'}`} onClick={() => setMode('spot')}>
          现货
        </button>
        <button className={`rounded-md px-8 py-2 text-lg ${mode === 'contract' ? 'bg-soft2 text-ink' : 'text-muted'}`} onClick={() => setMode('contract')}>
          合约
        </button>
      </div>
      <Bell className="size-6 text-muted" />
    </header>
  );
}

function ChartTradePage({
  mode,
  setMode,
  closeChart,
  openLeverage,
}: {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
  closeChart: () => void;
  openLeverage: () => void;
}) {
  return (
    <section>
      <TradeTop mode={mode} setMode={setMode} />
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-xl font-bold" onClick={closeChart}>
            <CoinDot /> BTC/USDT <ChevronDown className="size-4" />
          </button>
          <div className="flex items-center gap-4">
            <button aria-label="收藏交易对">
              <Star className="size-7 fill-[#F59E0B] text-[#F59E0B]" />
            </button>
            <button aria-label={mode === 'contract' ? '调整杠杆' : '返回下单'} onClick={mode === 'contract' ? openLeverage : closeChart}>
              <CandlestickChart className="size-7 text-brand" />
            </button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_1fr] gap-4">
          <div>
            <p className="font-mono text-[40px] font-bold text-brand">{mode === 'contract' ? '64,230.50' : '62,167.03'}</p>
            <p className="font-mono text-sm text-muted">
              ≈$61,117.35 <span className="text-brand">+0.13% +81.29</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-right text-xs text-muted">
            <Stat label="24h最高" value="62,453.33" />
            <Stat label="24h量(BTC)" value="5,936.97" />
            <Stat label="24h最低" value="60,727.6" />
            <Stat label="24h额(USDT)" value="3.65亿" />
          </div>
        </div>
      </div>
      <div className="border-b border-line">
        <div className="flex gap-8 px-4 py-3 text-lg">
          <button className="border-b-2 border-brand pb-2 text-brand">图表</button>
          <button className="text-muted">币种概况</button>
        </div>
        <div className="flex items-center justify-between bg-base2 px-4 py-3 text-sm text-muted">
          {['15分', '30分', '1小时', '4小时', '1日', '周线'].map((item, index) => (
            <button key={item} className={index === 0 ? 'rounded-full bg-soft2 px-4 py-2 text-ink' : ''}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <CandleChart />
      {mode === 'contract' ? <ContractTradeForm openLeverage={openLeverage} condensed /> : <SpotTradeForm />}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p>{label}</p>
      <p className="font-mono text-sm text-ink">{value}</p>
    </div>
  );
}

function CandleChart() {
  return (
    <div className="relative h-[270px] border-b border-line bg-base">
      <div className="absolute inset-0 chart-grid" />
      <div className="absolute inset-x-4 bottom-8 top-8 flex items-end gap-2">
        {candleData.map((height, index) => {
          const green = index % 3 !== 0;
          return (
            <span key={index} className="relative flex flex-1 items-end justify-center">
              <span className={`absolute w-px ${green ? 'bg-brand' : 'bg-danger'}`} style={{ bottom: index % 2 ? 8 : 0, height: `${height + 28}px` }} />
              <span className={`z-10 w-full max-w-[10px] ${green ? 'bg-brand' : 'bg-danger'}`} style={{ height: `${height}px` }} />
            </span>
          );
        })}
      </div>
      <span className="absolute bottom-16 right-0 rounded-l bg-danger px-2 py-1 font-mono text-xs text-white">61,101.57</span>
    </div>
  );
}

function SpotTradeForm({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${compact ? 'px-4 py-5' : 'grid grid-cols-[minmax(0,1fr)_132px] gap-3 px-4 py-5'}`}>
      <div>
        <BuySellTabs />
        <OrderInputs />
        <button className="mt-5 w-full rounded bg-brand py-4 text-lg font-bold text-white">买入 BTC</button>
      </div>
      {!compact && <OrderBook />}
      <CurrentOrders />
    </div>
  );
}

function ContractTradeForm({ openLeverage, condensed = false }: { openLeverage: () => void; condensed?: boolean }) {
  return (
    <div className={`${condensed ? 'grid grid-cols-[minmax(0,1fr)_132px] gap-3 px-4 py-5' : 'px-4 py-5'}`}>
      <div>
        {!condensed && (
          <button className="mb-4 rounded border border-line px-4 py-2 text-sm text-brand" onClick={openLeverage}>
            全仓 | 10x
          </button>
        )}
        <div className="mb-4 grid grid-cols-2 rounded border border-line p-1">
          <button className="rounded bg-soft2 py-3">开仓</button>
          <button className="py-3 text-muted">平仓</button>
        </div>
        <button className="mb-3 flex w-full items-center justify-between text-left text-sm text-muted" onClick={openLeverage}>
          限价委托 <ChevronDown className="size-4" />
        </button>
        <OrderInputs contract />
        <div className="mt-5 flex flex-col gap-3">
          <button className="rounded bg-brand py-4 text-lg font-bold text-white">买入/做多</button>
          <button className="rounded bg-danger py-4 text-lg font-bold text-white">卖出/做空</button>
        </div>
      </div>
      {condensed ? (
        <OrderBook contract />
      ) : (
        <>
          <OrderBook contract />
          <CurrentOrders />
        </>
      )}
    </div>
  );
}

function BuySellTabs() {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3">
      <button className="rounded bg-brand py-3 text-lg font-bold text-white">买入</button>
      <button className="rounded bg-soft2 py-3 text-lg font-bold text-ink">卖出</button>
    </div>
  );
}

function OrderInputs({ contract = false }: { contract?: boolean }) {
  return (
    <div>
      <div className="mb-4 flex gap-5 text-sm">
        <button className="border-b-2 border-brand pb-2 text-ink">限价</button>
        <button className="pb-2 text-muted">市价</button>
      </div>
      <InputBox value={contract ? '64230.50' : '61549.99'} suffix="USDT" stepper />
      <InputBox value="" placeholder="数量" suffix="BTC" />
      <div className="my-5">
        <div className="relative h-1 rounded bg-line">
          <span className="absolute left-0 top-1/2 size-4 -translate-y-1/2 rounded-full bg-brand" />
          <span className="absolute left-1/4 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-line bg-base" />
          <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-line bg-base" />
          <span className="absolute left-3/4 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-line bg-base" />
          <span className="absolute right-0 top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-line bg-base" />
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted">
          {['0%', '25%', '50%', '75%', '100%'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <InputBox value="" placeholder={contract ? '数量' : '合计'} suffix={contract ? '' : 'USDT'} />
      <div className="mt-4 flex justify-between text-sm text-muted">
        <span>可用</span>
        <span className="font-mono text-ink">{contract ? '12,450.00' : '0.0000'} USDT</span>
      </div>
    </div>
  );
}

function InputBox({ value, placeholder, suffix, stepper }: { value: string; placeholder?: string; suffix?: string; stepper?: boolean }) {
  return (
    <div className="mb-4 flex h-12 min-w-0 items-center rounded border border-line bg-base2">
      <input className="min-w-0 flex-1 bg-transparent px-4 font-mono text-base outline-none placeholder:text-muted" value={value} placeholder={placeholder} readOnly />
      {suffix && <span className="px-2 text-xs text-muted">{suffix}</span>}
      {stepper && (
        <span className="grid h-full w-8 shrink-0 place-items-center border-l border-line text-lg text-muted">
          ＋<span className="-mt-3 block">−</span>
        </span>
      )}
    </div>
  );
}

function OrderBook({ contract = false }: { contract?: boolean }) {
  const sellRows = contract ? contractAsks : asks;
  const buyRows = contract ? contractBids : bids;

  return (
    <div className="min-w-0">
      <div className="mb-3 flex gap-3 text-base">
        <button className="border-b-2 border-brand pb-1">盘口</button>
        <button className="text-muted">最新成交</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted">
        <span>价(USDT)</span>
        <span className="text-right">量(BTC)</span>
      </div>
      <div className="mt-2 space-y-2 font-mono">
        {sellRows.map(([price, amount]) => (
          <div key={price} className="grid grid-cols-2 text-[12px]">
            <span className="text-danger">{price}</span>
            <span className="text-right">{amount}</span>
          </div>
        ))}
      </div>
      <div className="my-4 font-mono text-[22px] font-bold text-brand">{contract ? '64,230.50' : '61,700.00'}</div>
      <div className="space-y-2 font-mono">
        {buyRows.map(([price, amount]) => (
          <div key={price} className="grid grid-cols-2 text-[12px]">
            <span className="text-brand">{price}</span>
            <span className="text-right">{amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrentOrders() {
  return (
    <div className="col-span-full -mx-4 mt-8 border-t border-line px-4 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">当前委托</h2>
        <FileText className="size-6 text-muted" />
      </div>
      <div className="grid min-h-[150px] place-items-center text-muted">
        <div className="text-center">
          <WalletCards className="mx-auto mb-2 size-10" />
          <p>暂无订单</p>
        </div>
      </div>
    </div>
  );
}
