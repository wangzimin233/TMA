import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  LineChart,
  UserRoundPlus,
  WalletCards,
} from 'lucide-react';

export type QuickAction = {
  label: string;
  icon: LucideIcon;
  hot?: boolean;
};

export const quickActions: QuickAction[] = [
  { label: '邀请好友', icon: UserRoundPlus },
  { label: '充值', icon: WalletCards },
  { label: '合约', icon: LineChart },
  { label: '现货', icon: Bot, hot: true },
];
