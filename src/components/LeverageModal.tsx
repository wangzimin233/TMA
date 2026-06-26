import { X } from 'lucide-react';
import { useTradeStore } from '../store/trade.store';

export function LeverageModal({ onClose }: { onClose: () => void }) {
  const lev = useTradeStore((state) => state.selectedLeverage);
  const setLev = useTradeStore((state) => state.setSelectedLeverage);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6">
      <div className="w-full max-w-[390px] rounded-2xl border border-line bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-xl">调整杠杆</h2>
          <button onClick={onClose}>
            <X className="size-7 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-7 p-6">
          <div className="grid grid-cols-[1fr_1.5fr_1fr] items-center rounded-lg border border-line bg-base px-4 py-4 text-center text-2xl">
            <button onClick={() => setLev(Math.max(1, lev - 1))}>−</button>
            <span className="font-mono text-brand">{lev}x</span>
            <button onClick={() => setLev(Math.min(150, lev + 1))}>＋</button>
          </div>
          <input
            className="w-full accent-brand"
            type="range"
            min="1"
            max="150"
            value={lev}
            onChange={(event) => setLev(Number(event.target.value))}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            {['1x', '25x', '50x', '100x', '150x'].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="rounded-lg border border-[#8C6B18] bg-[#2C2714] p-4 text-sm leading-7 text-[#F2A900]">
            选择高杠杆如 10x 会增加强平风险。杠杆越高，您的仓位对市场波动越敏感。请确保您充分了解相关风险。
          </div>
          <label className="flex items-center justify-between text-lg">
            应用至所有交易对
            <input type="checkbox" className="size-6 accent-brand" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-line p-6">
          <button className="rounded border border-line py-4" onClick={onClose}>
            取消
          </button>
          <button className="rounded bg-brand py-4 font-semibold text-primary-foreground" onClick={onClose}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
