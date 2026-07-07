import { apiClient, requestData } from './client';

export type EmailCodeScene = 'REGISTER' | 'LOGIN';
export type EmailLoginMode = 'PASSWORD' | 'CODE';

export type TradeAuthType = 'EMAIL' | 'TELEGRAM' | string;

export type TradeUserBase = {
  userId: number;
  uid: string;
  nickname: string;
  avatar: string | null;
  email: string;
  tgUserId: string | null;
  tgUsername: string | null;
  primaryAuthType: TradeAuthType;
};

export type TradeLoginResponse = TradeUserBase & {
  token: string;
};

export type TradeUserProfile = TradeUserBase & {
  emailVerified: number;
  tgAuthStatus: number;
  inviteCode: string;
  userLevel: number;
  kycLevel: number;
  userStatus: number;
  lastLoginTime?: string;
};

export type SendEmailCodePayload = {
  email: string;
  scene: EmailCodeScene;
};

export type LoginByEmailPayload = {
  mode: EmailLoginMode;
  email: string;
  code?: string;
  password?: string;
};

export type RegisterByEmailPayload = {
  email: string;
  code: string;
  password: string;
  inviteCode?: string;
};

export function sendEmailCode(payload: SendEmailCodePayload) {
  return requestData<void>(apiClient.post('/api/trade/auth/email/code', payload));
}

export function loginByEmail(payload: LoginByEmailPayload) {
  return requestData<TradeLoginResponse>(apiClient.post('/api/trade/auth/email/login', payload));
}

export function registerByEmail(payload: RegisterByEmailPayload) {
  return requestData<TradeLoginResponse>(apiClient.post('/api/trade/auth/email/register', payload));
}

export function fetchTradeUser() {
  return requestData<TradeUserProfile>(apiClient.get('/api/trade/auth/me'));
}

export function logoutTradeUser() {
  return requestData<void>(apiClient.post('/api/trade/auth/logout'));
}
