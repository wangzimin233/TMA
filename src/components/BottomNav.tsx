import { BarChart3, CandlestickChart, Home, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { symbolFormat } from '../lib/utils';
import { useTradeStore } from '../store/trade.store';
import type { Tab } from '../types/app';

const tabs: Array<{ key: Tab; label: string; icon: typeof Home; to: string }> = [
  { key: 'home', label: '首页', icon: Home, to: '/' },
  { key: 'market', label: '行情', icon: BarChart3, to: '/market' },
  { key: 'trade', label: '交易', icon: CandlestickChart, to: '/trade' },
  { key: 'profile', label: '我的', icon: User, to: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const currentSymbol = useTradeStore((state) => state.currentSymbol);
  const normalizedSymbol = symbolFormat.normalize(currentSymbol);
  const tradePath = normalizedSymbol ? `/trade?symbol=${encodeURIComponent(symbolFormat.toApi(normalizedSymbol))}` : '';
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.to === location.pathname),
  );

  return (
    <nav
      aria-label="底部导航"
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-nav pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_28px_rgba(3,7,12,0.34)]"
    >
      <div className="relative grid h-[54px] grid-cols-4 px-2">
        <span
          aria-hidden="true"
          className="bottom-nav-active-pill absolute left-2 top-1.5 h-[42px] rounded-md border border-brand/10 bg-brand/10"
          style={{ width: 'calc((100% - 16px) / 4)', transform: `translateX(${activeIndex * 100}%)` }}
        />
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.key}
              to={tab.key === 'trade' && tradePath ? tradePath : tab.to}
              className={({ isActive }) =>
                `bottom-nav-link motion-pressable relative z-10 flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-md text-[0.6rem] outline-none ${
                  isActive ? 'font-semibold text-brand' : 'font-medium text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="bottom-nav-icon grid h-[1.55rem] place-items-center">
                    <Icon className={`size-[1.16rem] transition-[stroke-width] ${isActive ? 'stroke-[2.35]' : 'stroke-[1.95]'}`} />
                  </span>
                  <span className="bottom-nav-label leading-none">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
