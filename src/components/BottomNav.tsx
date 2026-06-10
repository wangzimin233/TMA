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
    <nav className="fixed bottom-0 left-1/2 z-20 grid h-[72px] w-full max-w-[430px] -translate-x-1/2 grid-cols-4 rounded-t-lg border border-line bg-nav px-2 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.key;
        return (
          <button
            key={tab.key}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${selected ? 'text-brand' : 'text-muted'}`}
            onClick={() => onChange(tab.key)}
          >
            <Icon className="size-6" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
