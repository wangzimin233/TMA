import type { MarketPair } from '../data/mock';

export function MarketLine({ pair }: { pair: MarketPair }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_92px] items-center border-b border-line px-1 py-3">
      <div className="text-xl font-bold">
        {pair.base}
        <span className="text-sm font-medium text-muted">/{pair.quote}</span>
      </div>
      <div className="text-right">
        <p className="font-mono text-xl font-bold">{pair.price}</p>
        <p className="font-mono text-sm text-muted">{pair.fiat}</p>
      </div>
      <div className={`ml-4 rounded px-3 py-2 text-center font-mono text-lg font-bold text-white ${pair.change >= 0 ? 'bg-brand' : 'bg-danger'}`}>
        {pair.change >= 0 ? '+' : ''}
        {pair.change.toFixed(2)}%
      </div>
    </div>
  );
}
