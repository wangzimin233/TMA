import type { LucideIcon } from 'lucide-react';
import {
  Blocks,
  Bot,
  Gift,
  Headphones,
  LineChart,
  UserRoundPlus,
  WalletCards,
} from 'lucide-react';

export type MarketPair = {
  symbol: string;
  base: string;
  quote: string;
  price: string;
  fiat: string;
  change: number;
  volume: string;
  iconColor: string;
};

export type QuickAction = {
  label: string;
  icon: LucideIcon;
  hot?: boolean;
};

export const quickActions: QuickAction[] = [
  { label: '邀请好友', icon: UserRoundPlus },
  { label: '福利中心', icon: Gift, hot: true },
  { label: '充值', icon: WalletCards },
  { label: '合约', icon: LineChart },
  { label: '现货', icon: Bot, hot: true },
  { label: 'Superpairs', icon: Blocks },
  { label: '更多', icon: Blocks },
  { label: '客服', icon: Headphones },
];

export const marketPairs: MarketPair[] = [
  {
    symbol: 'BTC/USDT',
    base: 'BTC',
    quote: 'USDT',
    price: '62,025.38',
    fiat: '$61,977.75',
    change: -2.21,
    volume: '45.2K',
    iconColor: '#F7931A',
  },
  {
    symbol: 'ETH/USDT',
    base: 'ETH',
    quote: 'USDT',
    price: '1,655.62',
    fiat: '$1,654.34',
    change: -1.83,
    volume: '320K',
    iconColor: '#627EEA',
  },
  {
    symbol: 'BGB/USDT',
    base: 'BGB',
    quote: 'USDT',
    price: '1.7972',
    fiat: '$1.79',
    change: -1.99,
    volume: '1.2M',
    iconColor: '#13CDE2',
  },
  {
    symbol: 'XRP/USDT',
    base: 'XRP',
    quote: 'USDT',
    price: '1.1444',
    fiat: '$1.14',
    change: -2.63,
    volume: '320M',
    iconColor: '#7F8C8D',
  },
  {
    symbol: 'UNI/USDT',
    base: 'UNI',
    quote: 'USDT',
    price: '2.497',
    fiat: '$2.49',
    change: -3.81,
    volume: '980K',
    iconColor: '#FF4DA6',
  },
  {
    symbol: 'SOL/USDT',
    base: 'SOL',
    quote: 'USDT',
    price: '145.20',
    fiat: '$145.20',
    change: -0.46,
    volume: '5.1M',
    iconColor: '#14F195',
  },
  {
    symbol: 'BNB/USDT',
    base: 'BNB',
    quote: 'USDT',
    price: '600.50',
    fiat: '$600.50',
    change: 0.33,
    volume: '1.2M',
    iconColor: '#F3BA2F',
  },
];

export const marketRows = [
  { symbol: 'BTC/USDT', price: '64,230.00', fiat: '$64,230.00', change: 2.15, volume: '45.2K' },
  { symbol: 'ETH/USDT', price: '3,450.00', fiat: '$3,450.00', change: -1.14, volume: '320K' },
  { symbol: 'BNB/USDT', price: '600.50', fiat: '$600.50', change: 0.33, volume: '1.2M' },
  { symbol: 'SOL/USDT', price: '145.20', fiat: '$145.20', change: -0.46, volume: '5.1M' },
  { symbol: 'XRP/USDT', price: '0.5520', fiat: '$0.55', change: 0.47, volume: '320M' },
  { symbol: 'UNI/USDT', price: '9.50', fiat: '$9.50', change: -7.91, volume: '980K' },
];

export const asks = [
  ['61708.50', '0.125'],
  ['61705.20', '0.450'],
  ['61703.10', '1.200'],
  ['61701.00', '0.050'],
  ['61700.50', '0.210'],
];

export const bids = [
  ['61699.50', '0.180'],
  ['61698.00', '0.850'],
  ['61695.10', '0.020'],
  ['61692.00', '1.500'],
  ['61690.50', '0.340'],
];

export const contractAsks = [
  ['64,235.50', '1.245'],
  ['64,234.00', '0.850'],
  ['64,232.50', '0.420'],
  ['64,231.00', '3.105'],
  ['64,230.80', '2.100'],
];

export const contractBids = [
  ['64,229.00', '0.150'],
  ['64,228.50', '1.500'],
  ['64,227.00', '0.880'],
  ['64,225.50', '2.450'],
  ['64,224.00', '1.800'],
];

export const candleData = [
  34, 22, 46, 60, 82, 76, 44, 65, 36, 58, 71, 88, 92, 70, 63, 74, 55, 67, 69, 66,
];
