import { useMemo, useState } from 'react';
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
import type { MarketPair } from '../../data/mock';
import { useAccountOverview } from '../../hooks/useAccountQueries';
import { useHomeMarkets } from '../../hooks/useMockQueries';
import { useTradeStore } from '../../store/trade.store';

const homeMarketTabs = ['自选', '热门', '涨幅榜', '跌幅榜', '新币'] as const;
const marketTypeFilters = ['全部', '现货', '合约'] as const;
const spotMarketBases = ['BTC', 'ETH', 'BGB', 'XRP', 'SOL', 'BNB', 'DOGE', 'ADA'];
const futuresMarketBases = ['BTC', 'ETH', 'SOL', 'DOGE', 'SUI', 'NEAR', 'OP', 'AVAX', 'LINK', 'ARB'];

type HomeMarketTab = (typeof homeMarketTabs)[number];
type MarketTypeFilter = (typeof marketTypeFilters)[number];

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
  const { data: marketPairs = [] } = useHomeMarkets();
  const { data: accountOverview } = useAccountOverview(isLogin);
  const setCurrentSymbol = useTradeStore((state) => state.setCurrentSymbol);
  const setTradeMode = useTradeStore((state) => state.setTradeMode);
  const setShowChart = useTradeStore((state) => state.setShowChart);
  const valuationCoinCode = accountOverview?.valuationCoinCode ?? 'USDT';
  const totalAssetText = isLogin && accountOverview ? formatValuation(accountOverview.estimatedTotalValue, valuationCoinCode) : '--';
  const pnlText = isLogin && accountOverview ? `${formatSigned(accountOverview.todayPnlValue)} ${valuationCoinCode}` : '--';
  const estimatedText = isLogin && accountOverview ? `≈ ${formatNumber(accountOverview.estimatedTotalValue)} ${valuationCoinCode}` : '--';

  const openPair = (symbol: string) => {
    setCurrentSymbol(symbol);
    setShowChart(false);
    openTrade();
  };

  const openTradeMode = (mode: 'spot' | 'contract') => {
    setTradeMode(mode);
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
      <p className={`mt-1.5 font-mono text-[0.82rem] tabular-nums ${pair.change >= 0 ? 'text-buy' : 'text-sell'}`}>
        ↙ {Math.abs(pair.change).toFixed(2)}%
      </p>
    </div>
  );
}

function MarketPreview({ openPair }: { openPair: (symbol: string) => void }) {
  const { data: marketPairs = [] } = useHomeMarkets();
  const [activeTab, setActiveTab] = useState<HomeMarketTab>('自选');
  const [marketType, setMarketType] = useState<MarketTypeFilter>('全部');
  const displayedPairs = useMemo(() => {
    const pairs = marketPairs.filter((pair) => {
      if (marketType === '现货') return spotMarketBases.includes(pair.base);
      if (marketType === '合约') return futuresMarketBases.includes(pair.base);
      return true;
    });

    switch (activeTab) {
      case '热门':
        return [...pairs].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);
      case '涨幅榜':
        return [...pairs].sort((a, b) => b.change - a.change).slice(0, 5);
      case '跌幅榜':
        return [...pairs].sort((a, b) => a.change - b.change).slice(0, 5);
      case '新币':
        return [...pairs].reverse().slice(0, 5);
      case '自选':
      default:
        return pairs.slice(0, 5);
    }
  }, [activeTab, marketPairs, marketType]);

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
            <DropdownMenuRadioGroup value={marketType} onValueChange={(value) => setMarketType(value as MarketTypeFilter)}>
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
        {displayedPairs.map((pair) => (
          <button key={pair.symbol} className="block w-full text-left" onClick={() => openPair(pair.symbol)}>
            <MarketLine pair={pair} />
          </button>
        ))}
      </div>
    </div>
  );
}
