import { apiClient, requestData } from './client';
import type { PageResult } from './deposit';
import type { AccountAsset } from './account';
export type { AccountAsset } from './account';

export type WithdrawNetwork = {
  networkCode: string;
  networkName: string;
  chainCode: string;
  protocolType: string;
  minWithdrawAmount: number;
  withdrawFee: number;
  confirmCount: number;
  explorerUrl?: string | null;
  addressRegex?: string | null;
  memoSupport: number;
  contractAddress?: string | null;
};

export type WithdrawCoin = {
  coinCode: string;
  coinName: string;
  iconUrl?: string | null;
  decimals: number;
  displayDecimals: number;
  networks: WithdrawNetwork[];
};

export type WithdrawApplyPayload = {
  coinCode: string;
  networkCode: string;
  toAddress: string;
  memoTag?: string;
  amount: number;
  googleCode?: string;
  remark?: string;
};

export type WithdrawApplyResponse = {
  withdrawNo: string;
  coinCode: string;
  networkCode: string;
  applyAmount: number;
  feeAmount: number;
  actualAmount: number;
  availableBalance: number;
  frozenBalance: number;
  pendingWithdraw: number;
};

export type WithdrawOrder = {
  withdrawNo: string;
  coinCode: string;
  coinName: string;
  networkCode: string;
  networkName: string;
  toAddress: string;
  memoTag?: string | null;
  applyAmount: number;
  feeAmount: number;
  actualAmount: number;
  auditStatus: number;
  orderStatus: number;
  txid?: string | null;
  rejectReason?: string | null;
  paidTime?: string | null;
  createTime?: string | null;
};

export type WithdrawOrdersParams = {
  page?: number;
  pageSize?: number;
  coinCode?: string;
  auditStatus?: number;
  orderStatus?: number;
};

export type SecurityInfo = {
  withdrawGoogleAuthGlobalEnabled: boolean;
  hasLoginPassword: boolean;
  googleAuthBound: boolean;
  login2faEnabled: number;
  withdraw2faEnabled: number;
  deviceLockEnabled: number;
};

export type GoogleAuthBindInitResponse = {
  issuer: string;
  accountName: string;
  secret: string;
  otpauthUri: string;
  expireSeconds: number;
};

export type GoogleAuthBindConfirmPayload = {
  googleCode: string;
};

export function fetchWithdrawCoins() {
  return requestData<WithdrawCoin[]>(apiClient.get('/api/trade/wallet/withdraw/coins'));
}

export function fetchWithdrawOrders(params: WithdrawOrdersParams = {}) {
  return requestData<PageResult<WithdrawOrder>>(
    apiClient.get('/api/trade/wallet/withdraw/orders', {
      params: {
        page: 1,
        pageSize: 10,
        ...params,
      },
    }),
  );
}

export function applyWithdraw(payload: WithdrawApplyPayload) {
  return requestData<WithdrawApplyResponse>(apiClient.post('/api/trade/wallet/withdraw/apply', payload));
}

export function fetchFundAssets() {
  return requestData<AccountAsset[]>(apiClient.get('/api/trade/account/assets', { params: { accountType: 'FUND' } }));
}

export function fetchSecurityInfo() {
  return requestData<SecurityInfo>(apiClient.get('/api/trade/security/info'));
}

export function initWithdrawGoogleAuthBind() {
  return requestData<GoogleAuthBindInitResponse>(
    apiClient.post('/api/trade/security/google-auth/withdraw/bind/init'),
  );
}

export function confirmWithdrawGoogleAuthBind(payload: GoogleAuthBindConfirmPayload) {
  return requestData<void>(apiClient.post('/api/trade/security/google-auth/withdraw/bind/confirm', payload));
}
