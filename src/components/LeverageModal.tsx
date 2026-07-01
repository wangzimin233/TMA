import { X } from 'lucide-react';
import { useTradeStore } from '../store/trade.store';

export function LeverageModal({ onClose }: { onClose: () => void }) {
  const selectedLeverage = useTradeStore((state) => state.selectedLeverage);
  const setLev = useTradeStore((state) => state.setSelectedLeverage);
  const lev = selectedLeverage ?? 10;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5">
      <div className="w-full max-w-[350px] rounded-xl border border-line bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <h2 className="text-[1rem] font-semibold">调整杠杆</h2>
          <button
            type="button"
            className="grid size-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-base hover:text-foreground"
            onClick={onClose}
            aria-label="关闭杠杆弹窗"
          >
            <X className="size-[18px]" />
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div className="grid h-12 grid-cols-[1fr_1.5fr_1fr] items-center rounded-lg border border-line bg-base px-3 text-center">
            <button
              type="button"
              className="h-full cursor-pointer text-[1.25rem] leading-none text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setLev(Math.max(1, lev - 1))}
            >
              −
            </button>
            <span className="font-mono text-[1.35rem] font-semibold text-brand">{lev}x</span>
            <button
              type="button"
              className="h-full cursor-pointer text-[1.25rem] leading-none text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setLev(Math.min(150, lev + 1))}
            >
              ＋
            </button>
          </div>
          <input
            className="h-5 w-full cursor-pointer accent-brand"
            type="range"
            min="1"
            max="150"
            value={lev}
            onChange={(event) => setLev(Number(event.target.value))}
          />
          <div className="flex justify-between text-[0.72rem] text-muted-foreground">
            {['1x', '25x', '50x', '100x', '150x'].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="rounded-lg border border-[#8C6B18]/70 bg-[#2C2714]/80 p-3 text-[0.76rem] leading-5 text-[#F2A900]">
            选择高杠杆如 10x 会增加强平风险。杠杆越高，您的仓位对市场波动越敏感。请确保您充分了解相关风险。
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-line p-4">
          <button
            type="button"
            className="h-10 cursor-pointer rounded-md border border-line text-[0.86rem] transition-colors hover:bg-base"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="h-10 cursor-pointer rounded-md bg-brand text-[0.86rem] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            onClick={onClose}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
