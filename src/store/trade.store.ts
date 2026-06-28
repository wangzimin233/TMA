import { create } from 'zustand';
import type { SpotKlineParams, TradeMode } from '../types/app';

type TradeState = {
  currentSymbol: string;
  currentInterval: SpotKlineParams['interval'];
  selectedLeverage: number;
  tradeMode: TradeMode;
  showChart: boolean;
  setCurrentSymbol: (symbol: string) => void;
  setCurrentInterval: (interval: SpotKlineParams['interval']) => void;
  setSelectedLeverage: (leverage: number) => void;
  setTradeMode: (mode: TradeMode) => void;
  setShowChart: (showChart: boolean) => void;
};

export const useTradeStore = create<TradeState>((set) => ({
  currentSymbol: 'BTC/USDT',
  currentInterval: '15m',
  selectedLeverage: 10,
  tradeMode: 'spot',
  showChart: false,
  setCurrentSymbol: (currentSymbol) => set({ currentSymbol }),
  setCurrentInterval: (currentInterval) => set({ currentInterval }),
  setSelectedLeverage: (selectedLeverage) => set({ selectedLeverage }),
  setTradeMode: (tradeMode) => set({ tradeMode }),
  setShowChart: (showChart) => set({ showChart }),
}));
