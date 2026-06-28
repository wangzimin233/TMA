import { useMemo } from 'react';
import { BrandHeader } from '../../components/BrandHeader';
import { MarketLine } from '../../components/MarketLine';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { quickActions } from '../../data/mock';
import { useAccountOverview } from '../../hooks/useAccountQueries';
import { useSpotMarketList, useSpotFavorites } from '../../hooks/useSpotQueries';
import { useMarketUiStore, type HomeMarketTab, type HomeMarketTypeFilter } from '../../store/market-ui.store';
import { useTradeStore } from '../../store/trade.store';
import { symbolFormat } from '../../lib/utils';
import type { MarketPairView } from '../../types/app';

const homeMarketTabs = ['自选', '热门', '涨幅榜', '跌幅榜'] as const satisfies readonly HomeMarketTab[];
const marketTypeFilters = ['全部', '现货', '合约'] as const satisfies readonly HomeMarketTypeFilter[];

export function HomePage({
  isLogin,
  openAuth,
  openDeposit,
  openWithdraw,
  openTrade,
  openProfile,
}: {
  isLogin: boolean;
  openAuth: () => void;
  openDeposit: () => void;
  openWithdraw: () => void;
  openTrade: () => void;
  openProfile: () => void;
}) {
  // 查询热门币种前3个
  const { data: hotMarkets = [] } = useSpotMarketList({ tab: 'HOT', limit: 3 });
  const { data: accountOverview } = useAccountOverview(isLogin);
  const setCurrentSymbol = useTradeStore((state) => state.setCurrentSymbol);
  const setTradeMode = useTradeStore((state) => state.setTradeMode);
  const setShowChart = useTradeStore((state) => state.setShowChart);
  const valuationCoinCode = accountOverview?.valuationCoinCode ?? 'USDT';
  const totalAssetText = isLogin && accountOverview ? formatValuation(accountOverview.estimatedTotalValue, valuationCoinCode) : '--';
  const pnlText = isLogin && accountOverview ? `${formatSigned(accountOverview.todayPnlValue)} ${valuationCoinCode}` : '--';
  const estimatedText = isLogin && accountOverview ? `≈ ${formatNumber(accountOverview.estimatedTotalValue)} ${valuationCoinCode}` : '--';

  const openPair = (symbolCode: string) => {
    const normalizedSymbol = symbolFormat.normalize(symbolCode);
    setCurrentSymbol(normalizedSymbol);
    setShowChart(false);
    openTrade();
  };

  const openTradeMode = (mode: 'spot' | 'contract') => {
    setTradeMode(mode);
    setShowChart(false);
    openTrade();
  };

  // 确保是数组类型
  const hotMarketsArray = Array.isArray(hotMarkets) ? hotMarkets : [];

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
                onClick={
                  action.label === '充值'
                    ? openDeposit
                    : action.label === '合约'
                      ? () => openTradeMode('contract')
                      : action.label === '现货'
                        ? () => openTradeMode('spot')
                        : undefined
                }
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

        <div className="rounded-md border border-line bg-panel px-3.5 py-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.72rem] text-muted-foreground">总资产折算</p>
              <div className="mt-1.5 flex items-end gap-2">
                <span className="min-w-0 truncate font-mono text-[1.34rem] font-bold leading-none tabular-nums">
                  {totalAssetText}
                </span>
              </div>
              <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                今日盈亏{' '}
                <span className={`font-mono tabular-nums ${getSignedClass(accountOverview?.todayPnlValue)}`}>
                  {pnlText}
                </span>
              </p>
              <p className="mt-1 font-mono text-[0.72rem] text-muted-foreground tabular-nums">
                {estimatedText}
              </p>
            </div>
            <button
              className="rounded border border-line bg-base2 px-2.5 py-1.5 text-[0.72rem] text-muted-foreground"
              onClick={isLogin ? openProfile : openAuth}
            >
              {isLogin ? '资产' : '登录'}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button className="rounded bg-brand py-2 text-[0.82rem] font-semibold text-primary-foreground" onClick={openDeposit}>充值</button>
            <button className="rounded border border-line bg-base2 py-2 text-[0.82rem] font-semibold" onClick={openWithdraw}>提现</button>
            <button className="rounded border border-line bg-base2 py-2 text-[0.82rem] font-semibold" onClick={openTrade}>交易</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {hotMarketsArray.slice(0, 3).map((item) => (
            <button key={item.symbolCode} className="text-left" onClick={() => openPair(item.symbolCode)}>
              <CoinCard
                pair={{
                  symbol: symbolFormat.normalize(item.symbolCode),
                  base: item.baseCoinCode,
                  quote: item.quoteCoinCode,
                  price: formatPrice(item.lastPrice),
                  fiat: `$${formatPrice(item.lastPrice)}`,
                  change: item.priceChangePercent,
                  volume: formatVolume(item.volume),
                  iconColor: '#F7931A', // 默认颜色
                }}
              />
            </button>
          ))}
        </div>

        <MarketPreview openPair={openPair} />
      </div>
    </section>
  );
}

function formatValuation(value: number, coinCode: string) {
  const formatted = formatNumber(value);
  if (coinCode === 'USD' || coinCode === 'USDT') return `$${formatted}`;
  return `${formatted} ${coinCode}`;
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
  }).format(Number(value) || 0);
}

function formatSigned(value?: number) {
  const normalizedValue = Number(value) || 0;
  const prefix = normalizedValue > 0 ? '+' : '';
  return `${prefix}${formatNumber(normalizedValue)}`;
}

function getSignedClass(value?: number) {
  const normalizedValue = Number(value) || 0;
  if (normalizedValue > 0) return 'text-buy';
  if (normalizedValue < 0) return 'text-sell';
  return 'text-muted-foreground';
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

function formatVolume(volume: number): string {
  if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(2)}B`;
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toFixed(2);
}

function CoinCard({ pair }: { pair: MarketPairView }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-panel p-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full text-[0.68rem] font-bold text-white" style={{ background: pair.iconColor }}>
          {pair.base.slice(0, 1)}
        </span>
        <span className="truncate text-[0.92rem] font-semibold">{pair.base}</span>
      </div>
      <p className="mt-2.5 truncate font-mono text-[0.78rem] text-muted-foreground tabular-nums">{pair.fiat}</p>
      <p className={`mt-1.5 font-mono text-[0.82rem] tabular-nums ${pair.change >= 0 ? 'text-buy' : 'text-sell'}`}>
        ↙ {Math.abs(pair.change).toFixed(2)}%
      </p>
    </div>
  );
}

function MarketPreview({ openPair }: { openPair: (symbolCode: string) => void }) {
  const activeTab = useMarketUiStore((state) => state.homeMarketTab);
  const marketType = useMarketUiStore((state) => state.homeMarketType);
  const setActiveTab = useMarketUiStore((state) => state.setHomeMarketTab);
  const setMarketType = useMarketUiStore((state) => state.setHomeMarketType);

  // 根据 activeTab 查询不同数据
  const tabMap = {
    '自选': undefined,
    '热门': 'HOT' as const,
    '涨幅榜': 'GAINERS' as const,
    '跌幅榜': 'LOSERS' as const,
  };

  const { data: marketList = [] } = useSpotMarketList(
    activeTab !== '自选' ? { tab: tabMap[activeTab], limit: 5 } : undefined
  );
  const { data: favoriteList = [] } = useSpotFavorites();

  const displayedPairs = useMemo(() => {
    const sourceList = activeTab === '自选' ? favoriteList : marketList;
    const sourceArray = Array.isArray(sourceList) ? sourceList : [];

    if (marketType === '合约') {
      return [];
    }

    return sourceArray.slice(0, 5);
  }, [activeTab, marketType, marketList, favoriteList]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="行情分类"
        className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto whitespace-nowrap border-b border-line px-4 text-[0.86rem]"
      >
        {homeMarketTabs.map((item) => (
          <button
            key={item}
            role="tab"
            type="button"
            aria-selected={activeTab === item}
            className={`relative shrink-0 py-2.5 font-semibold transition duration-150 active:scale-95 ${
              activeTab === item ? 'text-ink' : 'text-muted-foreground hover:text-ink/85'
            }`}
            onClick={() => setActiveTab(item)}
          >
            {item}
            <span
              className={`absolute inset-x-0 -bottom-px mx-auto h-0.5 rounded-full bg-brand transition-all duration-200 ${
                activeTab === item ? 'w-full opacity-100' : 'w-0 opacity-0'
              }`}
            />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(94px,1fr)_76px] px-1 py-2.5 text-[0.72rem] text-muted-foreground">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="筛选市场类型"
            className="group inline-flex w-fit items-center gap-0.5 rounded-sm outline-none transition active:scale-95 data-[state=open]:text-ink"
          >
            {marketType} <ChevronDown className="size-3 transition group-data-[state=open]:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="min-w-[5.5rem] rounded-md border border-line bg-panel p-1 text-[0.76rem] text-ink shadow-lg shadow-app/40 ring-0"
          >
            <DropdownMenuRadioGroup value={marketType} onValueChange={(value) => setMarketType(value as HomeMarketTypeFilter)}>
              {marketTypeFilters.map((filter) => (
                <DropdownMenuRadioItem
                  key={filter}
                  value={filter}
                  className="h-7 rounded px-2 py-0 pr-7 text-[0.76rem] text-muted-foreground focus:bg-soft focus:text-ink data-[state=checked]:text-ink [&_svg]:size-3.5 [&_[data-slot=dropdown-menu-radio-item-indicator]]:right-2 [&_[data-slot=dropdown-menu-radio-item-indicator]]:text-brand"
                >
                  {filter}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-right">最新价</span>
        <span className="text-right">24h涨跌</span>
      </div>
      <div>
        {displayedPairs.length === 0 ? (
          <div className="py-10 text-center text-[0.9rem] text-muted-foreground">
            {activeTab === '自选' && marketType !== '合约' ? '暂无自选' : '暂无数据'}
          </div>
        ) : (
          displayedPairs.map((item) => (
            <button key={item.symbolCode} className="block w-full text-left" onClick={() => openPair(item.symbolCode)}>
              <MarketLine
                pair={{
                  symbol: symbolFormat.normalize(item.symbolCode),
                  base: item.baseCoinCode,
                  quote: item.quoteCoinCode,
                  price: formatPrice(item.lastPrice),
                  fiat: `$${formatPrice(item.lastPrice)}`,
                  change: item.priceChangePercent,
                  volume: formatVolume(item.volume),
                  iconColor: '#F7931A',
                }}
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
