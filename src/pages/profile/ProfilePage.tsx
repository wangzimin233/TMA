import { Bell, ChevronDown, Copy, FileText, Globe2, Home, Shield, User, WalletCards } from 'lucide-react';

export function ProfilePage() {
  const items = [
    { label: '资金记录', icon: WalletCards },
    { label: '订单记录', icon: FileText },
    { label: '邀请好友', icon: User, badge: 'New Rewards' },
    { label: '安全中心', icon: Shield },
    { label: '语言设置', icon: Globe2, value: '简体中文' },
    { label: '客户服务', icon: Bell },
  ];

  return (
    <section className="px-4 pt-6">
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-lg border-2 border-brand bg-[radial-gradient(circle,#1f6b65,#071414)] text-3xl">👤</div>
          <div>
            <h1 className="text-3xl font-bold">Trader_X99</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted">
              <span className="rounded bg-brand px-3 py-1 text-base text-white">VIP 3</span>
              <span>UID: 8493201</span>
              <Copy className="size-4 text-brand" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-card p-6">
        <p className="text-sm text-muted">总资产折算</p>
        <div className="mt-3 flex items-end gap-3">
          <span className="text-3xl">$</span>
          <span className="font-mono text-3xl font-bold">45,231.89</span>
          <span className="pb-1 font-mono text-brand">+2.4%</span>
        </div>
        <p className="mt-3 font-mono text-lg text-muted">≈ 0.6432 BTC</p>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button className="rounded bg-brand py-4 text-xl font-bold text-white">充币</button>
          <button className="rounded border border-muted py-4 text-xl font-bold">提币</button>
        </div>
      </div>

      <SectionLabel>活动</SectionLabel>
      <div className="space-y-3">
        {items.slice(0, 3).map((item) => (
          <ProfileRow key={item.label} {...item} />
        ))}
      </div>
      <SectionLabel>偏好设置</SectionLabel>
      <div className="space-y-3">
        {items.slice(3).map((item) => (
          <ProfileRow key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <h2 className="mb-3 mt-7 text-sm text-muted">{children}</h2>;
}

function ProfileRow({ label, icon: Icon, badge, value }: { label: string; icon: typeof Home; badge?: string; value?: string }) {
  return (
    <button className="flex w-full items-center gap-4 rounded-lg border border-line bg-card px-5 py-5 text-left">
      <span className="grid size-9 place-items-center rounded-full border border-line bg-soft text-brand">
        <Icon className="size-5" />
      </span>
      <span className="flex-1 text-lg">{label}</span>
      {badge && <span className="rounded-full bg-[#B80F1B] px-3 py-1 text-xs text-white">{badge}</span>}
      {value && <span className="text-muted">{value}</span>}
      <ChevronDown className="size-5 -rotate-90 text-muted" />
    </button>
  );
}
