import { Bell } from 'lucide-react';

export function BrandHeader() {
  return (
    <header className="flex h-[52px] items-center justify-between border-b border-line bg-base px-4">
      <div className="flex items-center gap-3 text-brand">
        <div className="grid size-8 place-items-center rounded-full border-2 border-brand text-lg font-black">$</div>
        <span className="text-[22px] font-bold tracking-[-0.01em]">CryptoTrade</span>
      </div>
      <Bell className="size-6 text-muted" />
    </header>
  );
}
