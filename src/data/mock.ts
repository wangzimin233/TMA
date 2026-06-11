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

export type MarketTicker = MarketPair & {
  high: string;
  low: string;
  turnover: string;
  delta: string;
};

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
  { label: '福利中心', icon: Gift, hot: true },
  { label: '充值', icon: WalletCards },
  { label: '合约', icon: LineChart },
  { label: '现货', icon: Bot, hot: true },
  { label: 'Superpairs', icon: Blocks },
  { label: '更多', icon: Blocks },
  { label: '客服', icon: Headphones },
];

export const tickerSource: MarketTicker[] = [
  {
    symbol: 'BTC/USDT',
    base: 'BTC',
    quote: 'USDT',
    price: '64,230.00',
    fiat: '$64,230.00',
    change: 2.15,
    volume: '45.2K',
    high: '65,120.50',
    low: '62,880.00',
    turnover: '29.08亿',
    delta: '1,354.24',
    iconColor: '#F7931A',
  },
  {
    symbol: 'ETH/USDT',
    base: 'ETH',
    quote: 'USDT',
    price: '3,450.00',
    fiat: '$3,450.00',
    change: -1.14,
    volume: '320K',
    high: '3,512.80',
    low: '3,392.40',
    turnover: '11.04亿',
    delta: '39.33',
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
    high: '1.8440',
    low: '1.7621',
    turnover: '216万',
    delta: '0.0365',
    iconColor: '#13CDE2',
  },
  {
    symbol: 'XRP/USDT',
    base: 'XRP',
    quote: 'USDT',
    price: '0.5520',
    fiat: '$0.55',
    change: 0.47,
    volume: '320M',
    high: '0.5684',
    low: '0.5410',
    turnover: '1.77亿',
    delta: '0.0026',
    iconColor: '#7F8C8D',
  },
  {
    symbol: 'UNI/USDT',
    base: 'UNI',
    quote: 'USDT',
    price: '9.50',
    fiat: '$9.50',
    change: -7.91,
    volume: '980K',
    high: '10.42',
    low: '9.31',
    turnover: '931万',
    delta: '0.815',
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
    high: '149.80',
    low: '142.76',
    turnover: '7.40亿',
    delta: '0.67',
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
    high: '606.90',
    low: '592.40',
    turnover: '7.21亿',
    delta: '1.98',
    iconColor: '#F3BA2F',
  },
  {
    symbol: 'DOGE/USDT',
    base: 'DOGE',
    quote: 'USDT',
    price: '0.1248',
    fiat: '$0.12',
    change: 3.26,
    volume: '1.8B',
    high: '0.1294',
    low: '0.1197',
    turnover: '2.25亿',
    delta: '0.0039',
    iconColor: '#C2A633',
  },
  {
    symbol: 'ADA/USDT',
    base: 'ADA',
    quote: 'USDT',
    price: '0.4382',
    fiat: '$0.43',
    change: -0.82,
    volume: '410M',
    high: '0.4470',
    low: '0.4315',
    turnover: '1.79亿',
    delta: '0.0036',
    iconColor: '#3468D1',
  },
  {
    symbol: 'AVAX/USDT',
    base: 'AVAX',
    quote: 'USDT',
    price: '28.64',
    fiat: '$28.64',
    change: 1.72,
    volume: '12.4M',
    high: '29.22',
    low: '27.91',
    turnover: '3.55亿',
    delta: '0.48',
    iconColor: '#E84142',
  },
  {
    symbol: 'LINK/USDT',
    base: 'LINK',
    quote: 'USDT',
    price: '14.82',
    fiat: '$14.82',
    change: 0.94,
    volume: '24.8M',
    high: '15.08',
    low: '14.45',
    turnover: '3.67亿',
    delta: '0.14',
    iconColor: '#2A5ADA',
  },
  {
    symbol: 'TRX/USDT',
    base: 'TRX',
    quote: 'USDT',
    price: '0.1186',
    fiat: '$0.11',
    change: 0.28,
    volume: '980M',
    high: '0.1201',
    low: '0.1169',
    turnover: '1.16亿',
    delta: '0.0003',
    iconColor: '#EF0027',
  },
  {
    symbol: 'DOT/USDT',
    base: 'DOT',
    quote: 'USDT',
    price: '6.72',
    fiat: '$6.72',
    change: -2.44,
    volume: '18.6M',
    high: '6.94',
    low: '6.58',
    turnover: '1.25亿',
    delta: '0.17',
    iconColor: '#E6007A',
  },
  {
    symbol: 'LTC/USDT',
    base: 'LTC',
    quote: 'USDT',
    price: '82.15',
    fiat: '$82.15',
    change: 1.06,
    volume: '3.4M',
    high: '83.20',
    low: '80.76',
    turnover: '2.79亿',
    delta: '0.86',
    iconColor: '#345D9D',
  },
  {
    symbol: 'ARB/USDT',
    base: 'ARB',
    quote: 'USDT',
    price: '0.9284',
    fiat: '$0.92',
    change: -4.12,
    volume: '92M',
    high: '0.9820',
    low: '0.9112',
    turnover: '8,541万',
    delta: '0.0399',
    iconColor: '#28A0F0',
  },
  {
    symbol: 'OP/USDT',
    base: 'OP',
    quote: 'USDT',
    price: '1.842',
    fiat: '$1.84',
    change: 2.08,
    volume: '44M',
    high: '1.895',
    low: '1.776',
    turnover: '8,105万',
    delta: '0.038',
    iconColor: '#FF0420',
  },
  {
    symbol: 'SUI/USDT',
    base: 'SUI',
    quote: 'USDT',
    price: '3.218',
    fiat: '$3.21',
    change: 5.61,
    volume: '88M',
    high: '3.280',
    low: '3.015',
    turnover: '2.83亿',
    delta: '0.171',
    iconColor: '#6FBCF0',
  },
  {
    symbol: 'APT/USDT',
    base: 'APT',
    quote: 'USDT',
    price: '8.37',
    fiat: '$8.37',
    change: -1.68,
    volume: '9.6M',
    high: '8.62',
    low: '8.21',
    turnover: '8,035万',
    delta: '0.14',
    iconColor: '#111111',
  },
  {
    symbol: 'NEAR/USDT',
    base: 'NEAR',
    quote: 'USDT',
    price: '5.48',
    fiat: '$5.48',
    change: 2.93,
    volume: '31M',
    high: '5.62',
    low: '5.28',
    turnover: '1.70亿',
    delta: '0.16',
    iconColor: '#00C08B',
  },
];

export const marketPairs: MarketPair[] = tickerSource.map(({ symbol, base, quote, price, fiat, change, volume, iconColor }) => ({
  symbol,
  base,
  quote,
  price,
  fiat,
  change,
  volume,
  iconColor,
}));

export const marketRows = tickerSource.map(({ symbol, price, fiat, change, volume }) => ({
  symbol,
  price,
  fiat,
  change,
  volume,
}));

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

export function getTickerBySymbol(symbol: string) {
  return tickerSource.find((ticker) => ticker.symbol === symbol) ?? tickerSource[0];
}

export const candleData = [
  34, 22, 46, 60, 82, 76, 44, 65, 36, 58, 71, 88, 92, 70, 63, 74, 55, 67, 69, 66,
];
