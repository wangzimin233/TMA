import { create } from 'zustand';
import type { TradeLoginResponse, TradeUserProfile } from '../api/auth';

const ACCESS_TOKEN_KEY = 'access_token';

type AuthState = {
  token: string;
  userInfo: TradeUserProfile | TradeLoginResponse | null;
  isLogin: boolean;
  isHydrating: boolean;
  setSession: (session: TradeLoginResponse) => void;
  setToken: (token: string) => void;
  setUserInfo: (userInfo: TradeUserProfile | TradeLoginResponse | null) => void;
  setHydrating: (isHydrating: boolean) => void;
  clearSession: () => void;
};

const initialToken = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  userInfo: null,
  isLogin: Boolean(initialToken),
  isHydrating: Boolean(initialToken),
  setSession: (session) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.token);
    set({ token: session.token, userInfo: session, isLogin: true, isHydrating: false });
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    set({ token, isLogin: Boolean(token) });
  },
  setUserInfo: (userInfo) => set({ userInfo, isLogin: Boolean(userInfo) }),
  setHydrating: (isHydrating) => set({ isHydrating }),
  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    set({ token: '', userInfo: null, isLogin: false, isHydrating: false });
  },
}));
