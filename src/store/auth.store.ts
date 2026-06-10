import { create } from 'zustand';

type UserInfo = {
  uid: string;
  nickname: string;
  vipLevel: number;
};

type AuthState = {
  token: string;
  userInfo: UserInfo | null;
  isLogin: boolean;
  setToken: (token: string) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: '',
  userInfo: {
    uid: '8493201',
    nickname: 'Trader_X99',
    vipLevel: 3,
  },
  isLogin: true,
  setToken: (token) => set({ token, isLogin: Boolean(token) }),
  setUserInfo: (userInfo) => set({ userInfo, isLogin: Boolean(userInfo) }),
  logout: () => set({ token: '', userInfo: null, isLogin: false }),
}));
