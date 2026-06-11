import { BrandHeader } from '../../components/BrandHeader';
import { MarketLine } from '../../components/MarketLine';
import { ChevronDown } from 'lucide-react';
import { quickActions } from '../../data/mock';
import type { MarketPair } from '../../data/mock';
import { useHomeMarkets, useUserAssets } from '../../hooks/useMockQueries';
import { useTradeStore } from '../../store/trade.store';

export function HomePage({ openTrade }: { openTrade: () => void }) {
  const { data: marketPairs = [] } = useHomeMarkets();
  const { data: assets } = useUserAssets();
  const setCurrentSymbol = useTradeStore((state) => state.setCurrentSymbol);
  const setShowChart = useTradeStore((state) => state.setShowChart);

  const openPair = (symbol: string) => {
    setCurrentSymbol(symbol);
    setShowChart(false);
    openTrade();
  };

  return (
    <section>
      <BrandHeader />
      <div className="space-y-4 px-4 pt-3.5">
        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="group flex min-w-0 flex-col items-center gap-1.5 text-center"
                onClick={action.label === '合约' || action.label === '现货' ? openTrade : undefined}
              >
                <span className="relative grid size-9 place-items-center rounded-md border border-line bg-panel text-ink transition group-active:scale-95">
                  {action.hot && (
                    <span className="absolute -right-2 -top-1 rounded bg-danger px-1 py-0.5 text-[9px] font-bold leading-none text-white">
                      HOT
                    </span>
                  )}
                  <Icon className="size-[1.05rem]" />
                </span>
                <span className="max-w-full truncate text-[0.74rem] text-muted-foreground">{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-md border border-line bg-panel px-4 py-3.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.72rem] text-muted-foreground">总资产折算</p>
              <div className="mt-1.5 flex items-end gap-2">
                <span className="font-mono text-[1.45rem] font-bold leading-none tabular-nums">${assets?.totalBalance ?? '45,231.89'}</span>
                <span className="pb-0.5 font-mono text-[0.76rem] text-brand tabular-nums">+{assets?.changePercent ?? 2.4}%</span>
              </div>
              <p className="mt-1 font-mono text-[0.72rem] text-muted-foreground tabular-nums">≈ {assets?.btcEstimate ?? '0.6432'} BTC</p>
            </div>
            <button className="rounded border border-line px-2.5 py-1.5 text-[0.72rem] text-muted-foreground">资产</button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button className="rounded bg-brand py-2 text-[0.82rem] font-semibold text-white">充值</button>
            <button className="rounded border border-line bg-base2 py-2 text-[0.82rem] font-semibold">提现</button>
            <button className="rounded border border-line bg-base2 py-2 text-[0.82rem] font-semibold" onClick={openTrade}>交易</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {marketPairs.slice(0, 3).map((pair) => (
            <button key={pair.symbol} className="text-left" onClick={() => openPair(pair.symbol)}>
              <CoinCard pair={pair} />
            </button>
          ))}
        </div>

        <MarketPreview openPair={openPair} />
      </div>
    </section>
  );
}

function CoinCard({ pair }: { pair: MarketPair }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-panel p-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full text-[0.68rem] font-bold text-white" style={{ background: pair.iconColor }}>
          {pair.base.slice(0, 1)}
        </span>
        <span className="truncate text-[0.92rem] font-semibold">{pair.base}</span>
      </div>
      <p className="mt-2.5 truncate font-mono text-[0.78rem] text-muted-foreground tabular-nums">{pair.fiat}</p>
      <p className={`mt-1.5 font-mono text-[0.82rem] tabular-nums ${pair.change >= 0 ? 'text-brand' : 'text-danger'}`}>
        ↙ {Math.abs(pair.change).toFixed(2)}%
      </p>
    </div>
  );
}

function MarketPreview({ openPair }: { openPair: (symbol: string) => void }) {
  const { data: marketPairs = [] } = useHomeMarkets();

  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto whitespace-nowrap border-b border-line px-4 pb-2.5 text-[0.86rem]">
        {['自选', '热门', '涨幅榜', '跌幅榜', '新币'].map((item, index) => (
          <button key={item} className={index === 0 ? 'shrink-0 font-bold text-ink' : 'shrink-0 text-muted-foreground'}>
            {item}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(94px,1fr)_76px] px-1 py-2.5 text-[0.72rem] text-muted-foreground">
        <span className="inline-flex items-center gap-0.5">
          全部 <ChevronDown className="size-3" />
        </span>
        <span className="text-right">最新价</span>
        <span className="text-right">24h涨跌</span>
      </div>
      <div>
        {marketPairs.slice(0, 5).map((pair) => (
          <button key={pair.symbol} className="block w-full text-left" onClick={() => openPair(pair.symbol)}>
            <MarketLine pair={pair} />
          </button>
        ))}
      </div>
    </div>
  );
}
