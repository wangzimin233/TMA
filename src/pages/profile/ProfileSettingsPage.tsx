import { useQueryClient } from '@tanstack/react-query';
import { Bell, ChevronDown, ChevronLeft, Globe2, LogOut, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { logoutTradeUser } from '../../api/auth';
import { getErrorMessage } from '../../api/client';
import { Button } from '../../components/ui/button';
import { useAuthStore } from '../../store/auth.store';

type ProfileSettingsPageProps = {
  onBack: () => void;
  onLoggedOut: () => void;
};

const settingsItems: Array<{ label: string; icon: LucideIcon; value?: string }> = [
  { label: '安全中心', icon: Shield },
  { label: '语言设置', icon: Globe2, value: '简体中文' },
  { label: '客户服务', icon: Bell },
];

export function ProfileSettingsPage({ onBack, onLoggedOut }: ProfileSettingsPageProps) {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logoutTradeUser();
      toast.success('已退出登录');
    } catch (error) {
      toast.error('退出登录失败', {
        description: getErrorMessage(error),
      });
    } finally {
      clearSession();
      queryClient.removeQueries({ queryKey: ['trade'] });
      queryClient.removeQueries({ queryKey: ['account'] });
      queryClient.removeQueries({ queryKey: ['deposit'] });
      queryClient.removeQueries({ queryKey: ['withdraw'] });
      onLoggedOut();
    }
  };

  return (
    <section className="min-h-screen bg-base pb-[calc(18px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 flex h-11 items-center border-b border-line bg-base px-3">
        <Button
          aria-label="返回"
          className="size-8 rounded-md bg-transparent p-0 text-muted-foreground hover:bg-soft hover:text-ink"
          size="icon"
          variant="ghost"
          onClick={onBack}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-center text-[0.98rem] font-semibold">偏好设置</h1>
        <span className="size-8" />
      </header>

      <div className="px-4 pt-5">
        <div className="space-y-3">
          {settingsItems.map((item) => (
            <SettingsRow key={item.label} {...item} />
          ))}
          <button
            className="flex w-full items-center gap-3 border-b border-line py-3 text-left disabled:opacity-60"
            disabled={isLoggingOut}
            type="button"
            onClick={logout}
          >
            <span className="grid size-7 place-items-center rounded border border-line bg-soft text-danger">
              <LogOut className="size-[0.95rem]" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.9rem] font-semibold text-danger">退出登录</span>
            <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
}

function SettingsRow({ label, icon: Icon, value }: { label: string; icon: LucideIcon; value?: string }) {
  return (
    <button className="flex w-full items-center gap-3 border-b border-line py-3 text-left" type="button">
      <span className="grid size-7 place-items-center rounded border border-line bg-soft text-brand">
        <Icon className="size-[0.95rem]" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.9rem] font-semibold">{label}</span>
      {value && <span className="shrink-0 text-[0.78rem] text-muted-foreground">{value}</span>}
      <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
    </button>
  );
}
