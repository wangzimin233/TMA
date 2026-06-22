import { BarChart3, CandlestickChart, Home, User } from 'lucide-react';
import type { Tab } from '../types/app';

const tabs: Array<{ key: Tab; label: string; icon: typeof Home; code: string }> = [
  { key: 'home', label: '首页', icon: Home, code: '01' },
  { key: 'market', label: '行情', icon: BarChart3, code: '02' },
  { key: 'trade', label: '交易', icon: CandlestickChart, code: 'EX' },
  { key: 'profile', label: '我的', icon: User, code: '04' },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      aria-label="底部导航"
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-[#263241] bg-[#0f1620] pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_36px_rgba(3,7,12,0.42)]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(47,190,133,0),rgba(47,190,133,0.58),rgba(60,70,86,0.46),rgba(246,71,93,0.34),rgba(47,190,133,0))]" />
      <div className="pointer-events-none absolute inset-x-4 top-1 h-px bg-[#334255]/60" />
      <div className="grid h-[56px] grid-cols-4 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = active === tab.key;
          const isTrade = tab.key === 'trade';
          return (
            <button
              key={tab.key}
              aria-current={selected ? 'page' : undefined}
              type="button"
              className={`group relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-sm text-[0.6rem] font-semibold outline-none transition duration-150 active:scale-[0.97] ${
                selected ? 'text-[#eafff7]' : isTrade ? 'text-[#97a3b4]' : 'text-[#7f8a9b]'
              }`}
              onClick={() => onChange(tab.key)}
            >
              <span
                className={`absolute top-1 font-mono text-[0.46rem] leading-none tracking-[0.08em] transition ${
                  selected ? 'text-brand/90 opacity-100' : 'text-[#465365] opacity-65 group-hover:opacity-90'
                }`}
              >
                {tab.code}
              </span>
              <span
                className={`relative mt-1 grid h-[1.7rem] w-[2.35rem] place-items-center overflow-hidden transition ${
                  selected
                    ? 'text-brand'
                    : isTrade
                      ? 'text-[#a6b0bf] group-hover:text-ink'
                      : 'text-[#7f8a9b] group-hover:text-[#a6b0bf]'
                }`}
              >
                {selected && (
                  <>
                    <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-brand shadow-[0_0_10px_rgba(47,190,133,0.95)]" />
                    <span className="absolute inset-x-2 bottom-0 h-px bg-[linear-gradient(90deg,rgba(47,190,133,0),rgba(47,190,133,0.95),rgba(47,190,133,0))]" />
                  </>
                )}
                {isTrade && !selected && <span className="absolute bottom-0 h-px w-4 bg-[#f0b90b]/35" />}
                <Icon className={`size-[1.14rem] ${selected ? 'stroke-[2.35]' : 'stroke-[1.9]'}`} />
              </span>
              <span className={`leading-none transition ${selected ? 'text-brand' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
