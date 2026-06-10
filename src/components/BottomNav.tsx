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
    <nav className="fixed bottom-0 left-1/2 z-20 grid h-[50px] w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-[#293342] bg-[#101722]/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.key;
        return (
          <button
            key={tab.key}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[0.62rem] outline-none transition-colors ${
              selected
                ? 'font-semibold text-brand after:absolute after:top-1 after:h-0.5 after:w-4 after:rounded-full after:bg-brand'
                : 'font-medium text-[#7d899a]'
            }`}
            onClick={() => onChange(tab.key)}
          >
            <Icon className={`size-[0.95rem] ${selected ? 'stroke-[2.3]' : 'stroke-[2]'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
