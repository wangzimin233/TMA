import { Search } from 'lucide-react';
import { marketRows } from '../../data/mock';

export function MarketPage({ openTrade }: { openTrade: () => void }) {
  return (
    <section>
      <header className="border-b border-line bg-panel px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-8 text-xl text-muted">
            {['自选', '现货', '合约', '榜单'].map((item) => (
              <button
                key={item}
                className={item === '现货' ? 'relative text-brand after:absolute after:-bottom-4 after:left-0 after:h-0.5 after:w-full after:bg-brand' : ''}
              >
                {item}
              </button>
            ))}
          </div>
          <Search className="size-7 text-muted" />
        </div>
        <div className="mt-5 flex items-center justify-between text-lg text-muted">
          {['全部', '热门', '涨幅榜', '跌幅榜', 'USDT'].map((item, index) => (
            <button key={item} className={index === 0 ? 'rounded bg-soft px-4 py-2 text-ink' : ''}>
              {item}
              {item === 'USDT' ? '⌄' : ''}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_1fr_104px] py-4 text-lg text-muted">
          <span>名称</span>
          <span className="text-right">最新价</span>
          <span className="text-right">24H 涨跌</span>
        </div>
      </header>
      <div>
        {marketRows.map((row) => (
          <button key={row.symbol} className="grid w-full grid-cols-[1fr_1fr_104px] items-center border-b border-line px-4 py-4 text-left" onClick={openTrade}>
            <div>
              <p className="text-lg">{row.symbol.replace('/', ' / ')}</p>
              <p className="mt-1 text-base text-muted">Vol {row.volume}</p>
            </div>
            <div className="text-right">
              <p className={`font-mono text-xl ${row.change >= 0 ? 'text-brand' : 'text-danger'}`}>{row.price}</p>
              <p className="mt-1 font-mono text-sm text-muted">{row.fiat}</p>
            </div>
            <span className={`ml-4 rounded px-2 py-2 text-center font-mono text-lg text-white ${row.change >= 0 ? 'bg-brand' : 'bg-danger'}`}>
              {row.change >= 0 ? '+' : ''}
              {row.change.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
