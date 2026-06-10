import { ChevronDown, Search } from 'lucide-react';
import { useMarketRows } from '../../hooks/useMockQueries';
import { useTradeStore } from '../../store/trade.store';

export function MarketPage({ openTrade }: { openTrade: () => void }) {
  const { data: rows = [] } = useMarketRows();
  const setCurrentSymbol = useTradeStore((state) => state.setCurrentSymbol);
  const setShowChart = useTradeStore((state) => state.setShowChart);

  return (
    <section>
      <header className="border-b border-line bg-panel px-4 pt-3">
        <div className="flex h-8 items-start justify-between">
          <div className="flex gap-6 text-[0.95rem] text-muted">
            {['自选', '现货', '合约', '榜单'].map((item) => (
              <button
                key={item}
                className={item === '现货' ? 'relative pb-2 text-brand after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-brand' : 'pb-2'}
              >
                {item}
              </button>
            ))}
          </div>
          <Search className="size-6 text-muted" />
        </div>
        <div className="mt-3.5 flex items-center justify-between text-[0.82rem] text-muted">
          {['全部', '热门', '涨幅榜', '跌幅榜', 'USDT'].map((item, index) => (
            <button
              key={item}
              className={`inline-flex h-8 items-center justify-center ${index === 0 ? 'rounded bg-soft px-2.5 text-ink' : ''} ${item === 'USDT' ? 'min-w-[44px] justify-end' : ''}`}
            >
              {item}
              {item === 'USDT' && <ChevronDown className="ml-0.5 size-3 translate-y-px" />}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(94px,1fr)_76px] py-2.5 text-[0.76rem] text-muted">
          <span>名称</span>
          <span className="text-right">最新价</span>
          <span className="text-right">24H 涨跌</span>
        </div>
      </header>
      <div>
        {rows.map((row) => (
          <button
            key={row.symbol}
            className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(94px,1fr)_76px] items-center border-b border-line px-4 py-2.5 text-left"
            onClick={() => {
              setCurrentSymbol(row.symbol);
              setShowChart(false);
              openTrade();
            }}
          >
            <div>
              <p className="text-[0.95rem] font-medium">{row.symbol.replace('/', ' / ')}</p>
              <p className="mt-1 text-[0.72rem] text-muted">Vol {row.volume}</p>
            </div>
            <div className="min-w-0 text-right">
              <p className={`font-mono text-[0.96rem] tabular-nums ${row.change >= 0 ? 'text-brand' : 'text-danger'}`}>{row.price}</p>
              <p className="mt-1 font-mono text-[0.7rem] text-muted tabular-nums">{row.fiat}</p>
            </div>
            <span className={`ml-2 rounded px-1.5 py-1.5 text-center font-mono text-[0.78rem] font-semibold text-white tabular-nums ${row.change >= 0 ? 'bg-brand' : 'bg-danger'}`}>
              {row.change >= 0 ? '+' : ''}
              {row.change.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
