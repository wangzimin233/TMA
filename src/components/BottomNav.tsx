import { BarChart3, CandlestickChart, Home, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { Tab } from '../types/app';

const tabs: Array<{ key: Tab; label: string; icon: typeof Home; to: string }> = [
  { key: 'home', label: '首页', icon: Home, to: '/' },
  { key: 'market', label: '行情', icon: BarChart3, to: '/market' },
  { key: 'trade', label: '交易', icon: CandlestickChart, to: '/trade' },
  { key: 'profile', label: '我的', icon: User, to: '/profile' },
];

export function BottomNav() {
  return (
    <nav
      aria-label="底部导航"
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-[#263241] bg-[#0f1620] pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_28px_rgba(3,7,12,0.34)]"
    >
      <div className="grid h-[54px] grid-cols-4 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.key}
              to={tab.to}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-sm text-[0.6rem] outline-none transition duration-150 active:scale-[0.97] ${
                  isActive ? 'font-semibold text-brand' : 'font-medium text-[#7f8a9b]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="grid h-[1.55rem] place-items-center">
                    <Icon className={`size-[1.16rem] ${isActive ? 'stroke-[2.35]' : 'stroke-[1.95]'}`} />
                  </span>
                  <span className="leading-none">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
