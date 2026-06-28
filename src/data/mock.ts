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

export type DepositNetwork = {
  key: 'ETH' | 'BSC' | 'TRX';
  name: string;
  standard: string;
  confirmations: number;
  minAmount: string;
  address: string;
};

export type DepositRecord = {
  id: string;
  network: DepositNetwork['key'];
  amount: string;
  status: 'confirmed' | 'pending';
  txid: string;
  time: string;
};

export const quickActions: QuickAction[] = [
  { label: '邀请好友', icon: UserRoundPlus },
  { label: '充值', icon: WalletCards },
  { label: '合约', icon: LineChart },
  { label: '现货', icon: Bot, hot: true },
];

export const depositNetworks: DepositNetwork[] = [
  {
    key: 'ETH',
    name: 'Ethereum',
    standard: 'ERC20',
    confirmations: 12,
    minAmount: '10 USDT',
    address: '0x7d8f3a9c2b1e6f405c8d24e17a9b6c3f2d5e8a91',
  },
  {
    key: 'BSC',
    name: 'BNB Smart Chain',
    standard: 'BEP20',
    confirmations: 15,
    minAmount: '5 USDT',
    address: '0x3b6a90d8124f65e0c9f7a142cde850b68193a47d',
  },
  {
    key: 'TRX',
    name: 'TRON',
    standard: 'TRC20',
    confirmations: 20,
    minAmount: '1 USDT',
    address: 'TQ9wK5gvd5fKxQm6PNe8BZL2mV7o4pHra9',
  },
];

export const depositRecords: DepositRecord[] = [
  {
    id: 'D20260611001',
    network: 'TRX',
    amount: '1,250.00 USDT',
    status: 'confirmed',
    txid: '9f42c6d18a0e3b55a9d4a2e8f7c39b12d7a98c40',
    time: '2026-06-11 10:42',
  },
  {
    id: 'D20260610018',
    network: 'BSC',
    amount: '680.00 USDT',
    status: 'pending',
    txid: '0x4b72f3d94c61a889e24f7f0945d5bbbd1ac02c7a',
    time: '2026-06-10 22:16',
  },
  {
    id: 'D20260609007',
    network: 'ETH',
    amount: '3,400.00 USDT',
    status: 'confirmed',
    txid: '0x92a8e7b63f4d5c019a16dfae7851c7f6b9a2230f',
    time: '2026-06-09 15:08',
  },
];
