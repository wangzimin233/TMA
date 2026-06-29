import { create } from 'zustand';

export type MarketMainTab = '自选' | '现货' | '合约' | '榜单';
export type MarketSubTab = '全部' | '热门' | '涨幅榜' | '跌幅榜';
export type HomeMarketTab = '自选' | '热门' | '涨幅榜' | '跌幅榜';
export type HomeMarketTypeFilter = '全部' | '现货' | '合约';

type MarketUiState = {
  mainTab: MarketMainTab;
  subTab: MarketSubTab;
  homeMarketTab: HomeMarketTab;
  homeMarketType: HomeMarketTypeFilter;
  searchQuery: string;
  showSearch: boolean;
  scrollY: number;
  hasSavedScroll: boolean;
  setMainTab: (mainTab: MarketMainTab) => void;
  setSubTab: (subTab: MarketSubTab) => void;
  setHomeMarketTab: (homeMarketTab: HomeMarketTab) => void;
  setHomeMarketType: (homeMarketType: HomeMarketTypeFilter) => void;
  setSearchQuery: (searchQuery: string) => void;
  setShowSearch: (showSearch: boolean) => void;
  saveScrollPosition: (scrollY: number) => void;
  resetScrollPosition: () => void;
};

export const useMarketUiStore = create<MarketUiState>((set) => ({
  mainTab: '现货',
  subTab: '全部',
  homeMarketTab: '热门',
  homeMarketType: '全部',
  searchQuery: '',
  showSearch: false,
  scrollY: 0,
  hasSavedScroll: false,
  setMainTab: (mainTab) => set({ mainTab }),
  setSubTab: (subTab) => set({ subTab }),
  setHomeMarketTab: (homeMarketTab) => set({ homeMarketTab }),
  setHomeMarketType: (homeMarketType) => set({ homeMarketType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setShowSearch: (showSearch) => set({ showSearch }),
  saveScrollPosition: (scrollY) => set({ scrollY: Math.max(0, scrollY), hasSavedScroll: true }),
  resetScrollPosition: () => set({ scrollY: 0, hasSavedScroll: true }),
}));
