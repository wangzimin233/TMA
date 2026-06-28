import { useLayoutEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSpotMarketList, useSpotFavorites } from '../../hooks/useSpotQueries';
import { useTradeStore } from '../../store/trade.store';
import { useMarketUiStore } from '../../store/market-ui.store';
import { symbolFormat } from '../../lib/utils';
import { scrollViewportTo } from '../../lib/scroll';
import type { SpotMarketListParams } from '../../types/app';

export function MarketPage({ openTrade }: { openTrade: () => void }) {
  const mainTab = useMarketUiStore((state) => state.mainTab);
  const subTab = useMarketUiStore((state) => state.subTab);
  const searchQuery = useMarketUiStore((state) => state.searchQuery);
  const showSearch = useMarketUiStore((state) => state.showSearch);
  const scrollY = useMarketUiStore((state) => state.scrollY);
  const hasSavedScroll = useMarketUiStore((state) => state.hasSavedScroll);
  const setMainTab = useMarketUiStore((state) => state.setMainTab);
  const setSubTab = useMarketUiStore((state) => state.setSubTab);
  const setSearchQuery = useMarketUiStore((state) => state.setSearchQuery);
  const setShowSearch = useMarketUiStore((state) => state.setShowSearch);
  const resetScrollPosition = useMarketUiStore((state) => state.resetScrollPosition);
  const setCurrentSymbol = useTradeStore((state) => state.setCurrentSymbol);
  const setShowChart = useTradeStore((state) => state.setShowChart);
  const didRestoreAfterLoadRef = useRef(false);
  const isPlaceholderTab = mainTab === '合约' || mainTab === '榜单';
  const isSpotTab = mainTab === '现货';
  const isFavoriteTab = mainTab === '自选';

  // 构建API查询参数
  const params: SpotMarketListParams | undefined = isSpotTab
    ? {
        keyword: searchQuery || undefined,
        tab: subTab === '全部' ? 'ALL' : subTab === '热门' ? 'HOT' : subTab === '涨幅榜' ? 'GAINERS' : 'LOSERS',
      }
    : undefined;

  // 根据tab选择数据源
  const { data: marketList = [], isLoading: marketLoading } = useSpotMarketList(params, isSpotTab);
  const { data: favoriteList = [], isLoading: favoritesLoading } = useSpotFavorites(isFavoriteTab);

  const rows = isPlaceholderTab ? [] : isFavoriteTab ? favoriteList : marketList;
  const isLoading = isPlaceholderTab ? false : isFavoriteTab ? favoritesLoading : marketLoading;

  // 确保是数组类型
  const rowsArray = Array.isArray(rows) ? rows : [];

  useLayoutEffect(() => {
    if (didRestoreAfterLoadRef.current || isLoading || !hasSavedScroll) return;

    didRestoreAfterLoadRef.current = true;
    const frame = window.requestAnimationFrame(() => scrollViewportTo(scrollY));

    return () => window.cancelAnimationFrame(frame);
  }, [hasSavedScroll, isLoading, scrollY]);

  const resetMarketListPosition = () => {
    resetScrollPosition();
    scrollViewportTo(0);
  };

  const handleRowClick = (symbolCode: string) => {
    const normalizedSymbol = symbolFormat.normalize(symbolCode);
    setCurrentSymbol(normalizedSymbol);
    setShowChart(false);
    openTrade();
  };

  return (
    <section>
      <header className="border-b border-line bg-panel px-4 pt-3">
        <div className="flex h-8 min-w-0 items-start justify-between gap-3">
          <div className="no-scrollbar flex min-w-0 flex-1 gap-6 overflow-x-auto whitespace-nowrap text-[0.95rem] text-muted-foreground">
            {(['自选', '现货', '合约', '榜单'] as const).map((item) => (
              <button
                key={item}
                className={mainTab === item ? 'relative shrink-0 pb-2 text-brand after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-brand' : 'shrink-0 pb-2'}
                onClick={() => {
                  if (item === mainTab) return;

                  setMainTab(item);
                  if (item !== '现货') {
                    setSubTab('全部');
                  }
                  resetMarketListPosition();
                }}
              >
                {item}
              </button>
            ))}
          </div>
          {showSearch ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                placeholder="搜索交易对"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  resetMarketListPosition();
                }}
                className="min-w-0 flex-1 bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  if (searchQuery) {
                    setSearchQuery('');
                    resetMarketListPosition();
                  }
                }}
              >
                <X className="size-5 shrink-0 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowSearch(true)}>
              <Search className="size-6 shrink-0 text-muted-foreground" />
            </button>
          )}
        </div>
        {isSpotTab && (
          <div className="no-scrollbar -mx-4 mt-3.5 flex items-center gap-4 overflow-x-auto whitespace-nowrap px-4 text-[0.82rem] text-muted-foreground">
            {(['全部', '热门', '涨幅榜', '跌幅榜'] as const).map((item) => (
              <button
                key={item}
                className={`inline-flex h-8 shrink-0 items-center justify-center ${subTab === item ? 'rounded bg-soft px-2.5 text-ink' : ''}`}
                onClick={() => {
                  if (item === subTab) return;

                  setSubTab(item);
                  resetMarketListPosition();
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(94px,1fr)_76px] py-2.5 text-[0.76rem] text-muted-foreground">
          <span>名称</span>
          <span className="text-right">最新价</span>
          <span className="text-right">24H 涨跌</span>
        </div>
      </header>
      <div>
        {isLoading ? (
          <div className="py-20 text-center text-[0.9rem] text-muted-foreground">加载中...</div>
        ) : rowsArray.length === 0 ? (
          <div className="py-20 text-center text-[0.9rem] text-muted-foreground">
            {mainTab === '自选' ? '暂无自选，快去收藏交易对吧' : '暂无数据'}
          </div>
        ) : (
          rowsArray.map((row) => (
            <button
              key={row.symbolCode}
              className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(94px,1fr)_76px] items-center border-b border-line px-4 py-2.5 text-left"
              onClick={() => handleRowClick(row.symbolCode)}
            >
              <div>
                <p className="text-[0.95rem] font-medium">{row.symbolName}</p>
                <p className="mt-1 text-[0.72rem] text-muted-foreground">Vol {formatVolume(row.volume)}</p>
              </div>
              <div className="min-w-0 text-right">
                <p className={`font-mono text-[0.96rem] tabular-nums ${row.priceChangePercent >= 0 ? 'text-buy' : 'text-sell'}`}>
                  {formatPrice(row.lastPrice)}
                </p>
                <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                  ≈${formatPrice(row.lastPrice)}
                </p>
              </div>
              <span className={`ml-2 rounded px-1.5 py-1.5 text-center font-mono text-[0.78rem] font-semibold text-white tabular-nums ${row.priceChangePercent >= 0 ? 'bg-buy' : 'bg-sell'}`}>
                {row.priceChangePercent >= 0 ? '+' : ''}
                {row.priceChangePercent.toFixed(2)}%
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(6);
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toFixed(2);
}
