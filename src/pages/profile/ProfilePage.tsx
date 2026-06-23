import { useQueryClient } from '@tanstack/react-query';
import { Bell, ChevronDown, Copy, FileText, Globe2, Home, LogOut, Shield, User, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { logoutTradeUser } from '../../api/auth';
import { getErrorMessage } from '../../api/client';
import { useUserAssets } from '../../hooks/useMockQueries';
import { useAuthStore } from '../../store/auth.store';

export function ProfilePage({
  onLoggedOut,
  openDeposit,
  openWithdraw,
}: {
  onLoggedOut: () => void;
  openDeposit: () => void;
  openWithdraw: () => void;
}) {
  const { data: assets } = useUserAssets();
  const queryClient = useQueryClient();
  const userInfo = useAuthStore((state) => state.userInfo);
  const clearSession = useAuthStore((state) => state.clearSession);
  const items = [
    { label: '资金记录', icon: WalletCards },
    { label: '订单记录', icon: FileText },
    { label: '邀请好友', icon: User, badge: 'New Rewards' },
    { label: '安全中心', icon: Shield },
    { label: '语言设置', icon: Globe2, value: '简体中文' },
    { label: '客户服务', icon: Bell },
  ];
  const displayName = userInfo?.nickname || userInfo?.email || '交易用户';
  const uid = userInfo?.uid || String(userInfo?.userId ?? '--');
  const userLevel = userInfo && 'userLevel' in userInfo ? userInfo.userLevel : 1;

  const logout = async () => {
    try {
      await logoutTradeUser();
      toast.success('已退出登录');
    } catch (error) {
      toast.error('退出登录失败', {
        description: getErrorMessage(error),
      });
    } finally {
      clearSession();
      queryClient.removeQueries({ queryKey: ['trade'] });
      onLoggedOut();
    }
  };

  return (
    <section className="px-4 pt-3.5">
      <div className="border-b border-line pb-3.5">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg border border-line bg-[radial-gradient(circle,#253449,#111821)] text-xl">👤</div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.18rem] font-semibold">{displayName}</h1>
            <div className="mt-1.5 flex items-center gap-2 text-[0.72rem] text-muted-foreground">
              <span className="rounded bg-brand px-2 py-0.5 text-[0.68rem] font-semibold text-white">LV {userLevel}</span>
              <span className="truncate">UID: {uid}</span>
              <Copy className="size-3.5 text-brand" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-line py-4">
        <p className="text-[0.72rem] text-muted-foreground">总资产折算</p>
        <div className="mt-2.5 flex items-end gap-2">
          <span className="text-[1.15rem]">$</span>
          <span className="font-mono text-[1.42rem] font-bold leading-none tabular-nums">{assets?.totalBalance ?? '45,231.89'}</span>
          <span className="pb-0.5 font-mono text-[0.78rem] text-brand tabular-nums">+{assets?.changePercent ?? 2.4}%</span>
        </div>
        <p className="mt-1.5 font-mono text-[0.82rem] text-muted-foreground tabular-nums">≈ {assets?.btcEstimate ?? '0.6432'} BTC</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button className="rounded bg-brand py-2.5 text-[0.92rem] font-semibold text-white" onClick={openDeposit}>充币</button>
          <button className="rounded border border-line bg-base2 py-2.5 text-[0.92rem] font-semibold" onClick={openWithdraw}>提币</button>
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
        <button className="flex w-full items-center gap-3 border-b border-line py-3 text-left" onClick={logout}>
          <span className="grid size-7 place-items-center rounded border border-line bg-soft text-danger">
            <LogOut className="size-[0.95rem]" />
          </span>
          <span className="flex-1 text-[0.9rem] text-danger">退出登录</span>
          <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
        </button>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <h2 className="mb-1.5 mt-4 text-[0.72rem] text-muted-foreground">{children}</h2>;
}

function ProfileRow({ label, icon: Icon, badge, value }: { label: string; icon: typeof Home; badge?: string; value?: string }) {
  return (
    <button className="flex w-full items-center gap-3 border-b border-line py-3 text-left">
      <span className="grid size-7 place-items-center rounded border border-line bg-soft text-brand">
        <Icon className="size-[0.95rem]" />
      </span>
      <span className="flex-1 text-[0.9rem]">{label}</span>
      {badge && <span className="rounded bg-[#B80F1B] px-2 py-0.5 text-[0.64rem] text-white">{badge}</span>}
      {value && <span className="text-[0.78rem] text-muted-foreground">{value}</span>}
      <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
    </button>
  );
}
