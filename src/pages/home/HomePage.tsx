import { BrandHeader } from '../../components/BrandHeader';
import { MarketLine } from '../../components/MarketLine';
import { marketPairs, quickActions } from '../../data/mock';
import type { MarketPair } from '../../data/mock';

export function HomePage({ openTrade }: { openTrade: () => void }) {
  return (
    <section>
      <BrandHeader />
      <div className="space-y-7 px-4 pt-5">
        <div className="grid grid-cols-4 gap-x-7 gap-y-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="group flex flex-col items-center gap-2 text-center"
                onClick={action.label === '合约' || action.label === '现货' ? openTrade : undefined}
              >
                <span className="relative grid size-11 place-items-center rounded-[5px] border border-line bg-panel text-ink transition group-active:scale-95">
                  {action.hot && (
                    <span className="absolute -right-2 -top-1 rounded bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                      HOT
                    </span>
                  )}
                  <Icon className="size-5" />
                </span>
                <span className="text-sm text-muted">{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative h-[210px] overflow-hidden rounded-lg border border-line bg-[radial-gradient(circle_at_70%_30%,rgba(47,190,133,.35),transparent_28%),linear-gradient(135deg,#071232,#0b5f43_70%,#0a372f)]">
          <div className="absolute inset-0 opacity-30 crypto-grid" />
          <div className="absolute left-5 top-8">
            <p className="text-sm text-muted">New User Bonus</p>
            <p className="mt-2 text-2xl font-bold">最高可达 500 USDT</p>
          </div>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5">
            <span className="h-1.5 w-7 rounded-full bg-ink" />
            <span className="size-1.5 rounded-full bg-muted" />
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          {marketPairs.slice(0, 3).map((pair) => (
            <CoinCard key={pair.symbol} pair={pair} />
          ))}
        </div>

        <MarketPreview />
      </div>
    </section>
  );
}

function CoinCard({ pair }: { pair: MarketPair }) {
  return (
    <div className="min-w-[132px] rounded-[5px] border border-line bg-panel p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full text-sm font-bold text-white" style={{ background: pair.iconColor }}>
          {pair.base.slice(0, 1)}
        </span>
        <span className="text-xl font-bold">{pair.base}</span>
      </div>
      <p className="mt-4 font-mono text-lg text-muted">{pair.fiat}</p>
      <p className={`mt-3 font-mono text-xl ${pair.change >= 0 ? 'text-brand' : 'text-danger'}`}>
        ↙ {Math.abs(pair.change).toFixed(2)}%
      </p>
    </div>
  );
}

function MarketPreview() {
  return (
    <div>
      <div className="flex gap-6 border-b border-line pb-3 text-sm">
        {['自选', '热门', '涨幅榜', '跌幅榜', '新币'].map((item, index) => (
          <button key={item} className={index === 0 ? 'font-bold text-ink' : 'text-muted'}>
            {item}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_1fr_96px] px-1 py-4 text-xs text-muted">
        <span>全部⌄</span>
        <span className="text-right">最新价</span>
        <span className="text-right">24h涨跌</span>
      </div>
      <div>
        {marketPairs.slice(0, 5).map((pair) => (
          <MarketLine key={pair.symbol} pair={pair} />
        ))}
      </div>
    </div>
  );
}
