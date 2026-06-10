import type { MarketPair } from '../data/mock';

export function MarketLine({ pair }: { pair: MarketPair }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(94px,1fr)_76px] items-center border-b border-line px-1 py-2.5">
      <div className="min-w-0 text-[0.98rem] font-semibold">
        {pair.base}
        <span className="text-[0.7rem] font-medium text-muted">/{pair.quote}</span>
      </div>
      <div className="min-w-0 text-right">
        <p className="font-mono text-[0.98rem] font-semibold tabular-nums">{pair.price}</p>
        <p className="font-mono text-[0.7rem] text-muted tabular-nums">{pair.fiat}</p>
      </div>
      <div className={`ml-2 rounded px-1.5 py-1.5 text-center font-mono text-[0.78rem] font-semibold text-white tabular-nums ${pair.change >= 0 ? 'bg-brand' : 'bg-danger'}`}>
        {pair.change >= 0 ? '+' : ''}
        {pair.change.toFixed(2)}%
      </div>
    </div>
  );
}
