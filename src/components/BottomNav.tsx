import { BarChart3, CandlestickChart, Home, User } from 'lucide-react';
import type { Tab } from '../types/app';

const tabs: Array<{ key: Tab; label: string; icon: typeof Home }> = [
  { key: 'home', label: '首页', icon: Home },
  { key: 'market', label: '行情', icon: BarChart3 },
  { key: 'trade', label: '交易', icon: CandlestickChart },
  { key: 'profile', label: '我的', icon: User },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 grid h-[52px] w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-[#232d3a] bg-base px-5 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.key;
        return (
          <button
            key={tab.key}
            className={`flex flex-col items-center justify-center gap-0.5 text-[0.56rem] font-normal outline-none transition-colors ${selected ? 'text-brand' : 'text-[#788495]'}`}
            onClick={() => onChange(tab.key)}
          >
            <span className="grid size-[1.25rem] place-items-center">
              <Icon className={`size-[1.08rem] ${selected ? 'stroke-[2.25]' : 'stroke-[1.9]'}`} />
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
