import { Bell } from 'lucide-react';

export function BrandHeader() {
  return (
    <header className="flex h-11 items-center justify-between border-b border-line bg-base px-4">
      <div className="flex items-center gap-3 text-brand">
        <div className="grid size-6 place-items-center rounded-full border-2 border-brand text-[0.75rem] font-black leading-none text-brand">S</div>
        <span className="text-[1.08rem] font-bold">CryptoTrade</span>
      </div>
      <Bell className="size-5 text-muted" />
    </header>
  );
}
