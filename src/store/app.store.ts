import { create } from 'zustand';

type TelegramInfo = {
  userId?: string;
  username?: string;
  firstName?: string;
};

type AppState = {
  theme: 'dark';
  locale: 'zh-CN' | 'en-US';
  telegramInfo: TelegramInfo | null;
  setLocale: (locale: AppState['locale']) => void;
  setTelegramInfo: (telegramInfo: TelegramInfo | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  locale: 'zh-CN',
  telegramInfo: null,
  setLocale: (locale) => set({ locale }),
  setTelegramInfo: (telegramInfo) => set({ telegramInfo }),
}));
